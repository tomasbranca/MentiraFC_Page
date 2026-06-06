import { countsForPlayerGoalStats } from "../games";
import type {
  Game,
  GameResult,
  GoalEvent,
  MatchEvent,
  Player,
  PlayerWithGoals,
} from "../../types/models";

type StatsOptions = { year?: number };
type PlayerStatsOptions = StatsOptions & {
  goalEvents?: GoalEventInput[] | unknown;
};
type PlayerStats = {
  playerId: string | null;
  goals: number;
  matchesWithGoals: number;
  matchesPlayed: number;
};
type PlayerInput = Partial<Player> & Pick<Player, "id">;
type EventInput =
  | (Partial<MatchEvent> & {
      player?: { id?: string | null } | null;
      scorerKind?: string | null;
      scorerSide?: string | null;
      scorerSource?: string | null;
    })
  | null;
type GoalEventInput =
  | (Partial<GoalEvent> & {
      game?: {
        id?: string | null;
        date?: string | null;
        state?: string | null;
        result?: Partial<Record<keyof GameResult, unknown>> | null;
      } | null;
      player?: { id?: string | null } | null;
      scorerKind?: string | null;
      scorerSide?: string | null;
      scorerSource?: string | null;
    })
  | null;
type GameInput = Partial<Omit<Game, "events">> & {
  events?: EventInput[] | null;
  playedPlayers?: Array<{ id?: string | null } | null> | null;
  result?: Partial<Record<keyof GameResult, unknown>> | null;
};

const normalizeGames = (games: GameInput[] | unknown = []): GameInput[] =>
  Array.isArray(games) ? games : [];
const normalizePlayers = (players: PlayerInput[] | unknown = []): Player[] =>
  Array.isArray(players)
    ? players
        .filter((player): player is PlayerInput => Boolean(player?.id))
        .map((player) => ({
          id: player.id,
          name: player.name ?? "",
          lastName: player.lastName ?? "",
          fullName: player.fullName ?? `${player.name ?? ""} ${player.lastName ?? ""}`.trim(),
          slug: player.slug,
          number: player.number,
          position: player.position,
          birthDate: player.birthDate,
          imageUrl: player.imageUrl,
        }))
    : [];
const normalizeGoalEvents = (
  events: GoalEventInput[] | unknown = []
): GoalEventInput[] => (Array.isArray(events) ? events : []);

const isInYear = (date: string | undefined, year?: number): boolean => {
  if (!year) return true;
  if (!date) return false;
  return new Date(date).getFullYear() === year;
};

const isValidResultNumber = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const hasValidResult = (
  result?: Partial<Record<keyof GameResult, unknown>> | null
): result is GameResult =>
  Boolean(
    result &&
      isValidResultNumber(result.goalsFor) &&
      isValidResultNumber(result.goalsAgainst)
  );

const isFinishedGameWithResult = (
  game?: {
    state?: string | null;
    result?: Partial<Record<keyof GameResult, unknown>> | null;
  } | null
): boolean =>
  Boolean(
    game?.state &&
      game.state === "finalizado" &&
      hasValidResult(game.result)
  );

const getGoalEventsFromGames = (
  games: GameInput[] | unknown = [],
  year?: number
) => {
  // Goal stats are event-driven: players do not store counters, so historical
  // numbers can be recalculated when events or year filters change.
  return normalizeGames(games)
    .filter(
      (game) => isFinishedGameWithResult(game) && isInYear(game.date, year)
    )
    .flatMap((game) => game.events || [])
    .filter(
      (event): event is NonNullable<EventInput> =>
        event !== null && event.type === "goal" && countsForPlayerGoalStats(event)
    );
};

const getGoalEventsInYear = (
  events: GoalEventInput[] | unknown = [],
  year?: number
) =>
  normalizeGoalEvents(events).filter(
    (event): event is NonNullable<GoalEventInput> =>
      event !== null &&
      event.type === "goal" &&
      countsForPlayerGoalStats(event) &&
      isFinishedGameWithResult(event.game) &&
      isInYear(event.game?.date ?? undefined, year)
  );

export const getTopScorers = (
  games: GameInput[] | unknown = [],
  players: PlayerInput[] | unknown = [],
  options: StatsOptions = {}
): PlayerWithGoals[] => {
  const { year } = options;

  const goalsByPlayer = getGoalEventsFromGames(games, year).reduce<
    Record<string, number>
  >((acc, event) => {
    const playerId = event.player!.id;
    acc[playerId] = (acc[playerId] ?? 0) + 1;
    return acc;
  }, {});

  return normalizePlayers(players)
    .map((player) => ({
      ...player,
      goals: goalsByPlayer[player.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.fullName.localeCompare(b.fullName, "es");
    });
};

export const getTopScorersFromGoalEvents = (
  goalEvents: GoalEventInput[] | unknown = [],
  players: PlayerInput[] | unknown = [],
  options: StatsOptions = {}
): PlayerWithGoals[] => {
  const { year } = options;

  const goalsByPlayer = getGoalEventsInYear(goalEvents, year).reduce<
    Record<string, number>
  >((acc, event) => {
    const playerId = event.player!.id!;
    acc[playerId] = (acc[playerId] ?? 0) + 1;
    return acc;
  }, {});

  return normalizePlayers(players)
    .map((player) => ({
      ...player,
      goals: goalsByPlayer[player.id] ?? 0,
    }))
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.fullName.localeCompare(b.fullName, "es");
    });
};

export const getPlayerStats = (
  games: GameInput[] | unknown = [],
  playerId?: string | null,
  options: PlayerStatsOptions = {}
): PlayerStats => {
  const { year, goalEvents } = options;

  if (!playerId) {
    return {
      playerId: null,
      goals: 0,
      matchesWithGoals: 0,
      matchesPlayed: 0,
    };
  }

  const scopedGames = normalizeGames(games).filter((game) =>
    isFinishedGameWithResult(game) && isInYear(game.date, year)
  );
  const playerGoalEvents = getGoalEventsInYear(goalEvents, year).filter(
    (event) => event.player?.id === playerId
  );
  const shouldUseGoalEvents = Array.isArray(goalEvents);
  const goalGameIds = new Set(
    playerGoalEvents
      .map((event) => event.game?.id)
      .filter((id): id is string => Boolean(id))
  );

  let goals = shouldUseGoalEvents ? playerGoalEvents.length : 0;
  let matchesWithGoals = shouldUseGoalEvents ? goalGameIds.size : 0;
  const playedGameIds = new Set<string>();

  scopedGames.forEach((game) => {
    const matchGoalEvents = shouldUseGoalEvents
      ? []
      : (game.events || []).filter(
          (event) =>
            event?.type === "goal" &&
            event?.player?.id === playerId &&
            countsForPlayerGoalStats(event)
        );
    const matchGoals = matchGoalEvents.length;
    const playerIdsInGame = new Set(
      (game.playedPlayers || [])
        .map((player) => player?.id)
        .filter((id): id is string => Boolean(id))
    );

    if (!shouldUseGoalEvents) {
      goals += matchGoals;
    }

    if (matchGoals > 0) {
      matchesWithGoals += 1;
    }

    if (playerIdsInGame.has(playerId)) {
      playedGameIds.add(game.id ?? game.date ?? "");
    }
  });

  return {
    playerId,
    goals,
    matchesWithGoals,
    matchesPlayed: playedGameIds.size,
  };
};
