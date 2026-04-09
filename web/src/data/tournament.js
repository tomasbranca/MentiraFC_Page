import { getTournament as fetchTournament } from "../lib/sanity/services/tournaments.service";

export const getTournament = async () => fetchTournament();

export const getStandings = async () => {
  const tournament = await fetchTournament();
  return tournament?.standings ?? [];
};
