import type { Game, MatchEvent } from "../../../types/models";
import {
  sanityEventSchema,
  sanityGameSchema,
  getSanitySlugValue,
  type SanityEvent,
  type SanityGame,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

const adaptEvent = (event: unknown): MatchEvent | null => {
  const validated = validateSanityItem(
    sanityEventSchema,
    event,
    "games.adapter:adaptEvent"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    type: validated.type,
    order: validated.order,
    player: validated.player
      ? {
          id: validated.player._id,
          name: validated.player.name,
          lastName: validated.player.lastName,
          slug: getSanitySlugValue(validated.player.slug),
        }
      : null,
  };
};

export const adaptGame = (game: unknown): Game | null => {
  const validated = validateSanityItem(
    sanityGameSchema,
    game,
    "games.adapter:adaptGame"
  );
  if (!validated) return null;

  // Upcoming matches do not have a result object yet; normalize to 0-0 so
  // widgets can render one stable Game shape.
  return {
    id: validated._id,
    date: validated.date,
    state: validated.state,
    location: validated.location,
    competition: validated.competition,
    tournamentId: validated.tournament?._id || null,
    tournament: validated.tournament
      ? `${validated.tournament.organization?.name} · ${validated.tournament.name}`
      : null,
    rival: {
      id: validated.rival?._id || "",
      name: validated.rival?.name || "",
      imageUrl: validated.rival?.logoUrl,
    },
    result: {
      goalsFor: Number(validated.result?.goalsFor) || 0,
      goalsAgainst: Number(validated.result?.goalsAgainst) || 0,
    },
    events: (validated.events || [])
      .map(adaptEvent)
      .filter((event): event is MatchEvent => Boolean(event)),
  };
};

export const adaptGames = (games: unknown): Game[] => {
  const validatedGames: SanityGame[] = validateSanityArray(
    sanityGameSchema,
    games,
    "games.adapter:adaptGames"
  );

  return validatedGames
    .map(adaptGame)
    .filter((game): game is Game => Boolean(game));
};
