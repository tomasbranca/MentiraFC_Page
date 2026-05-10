import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildComputedStandings,
  createSnapshotId,
  toSnapshotRows,
  validateStandingRowsAgainstParticipants,
} from './standingsSnapshot.js'

test('buildComputedStandings derives table positions and movement', () => {
  const standings = buildComputedStandings({
    mainTeam: {
      _id: 'main',
      name: 'Mentira FC',
      isMain: true,
    },
    games: [
      {result: {goalsFor: 1, goalsAgainst: 1}},
      {result: {goalsFor: 2, goalsAgainst: 0}},
    ],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 2,
      },
      {
        team: {_id: 'beta', name: 'Beta FC'},
        wins: 0,
        draws: 1,
        losses: 1,
        goalsFor: 1,
        goalsAgainst: 3,
      },
    ],
    previousRows: [
      {
        team: {_id: 'alpha'},
        position: 1,
      },
      {
        team: {_id: 'main'},
        position: 2,
      },
    ],
  })

  assert.deepEqual(
    standings.map((row) => [row.team.id, row.played, row.points, row.goalDiff, row.position]),
    [
      ['main', 2, 4, 2, 1],
      ['alpha', 2, 3, 0, 2],
      ['beta', 2, 1, -2, 3],
    ],
  )
  assert.equal(standings[0].positionChange, 1)
  assert.equal(standings[1].positionChange, -1)
  assert.equal(standings[2].positionChange, null)
})

test('createSnapshotId and toSnapshotRows create deterministic Sanity payloads', () => {
  const snapshotId = createSnapshotId('tournament-1', 7)
  const rows = toSnapshotRows([
    {
      team: {id: 'main'},
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      points: 4,
      goalDiff: 2,
      position: 1,
      previousPosition: 2,
      positionChange: 1,
    },
  ])

  assert.equal(snapshotId, 'standings-snapshot-tournament-1-7')
  assert.deepEqual(rows[0], {
    _key: 'main',
    _type: 'standingSnapshotRow',
    team: {
      _type: 'reference',
      _ref: 'main',
    },
    played: 2,
    wins: 1,
    draws: 1,
    losses: 0,
    goalsFor: 3,
    goalsAgainst: 1,
    points: 4,
    goalDiff: 2,
    position: 1,
    previousPosition: 2,
    positionChange: 1,
  })
})

test('validateStandingRowsAgainstParticipants accepts active tournament teams only', () => {
  const validation = validateStandingRowsAgainstParticipants({
    mainTeam: {_id: 'main', name: 'Mentira FC', isMain: true},
    matchdayNumber: 10,
    participants: [
      {
        status: 'active',
        team: {_id: 'alpha', name: 'Alpha FC'},
      },
      {
        status: 'replaced',
        activeUntilMatchday: 9,
        team: {_id: 'beta', name: 'Beta FC'},
      },
      {
        status: 'active',
        activeFromMatchday: 10,
        team: {_id: 'gamma', name: 'Gamma FC'},
      },
    ],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 2,
      },
      {
        team: {_id: 'gamma', name: 'Gamma FC'},
        wins: 0,
        draws: 1,
        losses: 1,
        goalsFor: 1,
        goalsAgainst: 3,
      },
    ],
  })

  assert.equal(validation.valid, true)
  assert.deepEqual(
    validation.activeParticipants.map((team) => team.id),
    ['alpha', 'gamma'],
  )
})

test('validateStandingRowsAgainstParticipants rejects random, duplicate, missing, and main teams', () => {
  const validation = validateStandingRowsAgainstParticipants({
    mainTeam: {_id: 'main', name: 'Mentira FC', isMain: true},
    matchdayNumber: 3,
    participants: [
      {
        status: 'active',
        team: {_id: 'alpha', name: 'Alpha FC'},
      },
      {
        status: 'active',
        team: {_id: 'beta', name: 'Beta FC'},
      },
    ],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
      },
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 0,
        draws: 1,
        losses: 0,
        goalsFor: 1,
        goalsAgainst: 1,
      },
      {
        team: {_id: 'random', name: 'Random FC'},
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 0,
        goalsAgainst: 2,
      },
      {
        team: {_id: 'main', name: 'Mentira FC', isMain: true},
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 3,
        goalsAgainst: 1,
      },
    ],
  })
  const errors = validation.errors.join('\n')

  assert.equal(validation.valid, false)
  assert.match(errors, /Equipo repetido/)
  assert.match(errors, /Equipo fuera/)
  assert.match(errors, /Mentira FC/)
  assert.match(errors, /Falta cargar/)
})
