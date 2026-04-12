import {
  getPlayers as fetchPlayers,
  getPlayerBySlug as fetchPlayerBySlug,
} from "./sanity/services/players.service";

import type { Player } from "../types/models";

export const getPlayers = async (): Promise<Player[]> => fetchPlayers();

export const getPlayerBySlug = async (slug: string): Promise<Player | null> =>
  fetchPlayerBySlug(slug);
