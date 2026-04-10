import { getTournament as fetchTournament } from "./sanity/services/tournaments.service";

export const getTournament = async () => fetchTournament();

export const getStandings = async () => {
  const tournament = await fetchTournament();
  return tournament?.standings ?? [];
};
