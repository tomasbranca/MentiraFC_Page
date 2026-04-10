import {
  getLatestGame as fetchLatestGame,
  getFinishedGames as fetchFinishedGames,
  getFinishedTournamentGames as fetchFinishedTournamentGames,
} from "./sanity/services/games.service";

export const getLatestGame = async () => fetchLatestGame();

// "All games" in this project currently means finished games feed.
export const getAllGames = async () => fetchFinishedGames();

export const getTournamentGames = async () => fetchFinishedTournamentGames();
