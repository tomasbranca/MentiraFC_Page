import type {
  StandingsRow,
  StandingsSnapshot,
  TeamRef,
  Tournament,
} from "../../../types/models";
import {
  sanityStandingRowSchema,
  sanityStandingsSnapshotSchema,
  sanityTournamentSchema,
  type SanityStandingRow,
  type SanityStandingsSnapshot,
  type SanityTournament,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

type SanityImageRef = {
  _ref?: unknown;
  asset?: {
    _ref?: unknown;
  };
};

const getImageUrl = (image: unknown): string | null => {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && image !== null) {
    const imageRef = image as SanityImageRef;

    return typeof imageRef._ref === "string"
      ? imageRef._ref
      : typeof imageRef.asset?._ref === "string"
        ? imageRef.asset._ref
        : null;
  }
  return null;
};

const normalizeSlotCount = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0
    ? Math.floor(numberValue)
    : fallback;
};

const normalizeNumber = (value: unknown): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizePositiveInteger = (value: unknown): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : 0;
};

const isValidGoalValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

type MainTeamGame = NonNullable<SanityTournament["mainTeamGames"]>[number];

const calculateMainTeamStats = (
  games: MainTeamGame[] = []
): Pick<
  StandingsRow,
  "played" | "wins" | "draws" | "losses" | "goalsFor" | "goalsAgainst"
> => {
  return games.reduce(
    (stats, game) => {
      const goalsFor = game.result?.goalsFor;
      const goalsAgainst = game.result?.goalsAgainst;

      if (!isValidGoalValue(goalsFor) || !isValidGoalValue(goalsAgainst)) {
        return stats;
      }

      stats.played += 1;
      stats.goalsFor += goalsFor;
      stats.goalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) stats.wins += 1;
      else if (goalsFor < goalsAgainst) stats.losses += 1;
      else stats.draws += 1;

      return stats;
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

const replaceMainTeamStats = (
  rows: StandingsRow[],
  mainTeam: TeamRef | null,
  games?: MainTeamGame[]
): StandingsRow[] => {
  if (!mainTeam || !Array.isArray(games)) {
    return rows;
  }

  const stats = calculateMainTeamStats(games);
  const buildMainTeamRow = (row?: StandingsRow): StandingsRow => {
    const points = stats.wins * 3 + stats.draws;
    const goalDiff = stats.goalsFor - stats.goalsAgainst;

    return {
      ...row,
      ...stats,
      points,
      goalDiff,
      team: {
        ...(row?.team ?? mainTeam),
        id: row?.team.id ?? mainTeam.id,
        name: row?.team.name ?? mainTeam.name,
        imageUrl: row?.team.imageUrl ?? mainTeam.imageUrl,
        isMain: true,
      },
    };
  };

  const mainTeamIndex = rows.findIndex(
    (row) => row.team.isMain || row.team.id === mainTeam.id
  );

  if (mainTeamIndex === -1) {
    return [...rows, buildMainTeamRow()];
  }

  return rows.map((row, index) =>
    index === mainTeamIndex ? buildMainTeamRow(row) : row
  );
};

const adaptStandingRows = (
  rows: unknown[] | null | undefined,
  context: string
): StandingsRow[] => {
  const validatedRows: SanityStandingRow[] = validateSanityArray(
    sanityStandingRowSchema,
    rows || [],
    context
  );

  return validatedRows.map((row) => {
    const wins = normalizeNumber(row.wins);
    const draws = normalizeNumber(row.draws);
    const losses = normalizeNumber(row.losses);
    const played = normalizeOptionalNumber(row.played) ?? wins + draws + losses;
    const goalsFor = normalizeNumber(row.goalsFor);
    const goalsAgainst = normalizeNumber(row.goalsAgainst);
    const points = normalizeOptionalNumber(row.points) ?? wins * 3 + draws;
    const goalDiff =
      normalizeOptionalNumber(row.goalDiff) ?? goalsFor - goalsAgainst;
    const position = normalizePositiveInteger(row.position);
    const previousPosition = normalizePositiveInteger(row.previousPosition);
    const positionChange =
      position && previousPosition ? previousPosition - position : null;

    return {
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
      goalDiff,
      position: position || undefined,
      previousPosition: previousPosition || null,
      positionChange,
      team: {
        id: row.team._id,
        name: row.team.name,
        imageUrl: row.team.logo,
        isMain: row.team.isMain,
      },
    };
  });
};

const adaptTeamRef = (
  team:
    | {
        _id: string;
        name: string;
        logo?: unknown;
        isMain?: boolean;
      }
    | null
    | undefined
): TeamRef | null => {
  if (!team) return null;

  return {
    id: team._id,
    name: team.name,
    imageUrl: team.logo,
    isMain: team.isMain,
  };
};

const adaptStandingsSnapshot = (
  snapshot: SanityStandingsSnapshot,
  options: {
    mainTeam: TeamRef | null;
    mainTeamGames?: MainTeamGame[];
  }
): StandingsSnapshot => ({
  id: snapshot._id || "unknown-standings-snapshot",
  matchdayNumber: normalizePositiveInteger(snapshot.matchdayNumber),
  label: snapshot.label || null,
  snapshotDate: snapshot.snapshotDate || null,
  standings: replaceMainTeamStats(
    adaptStandingRows(
      snapshot.rows,
      "tournaments.adapter:standingsSnapshots.rows"
    ),
    options.mainTeam,
    options.mainTeamGames
  ),
});

export const adaptTournament = (data: unknown): Tournament | null => {
  if (!data) return null;

  // The service may pass either a single tournament or an array from older
  // call sites; normalize here so the rest of the app sees one shape.
  const rawData = Array.isArray(data) ? data[0] : data;

  const validated = validateSanityItem(
    sanityTournamentSchema,
    rawData,
    "tournaments.adapter:adaptTournament"
  );
  if (!validated) return null;

  const mainTeam = adaptTeamRef(validated.mainTeam);
  const validatedSnapshots: SanityStandingsSnapshot[] = validateSanityArray(
    sanityStandingsSnapshotSchema,
    validated.standingsSnapshots || [],
    "tournaments.adapter:standingsSnapshots"
  );
  const standingsSnapshots = validatedSnapshots.map((snapshot) =>
    adaptStandingsSnapshot(snapshot, {
      mainTeam,
      mainTeamGames: validated.mainTeamGames,
    })
  );
  const currentSnapshot = standingsSnapshots[0] || null;
  const standings = currentSnapshot?.standings ?? [];

  return {
    id: validated._id || "unknown-tournament",
    name: `${validated.organization?.name || "Torneo"} · ${
      validated.name || "Actual"
    }`,
    imageUrl: getImageUrl(validated.organization?.logo),
    primaryColor:
      typeof validated.organization?.primaryColor === "string"
        ? validated.organization.primaryColor
        : validated.organization?.primaryColor?.hex || null,
    mainTeam,
    primaryPrizeSlots: normalizeSlotCount(validated.primaryPrizeSlots, 1),
    secondaryPrizeSlots: normalizeSlotCount(validated.secondaryPrizeSlots, 4),
    updatedAt:
      currentSnapshot?.snapshotDate || validated._updatedAt || undefined,
    currentSnapshot,
    standingsSnapshots,
    standings,
  };
};
