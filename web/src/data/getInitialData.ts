import { getAllGames, getLatestGame, getTournamentGames } from "./games";
import { getNews } from "./news";
import { getPlayers } from "./players";
import { getTeams } from "./teams";
import { getTournament } from "./tournament";

import { reportError } from "../lib/errors/errorLogger";
import type { Game, NewsItem, Player, TeamRef, Tournament } from "../types/models";

export interface InitialDataPayload {
  news: NewsItem[];
  players: Player[];
  games: Game[];
  tournament: Tournament | null;
  teams: TeamRef[];
  tournamentGames: Game[];
  latestGame: Game | null;
}

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
