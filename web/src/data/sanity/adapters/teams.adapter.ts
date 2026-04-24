import type { TeamRef } from "../../../types/models";
import { sanityTeamSchema, type SanityTeam } from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptTeam = (team: unknown): TeamRef | null => {
  const validated = validateSanityItem(
    sanityTeamSchema,
    team,
    "teams.adapter:adaptTeam"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    name: validated.name,
    isMain: validated.isMain,
    imageUrl: validated.logo,
  };
};

export const adaptTeams = (teams: unknown): TeamRef[] => {
  const validatedTeams: SanityTeam[] = validateSanityArray(
    sanityTeamSchema,
    teams,
    "teams.adapter:adaptTeams"
  );

  return validatedTeams
    .map(adaptTeam)
    .filter((team): team is TeamRef => Boolean(team));
};
