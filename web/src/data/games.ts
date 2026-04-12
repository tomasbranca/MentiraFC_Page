import {
  getLatestGame as fetchLatestGame,
  getFinishedGames as fetchFinishedGames,
  getFinishedTournamentGames as fetchFinishedTournamentGames,
} from "./sanity/services/games.service";

import type { Game } from "../types/models";

export const getLatestGame = async (): Promise<Game | null> => fetchLatestGame();

// "All games" in this project currently means finished games feed.
export const getAllGames = async (): Promise<Game[]> => fetchFinishedGames();

export const getTournamentGames = async (): Promise<Game[]> => fetchFinishedTournamentGames();
