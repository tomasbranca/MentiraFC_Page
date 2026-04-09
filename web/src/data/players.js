import {
  getPlayers as fetchPlayers,
  getPlayerBySlug as fetchPlayerBySlug,
} from "../lib/sanity/services/players.service";

export const getPlayers = async () => fetchPlayers();

export const getPlayerBySlug = async (slug) => fetchPlayerBySlug(slug);
