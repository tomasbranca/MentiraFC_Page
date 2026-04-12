import { client } from "../sanity.client";
import { TEAMS_QUERY } from "../queries/teams.queries";
import { adaptTeams } from "../adapters/teams.adapter";

import type { TeamRef } from "../../../types/models";

export const getTeams = async (): Promise<TeamRef[]> => {
  const data = await client.fetch(TEAMS_QUERY);
  return adaptTeams(data);
};
