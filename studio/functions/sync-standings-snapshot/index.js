import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

import {
  buildComputedStandings,
  createSnapshotId,
  getPublishedId,
  toSnapshotRows,
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
    competition == "Torneo" &&
    tournament._ref == $tournamentId &&
    date <= $gamesThroughDate
  ]{
    result{
      goalsFor,
      goalsAgainst
    }
  }
`

const PREVIOUS_SNAPSHOT_QUERY = `
  *[
    _type == "standingsSnapshots" &&
    tournament._ref == $tournamentId &&
    matchdayNumber < $matchdayNumber
  ] | order(matchdayNumber desc)[0]{
    rows[]{
      position,
      team->{
        _id
      }
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

  const tournamentId = state.tournament._id
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

  const [games, previousSnapshot] = await Promise.all([
    client.fetch(FINISHED_MAIN_TEAM_GAMES_QUERY, {
      tournamentId,
      gamesThroughDate: state.gamesThroughDate,
    }),
    client.fetch(PREVIOUS_SNAPSHOT_QUERY, {
      tournamentId,
      matchdayNumber: state.matchdayNumber,
    }),
  ])
  const standings = buildComputedStandings({
    rows: state.rows || [],
    games: games || [],
    mainTeam,
    previousRows: previousSnapshot?.rows || [],
  })
  const snapshotId = createSnapshotId(tournamentId, state.matchdayNumber)

  await client.createOrReplace({
    _id: snapshotId,
    _type: 'standingsSnapshots',
    tournament: {
      _type: 'reference',
      _ref: tournamentId,
    },
    matchdayNumber: state.matchdayNumber,
    label: state.label || null,
    snapshotDate: state.snapshotDate,
    gamesThroughDate: state.gamesThroughDate,
    rows: toSnapshotRows(standings),
  }, {
    visibility: 'sync',
  })

  const writtenSnapshot = await client.fetch('*[_id == $snapshotId][0]{_id}', {snapshotId})

  if (!writtenSnapshot?._id) {
    console.warn('sync-standings-snapshot could not verify written snapshot', {
      stateId,
      snapshotId,
    })
  }

  console.log('sync-standings-snapshot wrote snapshot', {
    stateId,
    snapshotId,
    rows: standings.length,
  })
})
