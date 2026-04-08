import { client } from "../sanity.client";
import {
  PLAYERS_QUERY,
  PLAYER_BY_SLUG_QUERY,
} from "../queries/players.queries";

import {
  adaptPlayers,
  adaptPlayer,
} from "../adapters/players.adapter";

export const getPlayers = async () => {
  const data = await client.fetch(PLAYERS_QUERY);
  return adaptPlayers(data);
};

export const getPlayerBySlug = async (slug) => {
  const data = await client.fetch(PLAYER_BY_SLUG_QUERY, { slug });
  return adaptPlayer(data);
};
