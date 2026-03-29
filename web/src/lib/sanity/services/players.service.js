import { client } from "../sanity.client";
import {
  PLAYERS_QUERY,
  PLAYER_BY_SLUG_QUERY,
  PLAYER_WITH_GOALS_BY_YEAR_QUERY,
  TOP_SCORERS_QUERY,
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

export const getPlayerWithGoalsByYear = async (slug, year) => {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const data = await client.fetch(PLAYER_WITH_GOALS_BY_YEAR_QUERY, {
    slug,
    start,
    end,
  });

  return adaptPlayer(data);
};

export const getTopScorers = async (year) => {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const data = await client.fetch(TOP_SCORERS_QUERY, {
    start,
    end,
  });

  return adaptPlayers(data);
};