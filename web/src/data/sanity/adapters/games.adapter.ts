import type { Game, MatchEvent } from "../../../types/models";

type SanitySlug = { current?: string } | string | undefined;
type SanityEvent = {
  _id: string;
  type: string;
  order?: number;
  player?: { _id: string; name: string; lastName: string; slug?: SanitySlug };
};

type SanityGame = {
  _id: string;
  date: string;
  state: string;
  location?: string;
  competition?: string;
  tournament?: { _id: string; name?: string; organization?: { name?: string } };
  rival?: { _id?: string; name?: string; logoUrl?: string };
  result?: { goalsFor?: number; goalsAgainst?: number };
  events?: SanityEvent[];
};

const adaptEvent = (event: SanityEvent): MatchEvent => ({
  id: event._id,
  type: event.type,
  order: event.order,
  player: event.player
    ? {
        id: event.player._id,
        name: event.player.name,
        lastName: event.player.lastName,
        slug: typeof event.player.slug === "string" ? event.player.slug : event.player.slug?.current,
      }
    : null,
});

export const adaptGame = (game: SanityGame | null | undefined): Game | null => {
  if (!game) return null;

  return {
    id: game._id,
    date: game.date,
    state: game.state,
    location: game.location,
    competition: game.competition,
    tournamentId: game.tournament?._id || null,
    tournament: game.tournament
      ? `${game.tournament.organization?.name} · ${game.tournament.name}`
      : null,
    rival: {
      id: game.rival?._id || "",
      name: game.rival?.name || "",
      imageUrl: game.rival?.logoUrl,
    },
    result: {
      goalsFor: Number(game.result?.goalsFor) || 0,
      goalsAgainst: Number(game.result?.goalsAgainst) || 0,
    },
    events: (game.events || []).map(adaptEvent),
  };
};

export const adaptGames = (games: SanityGame[] = []): Game[] => {
  return games.map(adaptGame).filter((game): game is Game => Boolean(game));
};
