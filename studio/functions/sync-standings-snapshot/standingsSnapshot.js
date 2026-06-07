const DEFAULT_LOCALE = 'es'
const SANITY_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_.-]{1,200}$/

export const SNAPSHOT_ROLES = {
  CURRENT: 'current',
  PREVIOUS: 'previous',
}

export const getPublishedId = (id) =>
  typeof id === 'string' ? id.replace(/^drafts\./, '') : null

export const isValidSanityDocumentId = (id) =>
  typeof id === 'string' && SANITY_DOCUMENT_ID_PATTERN.test(id)

export const isValidDateTimeValue = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false

  return Number.isFinite(Date.parse(value))
}

const normalizeNumber = (value) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.floor(numberValue) : 0
}

const normalizeTeam = (team) => {
  const id = getPublishedId(team?._id || team?._ref || team?.id)

  if (!id) return null

  return {
    id,
    name: team.name || 'Equipo',
    isMain: Boolean(team.isMain),
  }
}

const normalizeManualRow = (row) => {
  const team = normalizeTeam(row?.team)

  if (!team) return null

  const wins = normalizeNumber(row.wins)
  const draws = normalizeNumber(row.draws)
  const losses = normalizeNumber(row.losses)
  const goalsFor = normalizeNumber(row.goalsFor)
  const goalsAgainst = normalizeNumber(row.goalsAgainst)

  return {
    team,
    played: wins + draws + losses,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
  }
}

const calculatePoints = (row) => row.wins * 3 + row.draws
const calculateGoalDiff = (row) => row.goalsFor - row.goalsAgainst

const normalizeMatchdayBoundary = (value) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue >= 1 ? Math.floor(numberValue) : null
}

const isParticipantActiveForMatchday = (participant, matchdayNumber) => {
  const matchday = normalizeMatchdayBoundary(matchdayNumber)
  const from = normalizeMatchdayBoundary(participant?.activeFromMatchday)
  const until = normalizeMatchdayBoundary(participant?.activeUntilMatchday)
  const status = participant?.status || 'active'

  if (!matchday) return false
  if (from && matchday < from) return false
  if (until && matchday > until) return false
  if (status !== 'active' && !until) return false

  return true
}

const getDuplicateId = (ids) => ids.find((id, index) => ids.indexOf(id) !== index)

const getTeamLabel = (team) => team?.name || team?.id || 'Equipo sin referencia'

const isMainTeam = (team, mainTeam) => Boolean(team?.isMain || team?.id === mainTeam?.id)

export const validateStandingRowsAgainstParticipants = ({
  rows = [],
  participants = [],
  mainTeam = null,
  matchdayNumber,
} = {}) => {
  const errors = []
  const normalizedMainTeam = normalizeTeam(mainTeam)
  const normalizedParticipants = participants.map((participant, index) => ({
    index,
    participant,
    team: normalizeTeam(participant?.team),
  }))

  normalizedParticipants.forEach(({index, team}) => {
    if (!team) {
      errors.push(`Participante ${index + 1} no tiene un equipo valido.`)
      return
    }

    if (isMainTeam(team, normalizedMainTeam)) {
      errors.push('Mentira FC no debe estar cargado como participante del torneo.')
    }
  })

  const activeParticipants = normalizedParticipants.filter(
    ({participant, team}) =>
      team &&
      !isMainTeam(team, normalizedMainTeam) &&
      isParticipantActiveForMatchday(participant, matchdayNumber),
  )
  const activeParticipantIds = activeParticipants.map(({team}) => team.id)
  const duplicateParticipantId = getDuplicateId(activeParticipantIds)

  if (activeParticipants.length === 0) {
    errors.push('El torneo no tiene participantes activos para esta fecha.')
  }

  if (duplicateParticipantId) {
    const duplicateParticipant = activeParticipants.find(({team}) => team.id === duplicateParticipantId)
    errors.push(`Participante activo repetido: ${getTeamLabel(duplicateParticipant?.team)}.`)
  }

  const activeParticipantIdsSet = new Set(activeParticipantIds)
  const normalizedRows = rows.map((row, index) => ({
    index,
    row,
    team: normalizeTeam(row?.team),
  }))
  const rowTeamIds = normalizedRows.map(({team}) => team?.id).filter(Boolean)
  const duplicateRowTeamId = getDuplicateId(rowTeamIds)

  normalizedRows.forEach(({index, team}) => {
    if (!team) {
      errors.push(`Fila ${index + 1} no tiene un equipo valido.`)
      return
    }

    if (isMainTeam(team, normalizedMainTeam)) {
      errors.push('Mentira FC no debe estar cargado en Tabla actual.')
      return
    }

    if (!activeParticipantIdsSet.has(team.id)) {
      errors.push(`Equipo fuera de participantes activos: ${getTeamLabel(team)}.`)
    }
  })

  if (duplicateRowTeamId) {
    const duplicateRow = normalizedRows.find(({team}) => team?.id === duplicateRowTeamId)
    errors.push(`Equipo repetido en Tabla actual: ${getTeamLabel(duplicateRow?.team)}.`)
  }

  const rowTeamIdsSet = new Set(rowTeamIds)
  activeParticipants.forEach(({team}) => {
    if (!rowTeamIdsSet.has(team.id)) {
      errors.push(`Falta cargar en Tabla actual: ${getTeamLabel(team)}.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    activeParticipants: activeParticipants.map(({team}) => team),
  }
}

const calculateMainTeamStats = (games = []) => {
  const finishedGamesWithResult = games.filter(
    (game) =>
      game?.result &&
      Number.isInteger(game.result.goalsFor) &&
      game.result.goalsFor >= 0 &&
      Number.isInteger(game.result.goalsAgainst) &&
      game.result.goalsAgainst >= 0,
  )

  return finishedGamesWithResult.reduce(
    (acc, game) => {
      const goalsFor = normalizeNumber(game?.result?.goalsFor)
      const goalsAgainst = normalizeNumber(game?.result?.goalsAgainst)

      acc.played += 1
      acc.goalsFor += goalsFor
      acc.goalsAgainst += goalsAgainst

      if (goalsFor > goalsAgainst) acc.wins += 1
      else if (goalsFor < goalsAgainst) acc.losses += 1
      else acc.draws += 1

      return acc
    },
    {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
  )
}

export const sortAndDecorateRows = (rows = []) => {
  return [...rows]
    .map((row) => ({
      ...row,
      points: calculatePoints(row),
      goalDiff: calculateGoalDiff(row),
    }))
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor
      return a.team.name.localeCompare(b.team.name, DEFAULT_LOCALE)
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }))
}

export const addPositionMovement = (currentRows = [], previousRows = []) => {
  const previousPositions = previousRows.reduce((acc, row) => {
    const teamId = row?.team?.id || row?.team?._id || row?.team?._ref
    if (teamId && row?.position) acc[teamId] = row.position
    return acc
  }, {})

  return currentRows.map((row) => {
    const previousPosition = previousPositions[row.team.id] ?? null

    return {
      ...row,
      previousPosition,
      positionChange: previousPosition ? previousPosition - row.position : null,
    }
  })
}

const isZeroStatsRow = (row) =>
  row.played === 0 &&
  row.wins === 0 &&
  row.draws === 0 &&
  row.losses === 0 &&
  row.goalsFor === 0 &&
  row.goalsAgainst === 0 &&
  row.points === 0 &&
  row.goalDiff === 0

const addInitialAlphabeticalMovement = (currentRows = []) =>
  currentRows.map((row) => ({
    ...row,
    previousPosition: row.position,
    positionChange: 0,
  }))

export const buildComputedStandings = ({rows = [], games = [], mainTeam = null, previousRows = []}) => {
  const rowsByTeamId = rows.reduce((acc, row) => {
    const normalizedRow = normalizeManualRow(row)

    if (normalizedRow) acc[normalizedRow.team.id] = normalizedRow
    return acc
  }, {})
  const normalizedMainTeam = normalizeTeam(mainTeam)

  if (normalizedMainTeam) {
    rowsByTeamId[normalizedMainTeam.id] = {
      team: normalizedMainTeam,
      ...calculateMainTeamStats(games),
    }
  }

  const sortedRows = sortAndDecorateRows(Object.values(rowsByTeamId))

  if (!previousRows.length && sortedRows.length > 0 && sortedRows.every(isZeroStatsRow)) {
    return addInitialAlphabeticalMovement(sortedRows)
  }

  return addPositionMovement(sortedRows, previousRows)
}

const normalizeSnapshotRole = (snapshotRole) =>
  snapshotRole === SNAPSHOT_ROLES.PREVIOUS ? SNAPSHOT_ROLES.PREVIOUS : SNAPSHOT_ROLES.CURRENT

export const createSnapshotId = (tournamentId, snapshotRole = SNAPSHOT_ROLES.CURRENT) => {
  const safeTournamentId = String(tournamentId || 'unknown').replace(/[^a-zA-Z0-9_.-]/g, '-')
  const safeRole = normalizeSnapshotRole(snapshotRole)

  return `standings-snapshot-${safeTournamentId}-${safeRole}`
}

const createRowKey = (teamId) => String(teamId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-')

export const toSnapshotRows = (rows = []) =>
  rows.map((row) => ({
    _key: createRowKey(row.team.id),
    _type: 'standingSnapshotRow',
    team: {
      _type: 'reference',
      _ref: row.team.id,
    },
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    points: row.points,
    goalDiff: row.goalDiff,
    position: row.position,
    previousPosition: row.previousPosition ?? undefined,
    positionChange: row.positionChange ?? undefined,
  }))

const toSnapshotReference = (tournamentId) => ({
  _type: 'reference',
  _ref: tournamentId,
})

const toWritableSnapshotRows = (rows = []) =>
  rows
    .map((row) => {
      const teamId = getPublishedId(row?.team?._ref || row?.team?._id || row?.team?.id)

      if (!teamId) return null

      return {
        _key: row._key || createRowKey(teamId),
        _type: 'standingSnapshotRow',
        team: {
          _type: 'reference',
          _ref: teamId,
        },
        played: normalizeNumber(row.played),
        wins: normalizeNumber(row.wins),
        draws: normalizeNumber(row.draws),
        losses: normalizeNumber(row.losses),
        goalsFor: normalizeNumber(row.goalsFor),
        goalsAgainst: normalizeNumber(row.goalsAgainst),
        points: normalizeNumber(row.points),
        goalDiff: Number.isFinite(Number(row.goalDiff)) ? Number(row.goalDiff) : 0,
        position: normalizeNumber(row.position),
        previousPosition: row.previousPosition ?? undefined,
        positionChange: row.positionChange ?? undefined,
      }
    })
    .filter(Boolean)

export const createCurrentSnapshotDocument = ({tournamentId, state, standings}) => ({
  _id: createSnapshotId(tournamentId, SNAPSHOT_ROLES.CURRENT),
  _type: 'standingsSnapshots',
  snapshotRole: SNAPSHOT_ROLES.CURRENT,
  tournament: toSnapshotReference(tournamentId),
  matchdayNumber: state.matchdayNumber,
  label: state.label || null,
  snapshotDate: state.snapshotDate,
  gamesThroughDate: state.snapshotDate,
  rows: toSnapshotRows(standings),
})

export const createPreviousSnapshotDocument = ({tournamentId, currentSnapshot}) => {
  if (!currentSnapshot) return null

  return {
    _id: createSnapshotId(tournamentId, SNAPSHOT_ROLES.PREVIOUS),
    _type: 'standingsSnapshots',
    snapshotRole: SNAPSHOT_ROLES.PREVIOUS,
    tournament: toSnapshotReference(tournamentId),
    matchdayNumber: currentSnapshot.matchdayNumber,
    label: currentSnapshot.label || null,
    snapshotDate: currentSnapshot.snapshotDate,
    gamesThroughDate: currentSnapshot.gamesThroughDate,
    rows: toWritableSnapshotRows(currentSnapshot.rows),
  }
}

export const createSnapshotRotationPlan = ({
  tournamentId,
  state,
  standings,
  previousCurrentSnapshot = null,
  oldPreviousSnapshot = null,
}) => {
  const previousSnapshotId = createSnapshotId(tournamentId, SNAPSHOT_ROLES.PREVIOUS)
  const previousSnapshot = createPreviousSnapshotDocument({
    tournamentId,
    currentSnapshot: previousCurrentSnapshot,
  })

  return {
    currentSnapshot: createCurrentSnapshotDocument({tournamentId, state, standings}),
    previousSnapshot,
    deletePreviousSnapshotId:
      previousSnapshot || !oldPreviousSnapshot?._id ? null : previousSnapshotId,
  }
}
