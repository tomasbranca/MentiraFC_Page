import {
  getGameById as fetchGameById,
  getLatestGame as fetchLatestGame,
  getFinishedGames as fetchFinishedGames,
  getGamesPage as fetchGamesPage,
  getFinishedTournamentGames as fetchFinishedTournamentGames,
  type GamesPageSortBy,
} from "./sanity/services/games.service";

import type { PaginatedResult } from "../../shared/pagination";
import type { SanityPageOptions } from "./sanity/pagination";
import type { Game, GameListItem } from "../types/models";

export const getLatestGame = async (): Promise<Game | null> =>
  fetchLatestGame();

// "All games" in this project currently means finished games feed.
export const getAllGames = async (): Promise<Game[]> => fetchFinishedGames();

export const getGamesPage = async (
  options?: SanityPageOptions<GamesPageSortBy>
): Promise<PaginatedResult<GameListItem>> => fetchGamesPage(options);

export const getGameById = async (id: string): Promise<Game | null> =>
  fetchGameById(id);

export const getTournamentGames = async (): Promise<Game[]> =>
  fetchFinishedTournamentGames();
