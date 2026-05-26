import { TOURNAMENT_QUERY } from "../queries/tournaments.queries";
import { adaptTournament } from "../adapters/tournaments.adapter";
import { sanityFreshClient } from "../client";
import { fetchSanityQuery } from "../sanityFetch";

import type { Tournament } from "../../../types/models";

export const getTournament = async (): Promise<Tournament | null> => {
  const data = await fetchSanityQuery(TOURNAMENT_QUERY, {
    client: sanityFreshClient,
  });
  return adaptTournament(data);
};
