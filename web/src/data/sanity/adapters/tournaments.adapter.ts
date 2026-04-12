import type { StandingsRow, Tournament } from "../../../types/models";

type SanityTournament = {
  _id: string;
  _updatedAt?: string;
  name: string;
  organization?: { name?: string; logo?: string; primaryColor?: { hex?: string } };
  standings?: Array<{
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    team: { _id: string; name: string; logo?: string; isMain?: boolean };
  }>;
};

export const adaptTournament = (data: SanityTournament | null | undefined): Tournament | null => {
  if (!data) return null;

  const standings: StandingsRow[] = (data.standings || []).map((row) => ({
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
    id: data._id,
    name: `${data.organization?.name} · ${data.name}`,
    imageUrl: data.organization?.logo,
    primaryColor: data.organization?.primaryColor?.hex,
    updatedAt: data._updatedAt,
    standings,
  };
};
