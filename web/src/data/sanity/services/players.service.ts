import { client } from "../sanity.client";
import {
  PLAYERS_QUERY,
  PLAYER_BY_SLUG_QUERY,
} from "../queries/players.queries";

import { adaptPlayers, adaptPlayer } from "../adapters/players.adapter";
import type { Player } from "../../../types/models";

export const getPlayers = async (): Promise<Player[]> => {
  const data = await client.fetch(PLAYERS_QUERY);
  return adaptPlayers(data);
};

export const getPlayerBySlug = async (slug: string): Promise<Player | null> => {
  const data = await client.fetch(PLAYER_BY_SLUG_QUERY, { slug });
  return adaptPlayer(data);
};
