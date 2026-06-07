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
  snapshot: SanityStandingsSnapshot
): StandingsSnapshot => ({
  id: snapshot._id || "unknown-standings-snapshot",
  matchdayNumber: normalizePositiveInteger(snapshot.matchdayNumber),
  label: snapshot.label || null,
  snapshotDate: snapshot.snapshotDate || null,
  standings: adaptStandingRows(
    snapshot.rows,
    "tournaments.adapter:standingsSnapshots.rows"
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

  const validatedSnapshots: SanityStandingsSnapshot[] = validateSanityArray(
    sanityStandingsSnapshotSchema,
    validated.standingsSnapshots || [],
    "tournaments.adapter:standingsSnapshots"
  );
  const standingsSnapshots = validatedSnapshots.map(adaptStandingsSnapshot);
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
    mainTeam: adaptTeamRef(validated.mainTeam),
    primaryPrizeSlots: normalizeSlotCount(validated.primaryPrizeSlots, 1),
    secondaryPrizeSlots: normalizeSlotCount(validated.secondaryPrizeSlots, 4),
    updatedAt:
      currentSnapshot?.snapshotDate || validated._updatedAt || undefined,
    currentSnapshot,
    standingsSnapshots,
    standings,
  };
};
