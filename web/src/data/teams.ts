import { getTeams as fetchTeams } from "./sanity/services/teams.service";

import type { TeamRef } from "../types/models";

export const getTeams = async (): Promise<TeamRef[]> => fetchTeams();
