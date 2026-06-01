import {
  LATEST_GAME_QUERY,
  FINISHED_GAMES_QUERY,
  FINISHED_TOURNAMENT_GAMES_QUERY,
  GAMES_PAGE_SORT_BY,
  getGamesPageQuery,
  type GamesPageSortBy,
} from "../queries/games.queries";

import {
  adaptGame,
  adaptGameListItems,
  adaptGames,
} from "../adapters/games.adapter";
import { sanityFreshClient } from "../client";
import {
  buildSanityPageParams,
  buildSanityPaginatedResult,
  parseSanityPageOptions,
  type SanityPageOptions,
  type SanityPageQueryResult,
} from "../pagination";
import { fetchSanityQuery } from "../sanityFetch";
import type { Game, GameListItem } from "../../../types/models";
import type { PaginatedResult } from "../../../../shared/pagination";

export type { GamesPageSortBy };

export const getLatestGame = async (): Promise<Game | null> => {
  const data = await fetchSanityQuery(LATEST_GAME_QUERY, {
    client: sanityFreshClient,
  });
  return adaptGame(data);
};

export const getFinishedGames = async (): Promise<Game[]> => {
  const data = await fetchSanityQuery(FINISHED_GAMES_QUERY, {
    client: sanityFreshClient,
  });
  return adaptGames(data);
};

export const getGamesPage = async (
  options?: SanityPageOptions<GamesPageSortBy>
): Promise<PaginatedResult<GameListItem>> => {
  const pagination = parseSanityPageOptions(options, {
    allowedSortBy: GAMES_PAGE_SORT_BY,
    defaultSortBy: "date",
  });
  const data = await fetchSanityQuery<SanityPageQueryResult>(
    getGamesPageQuery(pagination.sortBy, pagination.direction),
    {
      client: sanityFreshClient,
      params: buildSanityPageParams(pagination),
    }
  );

  return buildSanityPaginatedResult(
    adaptGameListItems(data.items ?? []),
    data.total,
    pagination
  );
};

export const getFinishedTournamentGames = async (): Promise<Game[]> => {
  const data = await fetchSanityQuery(FINISHED_TOURNAMENT_GAMES_QUERY, {
    client: sanityFreshClient,
  });
  return adaptGames(data);
};
