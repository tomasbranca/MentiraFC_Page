import { getTournament as fetchTournament } from "./sanity/services/tournaments.service";

import type { StandingsRow, Tournament } from "../types/models";

export const getTournament = async (): Promise<Tournament | null> => fetchTournament();

export const getStandings = async (): Promise<StandingsRow[]> => {
  const tournament = await fetchTournament();
  return tournament?.standings ?? [];
};
