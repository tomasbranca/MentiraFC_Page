import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  SNAPSHOT_ROLES,
  buildComputedStandings,
  createCurrentSnapshotDocument,
  createSnapshotId,
  createSnapshotRotationPlan,
  isValidDateTimeValue,
  isValidSanityDocumentId,
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
      {result: null},
      {result: {goalsFor: null, goalsAgainst: 0}},
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
  const snapshotId = createSnapshotId('tournament-1', SNAPSHOT_ROLES.CURRENT)
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

  assert.equal(snapshotId, 'standings-snapshot-tournament-1-current')
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

test('validators accept safe ids and datetimes only', () => {
  assert.equal(isValidSanityDocumentId('tournament-1'), true)
  assert.equal(isValidSanityDocumentId('drafts.tournament-1'), true)
  assert.equal(isValidSanityDocumentId('bad/id'), false)
  assert.equal(isValidSanityDocumentId(''), false)
  assert.equal(isValidDateTimeValue('2026-05-24T23:59:59Z'), true)
  assert.equal(isValidDateTimeValue('not-a-date'), false)
  assert.equal(isValidDateTimeValue(''), false)
})

test('createSnapshotRotationPlan creates a new current snapshot when there is no previous current', () => {
  const state = {
    matchdayNumber: 4,
    label: 'Fecha 4',
    snapshotDate: '2026-05-10T23:59:59Z',
    gamesThroughDate: '2026-05-10T23:59:59Z',
  }
  const standings = buildComputedStandings({
    mainTeam: {_id: 'main', name: 'Mentira FC', isMain: true},
    games: [{result: {goalsFor: 2, goalsAgainst: 0}}],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 0,
        draws: 0,
        losses: 1,
        goalsFor: 0,
        goalsAgainst: 2,
      },
    ],
  })
  const rotation = createSnapshotRotationPlan({
    tournamentId: 'tournament-1',
    state,
    standings,
  })

  assert.equal(rotation.currentSnapshot._id, 'standings-snapshot-tournament-1-current')
  assert.equal(rotation.currentSnapshot.snapshotRole, 'current')
  assert.equal(rotation.previousSnapshot, null)
  assert.equal(rotation.deletePreviousSnapshotId, null)
  assert.equal(rotation.currentSnapshot.rows[0].positionChange, undefined)
})

test('createSnapshotRotationPlan moves the old current snapshot to previous', () => {
  const tournamentId = 'tournament-1'
  const oldState = {
    matchdayNumber: 6,
    label: 'Fecha 6',
    snapshotDate: '2026-05-17T23:59:59Z',
    gamesThroughDate: '2026-05-17T23:59:59Z',
  }
  const newState = {
    matchdayNumber: 7,
    label: 'Fecha 7',
    snapshotDate: '2026-05-24T23:59:59Z',
    gamesThroughDate: '2026-05-24T23:59:59Z',
  }
  const oldCurrentStandings = buildComputedStandings({
    mainTeam: {_id: 'main', name: 'Mentira FC', isMain: true},
    games: [{result: {goalsFor: 1, goalsAgainst: 0}}],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 0,
        draws: 1,
        losses: 0,
        goalsFor: 1,
        goalsAgainst: 1,
      },
    ],
  })
  const previousCurrentSnapshot = createCurrentSnapshotDocument({
    tournamentId,
    state: oldState,
    standings: oldCurrentStandings,
  })
  const oldPreviousSnapshot = {
    _id: createSnapshotId(tournamentId, SNAPSHOT_ROLES.PREVIOUS),
    label: 'Fecha 5',
  }
  const newStandings = buildComputedStandings({
    mainTeam: {_id: 'main', name: 'Mentira FC', isMain: true},
    games: [
      {result: {goalsFor: 1, goalsAgainst: 0}},
      {result: {goalsFor: 0, goalsAgainst: 2}},
    ],
    rows: [
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 2,
        draws: 0,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 0,
      },
    ],
    previousRows: previousCurrentSnapshot.rows,
  })
  const rotation = createSnapshotRotationPlan({
    tournamentId,
    state: newState,
    standings: newStandings,
    previousCurrentSnapshot,
    oldPreviousSnapshot,
  })

  assert.equal(rotation.previousSnapshot?._id, 'standings-snapshot-tournament-1-previous')
  assert.equal(rotation.previousSnapshot?.snapshotRole, 'previous')
  assert.equal(rotation.previousSnapshot?.label, 'Fecha 6')
  assert.notEqual(rotation.previousSnapshot?.label, oldPreviousSnapshot.label)
  assert.equal(rotation.deletePreviousSnapshotId, null)
  assert.equal(rotation.currentSnapshot.snapshotRole, 'current')
  assert.equal(rotation.currentSnapshot.label, 'Fecha 7')
  assert.equal(rotation.currentSnapshot.rows[0].positionChange, 1)
})

test('createSnapshotRotationPlan deletes old previous when there is no current to compare', () => {
  const tournamentId = 'tournament-1'
  const rotation = createSnapshotRotationPlan({
    tournamentId,
    state: {
      matchdayNumber: 1,
      label: 'Fecha 1',
      snapshotDate: '2026-05-03T23:59:59Z',
      gamesThroughDate: '2026-05-03T23:59:59Z',
    },
    standings: [],
    oldPreviousSnapshot: {
      _id: createSnapshotId(tournamentId, SNAPSHOT_ROLES.PREVIOUS),
    },
  })

  assert.equal(rotation.previousSnapshot, null)
  assert.equal(rotation.deletePreviousSnapshotId, 'standings-snapshot-tournament-1-previous')
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

test('sync query uses finalized games by tournament reference instead of competition label', () => {
  const source = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

  assert.match(source, /state == "finalizado"/)
  assert.match(source, /tournament\._ref == \$tournamentId/)
  assert.match(source, /date <= \$gamesThroughDate/)
  assert.doesNotMatch(source, /competition == "Torneo"/)
})
