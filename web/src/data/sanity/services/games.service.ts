import { client } from "../sanity.client";
import {
  LATEST_GAMES_QUERY,
  FINISHED_GAMES_QUERY,
  FINISHED_TOURNAMENT_GAMES_QUERY,
} from "../queries/games.queries";

import { adaptGame, adaptGames } from "../adapters/games.adapter";
import type { Game } from "../../../types/models";

export const getLatestGame = async (): Promise<Game | null> => {
  const data = await client.fetch(LATEST_GAMES_QUERY);

  if (!Array.isArray(data)) {
    return adaptGame(data);
  }

  for (const item of data) {
    const adapted = adaptGame(item);
    if (adapted) return adapted;
  }

  return null;
};

export const getFinishedGames = async (): Promise<Game[]> => {
  const data = await client.fetch(FINISHED_GAMES_QUERY);
  return adaptGames(data);
};

export const getFinishedTournamentGames = async (): Promise<Game[]> => {
  const data = await client.fetch(FINISHED_TOURNAMENT_GAMES_QUERY);
  return adaptGames(data);
};
