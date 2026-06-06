import {
  isFinishedGameState,
  normalizeGameState,
  normalizeGoalScorerKind,
} from "../../../domain/games";
import type {
  Game,
  GameResult,
  GameListItem,
  MatchEvent,
  Player,
} from "../../../types/models";
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

const isValidGoalValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const adaptGameResult = (result: SanityGame["result"]): GameResult | null => {
  if (
    !result ||
    !isValidGoalValue(result.goalsFor) ||
    !isValidGoalValue(result.goalsAgainst)
  ) {
    return null;
  }

  return {
    goalsFor: result.goalsFor,
    goalsAgainst: result.goalsAgainst,
  };
};

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
    order: validated.order ?? undefined,
    scorerKind: normalizeGoalScorerKind(validated.scorerKind, validated),
    guestName: validated.guestName?.trim() || null,
    player: validated.player ? adaptPlayerRef(validated.player) : null,
  };
};

const getTournamentLabel = (game: SanityGame): string | null => {
  if (!game.tournament?.name) {
    return null;
  }

  const organization = game.tournament.organization?.name?.trim();

  return organization
    ? `${organization} · ${game.tournament.name}`
    : game.tournament.name;
};

const adaptGameListFields = (validated: SanityGame): GameListItem | null => {
  const state = normalizeGameState(validated.state);
  const result = isFinishedGameState(state)
    ? adaptGameResult(validated.result)
    : null;

  if (isFinishedGameState(state) && !result) {
    return null;
  }

  return {
    id: validated._id,
    date: validated.date,
    state,
    location: validated.location,
    competition: validated.competition,
    tournamentId: validated.tournament?._id || null,
    tournament: getTournamentLabel(validated),
    rival: {
      id: validated.rival?._id || "",
      name: validated.rival?.name || "",
      imageUrl: validated.rival?.logoUrl,
    },
    result,
  };
};

export const adaptGameListItem = (game: unknown): GameListItem | null => {
  const validated = validateSanityItem(
    sanityGameSchema,
    game,
    "games.adapter:adaptGameListItem"
  );
  if (!validated) return null;

  return adaptGameListFields(validated);
};

export const adaptGame = (game: unknown): Game | null => {
  const validated = validateSanityItem(
    sanityGameSchema,
    game,
    "games.adapter:adaptGame"
  );
  if (!validated) return null;

  const listFields = adaptGameListFields(validated);

  if (!listFields) {
    return null;
  }

  // Upcoming matches intentionally keep a null result instead of a fake score.
  return {
    id: validated._id,
    date: validated.date,
    state: listFields.state,
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
    result: listFields.result,
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

export const adaptGameListItems = (games: unknown): GameListItem[] => {
  const validatedGames: SanityGame[] = validateSanityArray(
    sanityGameSchema,
    games,
    "games.adapter:adaptGameListItems"
  );

  return validatedGames
    .map(adaptGameListFields)
    .filter((game): game is GameListItem => Boolean(game));
};
