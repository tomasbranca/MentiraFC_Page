import { client } from "../sanity.client";
import { TOURNAMENT_QUERY } from "../queries/tournaments.queries";
import  { adaptTournament } from "../adapters/tournaments.adapter";

export const getTournament = async () => {
  const data = await client.fetch(TOURNAMENT_QUERY);
  return adaptTournament(data);
};