import type { TeamRef } from "../../../types/models";

type SanityTeam = {
  _id: string;
  name: string;
  isMain?: boolean;
  logo?: string;
};

export const adaptTeam = (team: SanityTeam | null | undefined): TeamRef | null => {
  if (!team) return null;

  return {
    id: team._id,
    name: team.name,
    isMain: team.isMain,
    imageUrl: team.logo,
  };
};

export const adaptTeams = (teams: SanityTeam[] = []): TeamRef[] => {
  return teams.map(adaptTeam).filter((team): team is TeamRef => Boolean(team));
};
