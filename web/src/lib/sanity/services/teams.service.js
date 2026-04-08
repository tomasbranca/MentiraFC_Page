import { client } from "../sanity.client";
import { TEAMS_QUERY } from "../queries/teams.queries";
import { adaptTeams } from "../adapters/teams.adapter";

export const getTeams = async () => {
  const data = await client.fetch(TEAMS_QUERY);
  return adaptTeams(data);
};
