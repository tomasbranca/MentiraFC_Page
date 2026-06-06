import { isFinishedGameState } from "../games";
import type { Game, GameResult, StandingsRow, TeamRef } from "../../types/models";

type StandingsRowType = NonNullable<StandingsRow["type"]>;

type GameInput = Partial<Omit<Game, "result">> & {
  result?: Partial<Record<keyof GameResult, unknown>> | null;
};

type StandingsRowInput = Omit<
  Partial<StandingsRow>,
  "team" | "played" | "wins" | "draws" | "losses" | "goalsFor" | "goalsAgainst"
> & {
  team: TeamRef;
  wins?: unknown;
  draws?: unknown;
  losses?: unknown;
  goalsFor?: unknown;
  goalsAgainst?: unknown;
};

type PrizeSlotsInput = {
  primaryPrizeSlots?: unknown;
  secondaryPrizeSlots?: unknown;
};

type MovementInput = {
  previousManualStandings?: StandingsRowInput[];
  gamesThroughDate?: string | null;
  previousGamesThroughDate?: string | null;
};

const DEFAULT_PRIMARY_PRIZE_SLOTS = 1;
const DEFAULT_SECONDARY_PRIZE_SLOTS = 4;

const calculatePoints = (row: StandingsRow): number => row.wins * 3 + row.draws;
const calculateGoalDiff = (row: StandingsRow): number =>
  row.goalsFor - row.goalsAgainst;

const normalizeSlotCount = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : fallback;
};

const getRowType = (
  position: number,
  { primaryPrizeSlots, secondaryPrizeSlots }: PrizeSlotsInput = {}
): StandingsRowType => {
  // Prize slots come from CMS content, so they are normalized here before
  // decorating rows with presentation-specific states.
  const primarySlots = normalizeSlotCount(
    primaryPrizeSlots,
    DEFAULT_PRIMARY_PRIZE_SLOTS
  );
  const secondarySlots = normalizeSlotCount(
    secondaryPrizeSlots,
    DEFAULT_SECONDARY_PRIZE_SLOTS
  );

  if (position < 1) return "normal";
  if (position <= primarySlots) return "primaryPrize";
  if (position <= primarySlots + secondarySlots) return "secondaryPrize";
  return "normal";
};

const normalizeNumber = (value: unknown): number =>
  Number.isFinite(value) ? Number(value) : 0;

const isValidResultNumber = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const hasValidResult = (
  result?: Partial<Record<keyof GameResult, unknown>> | null
): result is GameResult =>
  Boolean(
    result &&
      isValidResultNumber(result.goalsFor) &&
      isValidResultNumber(result.goalsAgainst)
  );

const isGameBeforeOrAt = (
  game: GameInput,
  cutoffDate?: string | null
): boolean => {
  if (!cutoffDate) return true;

  const gameDate = typeof game.date === "string" ? Date.parse(game.date) : NaN;
  const cutoff = Date.parse(cutoffDate);

  if (!Number.isFinite(gameDate) || !Number.isFinite(cutoff)) return false;

  return gameDate <= cutoff;
};

const getFinishedGamesThroughDate = (
  games: GameInput[] | null = [],
  cutoffDate?: string | null
): GameInput[] => {
  return (games || []).filter(
    (game) =>
      game != null &&
      game.state != null &&
      isFinishedGameState(game.state) &&
      hasValidResult(game.result) &&
      isGameBeforeOrAt(game, cutoffDate)
  );
};

const sortAndDecorateTable = (
  rows: StandingsRow[] = [],
  prizeSlots: PrizeSlotsInput = {}
): StandingsRow[] => {
  // The table order is derived in the domain layer so every page/widget uses
  // the same tie-breakers and prize-zone labels.
  return rows
    .map((row) => ({
      ...row,
      points: calculatePoints(row),
      goalDiff: calculateGoalDiff(row),
    }))
    .sort((a, b) => {
      if (a.points !== b.points) return (b.points ?? 0) - (a.points ?? 0);
      if (a.goalDiff !== b.goalDiff)
        return (b.goalDiff ?? 0) - (a.goalDiff ?? 0);
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.name.localeCompare(b.team.name, "es");
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
      type: getRowType(index + 1, prizeSlots),
    }));
};

const calculateMainTeamStats = (
  games: GameInput[] = []
): Omit<StandingsRow, "team"> => {
  // Only Mentira FC stats are calculated from our own match records; rival
  // rows remain editorial because the app does not store every league match.
  return games.reduce<Omit<StandingsRow, "team">>(
    (acc, game) => {
      const goalsFor = normalizeNumber(game?.result?.goalsFor);
      const goalsAgainst = normalizeNumber(game?.result?.goalsAgainst);

      acc.played += 1;
      acc.goalsFor += goalsFor;
      acc.goalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) acc.wins += 1;
      else if (goalsFor < goalsAgainst) acc.losses += 1;
      else acc.draws += 1;

      return acc;
    },
    {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    }
  );
};

const cloneManualRow = (row: StandingsRowInput): StandingsRow => {
  const wins = normalizeNumber(row.wins);
  const draws = normalizeNumber(row.draws);
  const losses = normalizeNumber(row.losses);

  return {
    ...row,
    team: {
      ...row.team,
    },
    played: wins + draws + losses,
    wins,
    draws,
    losses,
    goalsFor: normalizeNumber(row.goalsFor),
    goalsAgainst: normalizeNumber(row.goalsAgainst),
  };
};

const createDecoratedTable = ({
  manualStandings = [],
  games = [],
  mainTeam = null,
  primaryPrizeSlots,
  secondaryPrizeSlots,
  gamesThroughDate,
}: {
  manualStandings?: StandingsRowInput[];
  games?: GameInput[] | null;
  mainTeam?: TeamRef | null;
  gamesThroughDate?: string | null;
} & PrizeSlotsInput): StandingsRow[] => {
  const manualRows = (manualStandings || []).map(cloneManualRow);
  const rowsByTeamId = manualRows.reduce<Record<string, StandingsRow>>(
    (acc, row) => {
      acc[row.team.id] = row;
      return acc;
    },
    {}
  );

  const resolvedMainTeam =
    mainTeam || manualRows.find((row) => row.team.isMain)?.team || null;

  if (resolvedMainTeam) {
    const mainStats = calculateMainTeamStats(
      getFinishedGamesThroughDate(games, gamesThroughDate)
    );

    rowsByTeamId[resolvedMainTeam.id] = {
      team: resolvedMainTeam,
      ...mainStats,
    };
  }

  return sortAndDecorateTable(Object.values(rowsByTeamId), {
    primaryPrizeSlots,
    secondaryPrizeSlots,
  });
};

const addPositionMovement = (
  currentTable: StandingsRow[],
  previousTable: StandingsRow[]
): StandingsRow[] => {
  if (!previousTable.length) {
    return currentTable.map((row) => ({
      ...row,
      previousPosition: null,
      positionChange: null,
    }));
  }

  const previousPositions = previousTable.reduce<Record<string, number>>(
    (acc, row) => {
      if (row.position) acc[row.team.id] = row.position;
      return acc;
    },
    {}
  );

  return currentTable.map((row) => {
    const previousPosition = previousPositions[row.team.id] ?? null;
    const currentPosition = row.position ?? null;

    return {
      ...row,
      previousPosition,
      positionChange:
        previousPosition && currentPosition
          ? previousPosition - currentPosition
          : null,
    };
  });
};

export const getHybridTournamentTable = ({
  manualStandings = [],
  games = [],
  mainTeam = null,
  primaryPrizeSlots,
  secondaryPrizeSlots,
  previousManualStandings,
  gamesThroughDate,
  previousGamesThroughDate,
}: {
  manualStandings?: StandingsRowInput[];
  games?: GameInput[] | null;
  mainTeam?: TeamRef | null;
} & PrizeSlotsInput &
  MovementInput): StandingsRow[] => {
  if (!mainTeam && !manualStandings.length) return [];

  // Snapshots store rival rows manually. The main-team row is rebuilt from
  // finished matches for each snapshot cutoff so Mentira FC is always present.
  const currentTable = createDecoratedTable({
    manualStandings,
    games,
    mainTeam,
    primaryPrizeSlots,
    secondaryPrizeSlots,
    gamesThroughDate,
  });

  if (!previousManualStandings) return currentTable;

  const previousTable = createDecoratedTable({
    manualStandings: previousManualStandings,
    games,
    mainTeam,
    primaryPrizeSlots,
    secondaryPrizeSlots,
    gamesThroughDate: previousGamesThroughDate,
  });

  return addPositionMovement(currentTable, previousTable);
};

export const getMainTeamIndex = (standings: StandingsRow[] = []): number => {
  return standings.findIndex((row) => row.team.isMain);
};

export const getSurroundingTeams = (
  standings: StandingsRow[] = [],
  idx: number,
  range = 2
): StandingsRow[] => {
  if (!standings.length) return [];
  if (idx === -1) return standings.slice(0, 5);

  const start = Math.max(0, idx - range);
  const end = Math.min(standings.length, idx + range + 1);

  if (start === 0) return standings.slice(0, 5);
  if (end === standings.length) return standings.slice(-5);

  return standings.slice(start, end);
};
