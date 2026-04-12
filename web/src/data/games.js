import {
  getLatestGame as fetchLatestGame,
  getFinishedGames as fetchFinishedGames,
  getFinishedTournamentGames as fetchFinishedTournamentGames,
} from "./sanity/services/games.service";

/** @typedef {import('../types/models').Game} Game */

/** @returns {Promise<Game | null>} */
export const getLatestGame = async () => fetchLatestGame();

// "All games" in this project currently means finished games feed.
/** @returns {Promise<Game[]>} */
export const getAllGames = async () => fetchFinishedGames();

/** @returns {Promise<Game[]>} */
export const getTournamentGames = async () => fetchFinishedTournamentGames();
