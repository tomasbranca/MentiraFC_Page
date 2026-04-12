import type { StandingsRow, Tournament } from "../../../types/models";
import { sanityStandingRowSchema, sanityTournamentSchema, type SanityStandingRow } from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptTournament = (data: unknown): Tournament | null => {
  if (!data) return null;

  const rawData = Array.isArray(data) ? data[0] : data;

  const validated = validateSanityItem(
    sanityTournamentSchema,
    rawData,
    "tournaments.adapter:adaptTournament",
  );
  if (!validated) return null;

  const validatedStandings: SanityStandingRow[] = validateSanityArray(
    sanityStandingRowSchema,
    validated.standings || [],
    "tournaments.adapter:standings",
  );

  const standings: StandingsRow[] = validatedStandings.map((row) => ({
    played: Number(row.played) || 0,
    wins: Number(row.wins) || 0,
    draws: Number(row.draws) || 0,
    losses: Number(row.losses) || 0,
    goalsFor: Number(row.goalsFor) || 0,
    goalsAgainst: Number(row.goalsAgainst) || 0,
    team: {
      id: row.team._id,
      name: row.team.name,
      imageUrl: row.team.logo,
      isMain: row.team.isMain,
    },
  }));

  return {
    id: validated._id || "unknown-tournament",
    name: `${validated.organization?.name || "Torneo"} · ${validated.name || "Actual"}`,
    imageUrl: validated.organization?.logo || null,
    primaryColor:
      typeof validated.organization?.primaryColor === "string"
        ? validated.organization.primaryColor
        : validated.organization?.primaryColor?.hex || null,
    updatedAt: validated._updatedAt || undefined,
    standings,
  };
};
