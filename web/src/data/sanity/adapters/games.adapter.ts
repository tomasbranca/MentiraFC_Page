import type { Game, MatchEvent, Player } from "../../../types/models";
import {
  sanityEventSchema,
  sanityGameSchema,
  sanityPlayerRefSchema,
  getSanitySlugValue,
  type SanityEvent,
  type SanityGame,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

type GamePlayerRef = Pick<Player, "id" | "name" | "lastName" | "slug">;

const adaptPlayerRef = (player: unknown): GamePlayerRef | null => {
  const validated = validateSanityItem(
    sanityPlayerRefSchema,
    player,
    "games.adapter:adaptPlayerRef"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    name: validated.name,
    lastName: validated.lastName,
    slug: getSanitySlugValue(validated.slug),
  };
};

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
    player: validated.player ? adaptPlayerRef(validated.player) : null,
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
    playedPlayers: (validated.playedPlayers || [])
      .map(adaptPlayerRef)
      .filter((player): player is GamePlayerRef => Boolean(player)),
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
