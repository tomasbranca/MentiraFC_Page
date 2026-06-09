import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {
  createComparisonRowsForUpdate,
  buildComputedStandings,
  createPublishedTableUpdatePlan,
  createSnapshotId,
  getPublishedId,
  isValidDateTimeValue,
  isValidSanityDocumentId,
  validateMatchdayTransition,
  validateStandingRowsAgainstParticipants,
} from './standingsSnapshot.js'

const API_VERSION = '2026-05-09'

const STANDINGS_STATE_QUERY = `
  *[_type == "standingsState" && _id == $stateId][0]{
    _id,
    matchdayNumber,
    label,
    snapshotDate,
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
    competition == "Torneo" &&
    defined(result.goalsFor) &&
    defined(result.goalsAgainst) &&
    tournament._ref == $tournamentId &&
    date < $snapshotDate
  ]{
    result{
      goalsFor,
      goalsAgainst
    }
  }
`

const OBSOLETE_SNAPSHOTS_QUERY = `
  *[
    _type == "standingsSnapshots" &&
    tournament._ref == $tournamentId &&
    _id != $snapshotId
  ]._id
`

const PUBLISHED_TABLE_QUERY = `
  *[
    _type == "standingsSnapshots" &&
    tournament._ref == $tournamentId
  ] | order(snapshotDate desc, _updatedAt desc)[0]{
    _id,
    _type,
    tournament,
    matchdayNumber,
    label,
    snapshotDate,
    rows[]{
      _key,
      _type,
      team,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      position,
      previousPosition
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

  if (!state?.tournament?._id || !state.matchdayNumber || !state.snapshotDate) {
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

  const publishedSnapshotId = createSnapshotId(tournamentId)
  const [games, publishedSnapshot, obsoleteSnapshotIds] = await Promise.all([
    client.fetch(FINISHED_MAIN_TEAM_GAMES_QUERY, {
      tournamentId,
      snapshotDate: state.snapshotDate,
    }),
    client.fetch(PUBLISHED_TABLE_QUERY, {
      tournamentId,
    }),
    client.fetch(OBSOLETE_SNAPSHOTS_QUERY, {
      tournamentId,
      snapshotId: publishedSnapshotId,
    }),
  ])
  const comparisonRows = createComparisonRowsForUpdate({
    state,
    currentSnapshot: publishedSnapshot,
  })
  const matchdayValidation = validateMatchdayTransition({
    state,
    currentSnapshot: publishedSnapshot,
  })

  if (!matchdayValidation.valid) {
    throw new Error(matchdayValidation.error)
  }

  const standings = buildComputedStandings({
    rows: state.rows || [],
    games: games || [],
    mainTeam,
    previousRows: comparisonRows,
  })
  const updatePlan = createPublishedTableUpdatePlan({
    tournamentId,
    state,
    standings,
    obsoleteSnapshotIds: obsoleteSnapshotIds || [],
  })
  let transaction = client.transaction()

  for (const obsoleteSnapshotId of updatePlan.deleteSnapshotIds) {
    if (isValidSanityDocumentId(obsoleteSnapshotId)) {
      transaction = transaction.delete(obsoleteSnapshotId)
    }
  }

  await transaction.createOrReplace(updatePlan.publishedSnapshot).commit({
    visibility: 'sync',
  })

  const writtenSnapshot = await client.fetch('*[_id == $snapshotId][0]{_id}', {
    snapshotId: publishedSnapshotId,
  })

  if (!writtenSnapshot?._id) {
    console.warn('sync-standings-snapshot could not verify written snapshot', {
      stateId,
      snapshotId: publishedSnapshotId,
    })
  }

  console.log('sync-standings-snapshot wrote published table', {
    stateId,
    snapshotId: publishedSnapshotId,
    deletedSnapshots: updatePlan.deleteSnapshotIds.length,
    rows: standings.length,
  })
})
