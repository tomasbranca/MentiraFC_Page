import type { StandingsRow, Tournament } from "../../../types/models";
import { sanityTournamentSchema } from "../schemas";
import { validateSanityItem } from "../validation";

export const adaptTournament = (data: unknown): Tournament | null => {
  const validated = validateSanityItem(
    sanityTournamentSchema,
    data,
    "tournaments.adapter:adaptTournament",
  );
  if (!validated) return null;

  const standings: StandingsRow[] = (validated.standings || []).map((row) => ({
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
    id: validated._id,
    name: `${validated.organization?.name} · ${validated.name}`,
    imageUrl: validated.organization?.logo,
    primaryColor: validated.organization?.primaryColor?.hex,
    updatedAt: validated._updatedAt,
    standings,
  };
};
