import { getAllGames, getLatestGame, getTournamentGames } from "./games";
import { getHomeCriticalData as fetchHomeCriticalData } from "./sanity/services/home.service";
import { getNews } from "./news";
import { getPlayers } from "./players";
import { getTeams } from "./teams";
import { getTournament } from "./tournament";
import { type InitialDataPayload } from "./initialDataPayload";

import { reportError } from "../lib/errors/errorLogger";
export {
  createBootstrapErrorPayload,
  createEmptyInitialData,
  type InitialDataPayload,
} from "./initialDataPayload";

export const getHomeCriticalData = async (): Promise<InitialDataPayload> => {
  try {
    const { news, latestGame } = await fetchHomeCriticalData();

    return {
      bootstrapScope: "home-critical",
      news,
      players: [],
      games: [],
      tournament: null,
      teams: [],
      tournamentGames: [],
      latestGame,
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getHomeCriticalData",
      action: "load_home_critical_render_data",
    });

    throw error;
  }
};

export const getInitialData = async (): Promise<InitialDataPayload> => {
  try {
    const [
      news,
      players,
      games,
      tournament,
      teams,
      tournamentGames,
      latestGame,
    ] = await Promise.all([
      getNews(),
      getPlayers(),
      getAllGames(),
      getTournament(),
      getTeams(),
      getTournamentGames(),
      getLatestGame(),
    ]);

    return {
      bootstrapScope: "full",
      news,
      players,
      games,
      tournament,
      teams,
      tournamentGames,
      latestGame,
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getInitialData",
      action: "load_initial_render_data",
    });

    throw error;
  }
};
