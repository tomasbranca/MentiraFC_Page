import { client } from "../sanity.client";
import { TOURNAMENT_QUERY } from "../queries/tournaments.queries";
import { adaptTournament } from "../adapters/tournaments.adapter";

import type { Tournament } from "../../../types/models";

export const getTournament = async (): Promise<Tournament | null> => {
  const data = await client.fetch(TOURNAMENT_QUERY);
  return adaptTournament(data);
};
