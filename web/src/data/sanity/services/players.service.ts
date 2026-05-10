import {
  PLAYERS_QUERY,
  PLAYER_BY_SLUG_OR_ID_QUERY,
} from "../queries/players.queries";

import { adaptPlayers, adaptPlayer } from "../adapters/players.adapter";
import { fetchSanityQuery } from "../sanityFetch";
import type { Player } from "../../../types/models";

export const getPlayers = async (): Promise<Player[]> => {
  const data = await fetchSanityQuery(PLAYERS_QUERY);
  return adaptPlayers(data);
};

export const getPlayerBySlug = async (slug: string): Promise<Player | null> => {
  const data = await fetchSanityQuery(PLAYER_BY_SLUG_OR_ID_QUERY, {
    params: { slug },
  });
  return adaptPlayer(data);
};
