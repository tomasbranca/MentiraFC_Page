import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  buildComputedStandings,
  createComparisonRowsForUpdate,
  createCurrentSnapshotDocument,
  createPublishedTableUpdatePlan,
  createSnapshotId,
  isValidDateTimeValue,
  isValidSanityDocumentId,
  toSnapshotRows,
  validateMatchdayTransition,
  validateStandingRowsAgainstParticipants,
} from './standingsSnapshot.js'

test('buildComputedStandings derives table positions and previous positions', () => {
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
  assert.equal(standings[0].previousPosition, 2)
  assert.equal(standings[1].previousPosition, 1)
  assert.equal(standings[2].previousPosition, null)
  assert.equal(standings[0].positionChange, undefined)
})

test('buildComputedStandings creates an alphabetical baseline for a new zero-point tournament', () => {
  const standings = buildComputedStandings({
    mainTeam: {
      _id: 'main',
      name: 'Mentira FC',
      isMain: true,
    },
    games: [],
    rows: [
      {
        team: {_id: 'zeta', name: 'Zeta FC'},
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
      {
        team: {_id: 'alpha', name: 'Alpha FC'},
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    ],
  })

  assert.deepEqual(
    standings.map((row) => [
      row.team.id,
      row.position,
      row.previousPosition,
    ]),
    [
      ['alpha', 1, 1],
      ['main', 2, 2],
      ['zeta', 3, 3],
    ],
  )
  assert.equal(standings[0].positionChange, undefined)
})

test('createComparisonRowsForUpdate preserves previous positions while editing the same matchday', () => {
  const comparisonRows = createComparisonRowsForUpdate({
    state: {
      matchdayNumber: 13,
    },
    currentSnapshot: {
      matchdayNumber: 13,
      rows: [
        {
          team: {_ref: 'alpha'},
          position: 1,
          previousPosition: 3,
        },
        {
          team: {_ref: 'beta'},
          position: 2,
          previousPosition: 1,
        },
      ],
    },
  })

  assert.deepEqual(
    comparisonRows.map((row) => [row.team._ref, row.position]),
    [
      ['alpha', 3],
      ['beta', 1],
    ],
  )
})

test('createComparisonRowsForUpdate uses current positions when matchday advances', () => {
  const comparisonRows = createComparisonRowsForUpdate({
    state: {
      matchdayNumber: 14,
    },
    currentSnapshot: {
      matchdayNumber: 13,
      rows: [
        {
          team: {_ref: 'alpha'},
          position: 1,
          previousPosition: 3,
        },
        {
          team: {_ref: 'beta'},
          position: 2,
          previousPosition: 1,
        },
      ],
    },
  })

  assert.deepEqual(
    comparisonRows.map((row) => [row.team._ref, row.position]),
    [
      ['alpha', 1],
      ['beta', 2],
    ],
  )
})

test('createSnapshotId and toSnapshotRows create deterministic Sanity payloads', () => {
  const snapshotId = createSnapshotId('tournament-1')
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
    wins: 1,
    draws: 1,
    losses: 0,
    goalsFor: 3,
    goalsAgainst: 1,
    position: 1,
    previousPosition: 2,
  })
  assert.equal(rows[0].positionChange, undefined)
  assert.equal(rows[0].played, undefined)
  assert.equal(rows[0].points, undefined)
  assert.equal(rows[0].goalDiff, undefined)
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

test('createPublishedTableUpdatePlan creates only the public table document', () => {
  const state = {
    matchdayNumber: 4,
    label: 'Fecha 4',
    snapshotDate: '2026-05-10T23:59:59Z',
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
  const updatePlan = createPublishedTableUpdatePlan({
    tournamentId: 'tournament-1',
    state,
    standings,
    obsoleteSnapshotIds: ['standings-snapshot-tournament-1-previous', 'bad/id'],
  })

  assert.equal(updatePlan.publishedSnapshot._id, 'standings-snapshot-tournament-1-current')
  assert.equal(updatePlan.publishedSnapshot.snapshotRole, undefined)
  assert.equal(updatePlan.publishedSnapshot.gamesThroughDate, undefined)
  assert.equal(updatePlan.publishedSnapshot.rows[0].positionChange, undefined)
  assert.deepEqual(updatePlan.deleteSnapshotIds, ['standings-snapshot-tournament-1-previous'])
})

test('validateMatchdayTransition blocks publishing an older matchday', () => {
  assert.deepEqual(
    validateMatchdayTransition({
      state: {matchdayNumber: 12},
      currentSnapshot: {matchdayNumber: 13},
    }),
    {
      valid: false,
      error: 'El numero de fecha (12) no puede ser menor que la tabla publicada actual (13).',
    },
  )

  assert.deepEqual(
    validateMatchdayTransition({
      state: {matchdayNumber: 14},
      currentSnapshot: {matchdayNumber: 13},
    }),
    {
      valid: true,
      error: null,
    },
  )
})

test('single public document keeps previous position stable while editing same matchday', () => {
  const tournamentId = 'tournament-1'
  const currentSnapshot = createCurrentSnapshotDocument({
    tournamentId,
    state: {
      matchdayNumber: 13,
      label: 'Fecha 13',
      snapshotDate: '2026-05-17T23:59:59Z',
    },
    standings: [
      {
        team: {id: 'alpha'},
        played: 13,
        wins: 7,
        draws: 2,
        losses: 4,
        goalsFor: 22,
        goalsAgainst: 12,
        points: 23,
        goalDiff: 10,
        position: 1,
        previousPosition: 3,
        positionChange: 2,
      },
      {
        team: {id: 'main'},
        played: 13,
        wins: 4,
        draws: 6,
        losses: 3,
        goalsFor: 51,
        goalsAgainst: 53,
        points: 18,
        goalDiff: -2,
        position: 2,
        previousPosition: 1,
        positionChange: -1,
      },
    ],
  })
  const state = {
    matchdayNumber: 13,
    label: 'Fecha 13',
    snapshotDate: '2026-05-18T23:59:59Z',
  }
  const standings = buildComputedStandings({
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
    previousRows: createComparisonRowsForUpdate({state, currentSnapshot}),
  })

  assert.equal(standings.find((row) => row.team.id === 'main')?.previousPosition, 1)
  assert.equal(standings.find((row) => row.team.id === 'alpha')?.previousPosition, 3)
})

test('single public document stores current positions as previous when matchday advances', () => {
  const tournamentId = 'tournament-1'
  const currentSnapshot = createCurrentSnapshotDocument({
    tournamentId,
    state: {
      matchdayNumber: 13,
      label: 'Fecha 13',
      snapshotDate: '2026-05-17T23:59:59Z',
    },
    standings: [
      {
        team: {id: 'alpha'},
        played: 13,
        wins: 7,
        draws: 2,
        losses: 4,
        goalsFor: 22,
        goalsAgainst: 12,
        points: 23,
        goalDiff: 10,
        position: 1,
        previousPosition: 3,
        positionChange: 2,
      },
      {
        team: {id: 'main'},
        played: 13,
        wins: 4,
        draws: 6,
        losses: 3,
        goalsFor: 51,
        goalsAgainst: 53,
        points: 18,
        goalDiff: -2,
        position: 2,
        previousPosition: 1,
        positionChange: -1,
      },
    ],
  })
  const state = {
    matchdayNumber: 14,
    label: 'Fecha 14',
    snapshotDate: '2026-05-24T23:59:59Z',
  }
  const standings = buildComputedStandings({
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
    previousRows: createComparisonRowsForUpdate({state, currentSnapshot}),
  })

  assert.equal(standings.find((row) => row.team.id === 'alpha')?.previousPosition, 1)
  assert.equal(standings.find((row) => row.team.id === 'main')?.previousPosition, 2)
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
  assert.match(source, /date < \$snapshotDate/)
  assert.doesNotMatch(source, /competition == "Torneo"/)
})

test('sync query deletes only other standingsSnapshots from the same tournament', () => {
  const source = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

  assert.match(source, /OBSOLETE_SNAPSHOTS_QUERY/)
  assert.match(source, /tournament\._ref == \$tournamentId/)
  assert.match(source, /_id != \$snapshotId/)
  assert.match(source, /PUBLISHED_TABLE_QUERY/)
  assert.match(source, /order\(snapshotDate desc, _updatedAt desc\)\[0\]/)
  assert.doesNotMatch(source, /positionChange/)
  assert.doesNotMatch(source, /snapshotRole in \["current", "previous"\]/)
})
