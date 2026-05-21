import { adaptGame } from "../adapters/games.adapter";
import { adaptNews } from "../adapters/news.adapter";
import { HOME_CRITICAL_QUERY } from "../queries/home.queries";
import { fetchSanityQuery } from "../sanityFetch";

import type { Game, NewsItem } from "../../../types/models";

type HomeCriticalResponse = {
  news?: unknown;
  latestGame?: unknown;
};

export const getHomeCriticalData = async (): Promise<{
  news: NewsItem[];
  latestGame: Game | null;
}> => {
  const data = await fetchSanityQuery<HomeCriticalResponse>(
    HOME_CRITICAL_QUERY,
    { useCdn: false }
  );

  return {
    news: adaptNews(data?.news),
    latestGame: adaptGame(data?.latestGame),
  };
};
