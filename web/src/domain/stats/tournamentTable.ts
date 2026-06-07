import type { StandingsRow } from "../../types/models";

type StandingsRowType = NonNullable<StandingsRow["type"]>;

type PrizeSlotsInput = {
  primaryPrizeSlots?: unknown;
  secondaryPrizeSlots?: unknown;
};

const DEFAULT_PRIMARY_PRIZE_SLOTS = 1;
const DEFAULT_SECONDARY_PRIZE_SLOTS = 4;

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

export const decorateStoredTournamentTable = ({
  standings = [],
  primaryPrizeSlots,
  secondaryPrizeSlots,
}: {
  standings?: StandingsRow[] | null;
} & PrizeSlotsInput): StandingsRow[] =>
  (standings || [])
    .map((row, index) => {
      const storedPosition = Number(row.position);
      const position =
        Number.isFinite(storedPosition) && storedPosition > 0
          ? Math.floor(storedPosition)
          : index + 1;

      return {
        ...row,
        team: {
          ...row.team,
        },
        position,
      };
    })
    .sort((left, right) => {
      if (left.position !== right.position) {
        return (left.position ?? 0) - (right.position ?? 0);
      }

      return left.team.name.localeCompare(right.team.name, "es");
    })
    .map((row) => ({
      ...row,
      type: getRowType(row.position ?? 0, {
        primaryPrizeSlots,
        secondaryPrizeSlots,
      }),
    }));

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
