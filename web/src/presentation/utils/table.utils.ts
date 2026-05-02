import type { StandingsRow } from "../../types/models";

type StandingsRowType = NonNullable<StandingsRow["type"]>;

type PrizeSlotsInput = {
  primaryPrizeSlots?: unknown;
  secondaryPrizeSlots?: unknown;
};

const DEFAULT_PRIMARY_PRIZE_SLOTS = 1;
const DEFAULT_SECONDARY_PRIZE_SLOTS = 4;

export const calculatePoints = (row: StandingsRow): number => {
  return row.wins * 3 + row.draws;
};

export const calculateGoalDiff = (row: StandingsRow): number => {
  return row.goalsFor - row.goalsAgainst;
};

const sortStandings = (standings: StandingsRow[] = []): StandingsRow[] => {
  return [...standings].sort((a, b) => {
    if (a.points !== b.points) return (b.points ?? 0) - (a.points ?? 0);
    if (a.goalDiff !== b.goalDiff) return (b.goalDiff ?? 0) - (a.goalDiff ?? 0);
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.played !== b.played) return a.played - b.played;
    return 0;
  });
};

const addPositions = (standings: StandingsRow[]): StandingsRow[] => {
  return standings.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
};

const normalizeSlotCount = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : fallback;
};

export const getRowType = (
  row: StandingsRow,
  { primaryPrizeSlots, secondaryPrizeSlots }: PrizeSlotsInput = {}
): StandingsRowType => {
  const primarySlots = normalizeSlotCount(
    primaryPrizeSlots,
    DEFAULT_PRIMARY_PRIZE_SLOTS
  );
  const secondarySlots = normalizeSlotCount(
    secondaryPrizeSlots,
    DEFAULT_SECONDARY_PRIZE_SLOTS
  );
  const position = row.position ?? 0;

  if (position < 1) return "normal";
  if (position <= primarySlots) return "primaryPrize";
  if (position <= primarySlots + secondarySlots) return "secondaryPrize";
  return "normal";
};

export const formatStandings = (
  standings: StandingsRow[] = [],
  prizeSlots: PrizeSlotsInput = {}
): StandingsRow[] => {
  const enriched = standings.map((row) => ({
    ...row,
    points: calculatePoints(row),
    goalDiff: calculateGoalDiff(row),
  }));

  const sorted = sortStandings(enriched);
  const withPositions = addPositions(sorted);

  return withPositions.map((row) => ({
    ...row,
    type: getRowType(row, prizeSlots),
  }));
};

export const getMainTeamIndex = (standings: StandingsRow[]): number => {
  return standings.findIndex((row) => row.team.isMain);
};

export const getSurroundingTeams = (
  arr: StandingsRow[],
  idx: number,
  range = 2
): StandingsRow[] => {
  if (idx === -1) return arr.slice(0, 5);

  const start = Math.max(0, idx - range);
  const end = Math.min(arr.length, idx + range + 1);

  if (start === 0) return arr.slice(0, 5);
  if (end === arr.length) return arr.slice(-5);

  return arr.slice(start, end);
};
