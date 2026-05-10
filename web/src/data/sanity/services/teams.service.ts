import { TEAMS_QUERY } from "../queries/teams.queries";
import { adaptTeams } from "../adapters/teams.adapter";
import { fetchSanityQuery } from "../sanityFetch";

import type { TeamRef } from "../../../types/models";

export const getTeams = async (): Promise<TeamRef[]> => {
  const data = await fetchSanityQuery(TEAMS_QUERY);
  return adaptTeams(data);
};
