import { client } from "../sanity.client";
import { TABLE_QUERY } from "../queries/tournaments.queries";
import  { adaptTournament } from "../adapters/tournaments.adapter";

export const getTournament = async () => {
  const data = await client.fetch(TABLE_QUERY);
  return adaptTournament(data);
};