import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {
  SNAPSHOT_ROLES,
  buildComputedStandings,
  createSnapshotId,
  createSnapshotRotationPlan,
  getPublishedId,
  isValidDateTimeValue,
  isValidSanityDocumentId,
  validateStandingRowsAgainstParticipants,
} from './standingsSnapshot.js'

const API_VERSION = '2026-05-09'

const STANDINGS_STATE_QUERY = `
  *[_type == "standingsState" && _id == $stateId][0]{
    _id,
    matchdayNumber,
    label,
    snapshotDate,
    gamesThroughDate,
    tournament->{
      _id,
      participants[]{
        status,
        activeFromMatchday,
        activeUntilMatchday,
        team->{
          _id,
          name,
          isMain
        }
      }
    },
    rows[]{
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      team->{
        _id,
        name,
        isMain
      }
    }
  }
`

const MAIN_TEAM_QUERY = `
  *[_type == "teams" && isMain == true][0]{
    _id,
    name,
    isMain
  }
`

const FINISHED_MAIN_TEAM_GAMES_QUERY = `
  *[
    _type == "games" &&
    state == "finalizado" &&
    defined(result.goalsFor) &&
    defined(result.goalsAgainst) &&
    tournament._ref == $tournamentId &&
    date <= $gamesThroughDate
  ]{
    result{
      goalsFor,
      goalsAgainst
    }
  }
`

const MANAGED_SNAPSHOTS_QUERY = `
  *[
    _type == "standingsSnapshots" &&
    _id in $snapshotIds
  ]{
    _id,
    _type,
    snapshotRole,
    tournament,
    matchdayNumber,
    label,
    snapshotDate,
    gamesThroughDate,
    rows[]{
      _key,
      _type,
      team,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
      goalDiff,
      position,
      previousPosition,
      positionChange
    }
  }
`

const createFunctionClient = (context) =>
  createClient({
    ...context.clientOptions,
    apiVersion: API_VERSION,
    useCdn: false,
  })

export const handler = documentEventHandler(async ({context, event}) => {
  const stateId = getPublishedId(event?.data?._id)

  if (!stateId) {
    console.warn('sync-standings-snapshot skipped: missing standingsState id')
    return
  }

  const client = createFunctionClient(context)
  const state = await client.fetch(STANDINGS_STATE_QUERY, {stateId})

  if (!state?.tournament?._id || !state.matchdayNumber || !state.gamesThroughDate) {
    console.warn('sync-standings-snapshot skipped: incomplete standingsState', {stateId})
    return
  }

  const tournamentId = getPublishedId(state.tournament._id)

  if (!isValidSanityDocumentId(tournamentId)) {
    throw new Error(`Invalid standingsState tournamentId: ${tournamentId || 'missing'}`)
  }

  if (!isValidDateTimeValue(state.snapshotDate)) {
    throw new Error(`Invalid standingsState snapshotDate: ${state.snapshotDate || 'missing'}`)
  }

  if (!isValidDateTimeValue(state.gamesThroughDate)) {
    throw new Error(`Invalid standingsState gamesThroughDate: ${state.gamesThroughDate || 'missing'}`)
  }

  const mainTeam = await client.fetch(MAIN_TEAM_QUERY)
  const rowValidation = validateStandingRowsAgainstParticipants({
    rows: state.rows || [],
    participants: state.tournament.participants || [],
    mainTeam,
    matchdayNumber: state.matchdayNumber,
  })

  if (!rowValidation.valid) {
    console.warn('sync-standings-snapshot rejected standingsState rows', {
      stateId,
      tournamentId,
      errors: rowValidation.errors,
    })

    throw new Error(`Invalid standingsState rows: ${rowValidation.errors.join(' ')}`)
  }

  const currentSnapshotId = createSnapshotId(tournamentId, SNAPSHOT_ROLES.CURRENT)
  const previousSnapshotId = createSnapshotId(tournamentId, SNAPSHOT_ROLES.PREVIOUS)
  const [games, managedSnapshots] = await Promise.all([
    client.fetch(FINISHED_MAIN_TEAM_GAMES_QUERY, {
      tournamentId,
      gamesThroughDate: state.gamesThroughDate,
    }),
    client.fetch(MANAGED_SNAPSHOTS_QUERY, {
      snapshotIds: [currentSnapshotId, previousSnapshotId],
    }),
  ])
  const snapshotsById = (managedSnapshots || []).reduce((acc, snapshot) => {
    if (snapshot?._id) acc[snapshot._id] = snapshot
    return acc
  }, {})
  const previousCurrentSnapshot = snapshotsById[currentSnapshotId] || null
  const oldPreviousSnapshot = snapshotsById[previousSnapshotId] || null
  const standings = buildComputedStandings({
    rows: state.rows || [],
    games: games || [],
    mainTeam,
    previousRows: previousCurrentSnapshot?.rows || [],
  })
  const rotation = createSnapshotRotationPlan({
    tournamentId,
    state,
    standings,
    previousCurrentSnapshot,
    oldPreviousSnapshot,
  })
  let transaction = client.transaction()

  if (rotation.previousSnapshot) {
    transaction = transaction.createOrReplace(rotation.previousSnapshot)
  } else if (rotation.deletePreviousSnapshotId) {
    transaction = transaction.delete(rotation.deletePreviousSnapshotId)
  }

  await transaction.createOrReplace(rotation.currentSnapshot).commit({
    visibility: 'sync',
  })

  const writtenSnapshot = await client.fetch('*[_id == $snapshotId][0]{_id}', {
    snapshotId: currentSnapshotId,
  })

  if (!writtenSnapshot?._id) {
    console.warn('sync-standings-snapshot could not verify written snapshot', {
      stateId,
      snapshotId: currentSnapshotId,
    })
  }

  console.log('sync-standings-snapshot wrote snapshot', {
    stateId,
    snapshotId: currentSnapshotId,
    previousSnapshotId: rotation.previousSnapshot ? previousSnapshotId : null,
    rows: standings.length,
  })
})
