import { client } from "../sanity.client";
import { adaptGame } from "../adapters/games.adapter";
import { adaptNews } from "../adapters/news.adapter";
import { HOME_CRITICAL_QUERY } from "../queries/home.queries";

import type { Game, NewsItem } from "../../../types/models";

type HomeCriticalResponse = {
  news?: unknown;
  latestGame?: unknown;
};

export const getHomeCriticalData = async (): Promise<{
  news: NewsItem[];
  latestGame: Game | null;
}> => {
  const data = await client.fetch<HomeCriticalResponse>(HOME_CRITICAL_QUERY);

  return {
    news: adaptNews(data?.news),
    latestGame: adaptGame(data?.latestGame),
  };
};
