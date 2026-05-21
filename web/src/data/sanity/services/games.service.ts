import {
  LATEST_GAME_QUERY,
  FINISHED_GAMES_QUERY,
  FINISHED_TOURNAMENT_GAMES_QUERY,
} from "../queries/games.queries";

import { adaptGame, adaptGames } from "../adapters/games.adapter";
import { fetchSanityQuery } from "../sanityFetch";
import type { Game } from "../../../types/models";

export const getLatestGame = async (): Promise<Game | null> => {
  const data = await fetchSanityQuery(LATEST_GAME_QUERY, { useCdn: false });
  return adaptGame(data);
};

export const getFinishedGames = async (): Promise<Game[]> => {
  const data = await fetchSanityQuery(FINISHED_GAMES_QUERY);
  return adaptGames(data);
};

export const getFinishedTournamentGames = async (): Promise<Game[]> => {
  const data = await fetchSanityQuery(FINISHED_TOURNAMENT_GAMES_QUERY);
  return adaptGames(data);
};
