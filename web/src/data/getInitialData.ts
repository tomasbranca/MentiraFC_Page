import { getAllGames, getLatestGame, getTournamentGames } from "./games";
import { getGoalEvents } from "./events";
import { getGalleries } from "./galleries";
import { getHomeCriticalData as fetchHomeCriticalData } from "./sanity/services/home.service";
import { getNews } from "./news";
import { getPlayers } from "./players";
import { getStaff } from "./staff";
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

    // Home renders above-the-fold content first; heavier datasets are loaded
    // later by the page so the initial route can become interactive sooner.
    return {
      bootstrapScope: "home-critical",
      news,
      galleries: [],
      players: [],
      staff: [],
      games: [],
      goalEvents: [],
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
    // Full bootstrap is used outside the home critical path and keeps requests
    // independent so one slow endpoint does not serialize the whole page load.
    const [
      news,
      galleries,
      players,
      staff,
      games,
      goalEvents,
      tournament,
      teams,
      tournamentGames,
      latestGame,
    ] = await Promise.all([
      getNews(),
      getGalleries(),
      getPlayers(),
      getStaff(),
      getAllGames(),
      getGoalEvents({ year: new Date().getFullYear() }),
      getTournament(),
      getTeams(),
      getTournamentGames(),
      getLatestGame(),
    ]);

    return {
      bootstrapScope: "full",
      news,
      galleries,
      players,
      staff,
      games,
      goalEvents,
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
