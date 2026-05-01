import type { Game, MatchEvent, Player, PlayerWithGoals } from "../../types/models";

type StatsOptions = { year?: number };
type PlayerStats = {
  playerId: string | null;
  goals: number;
  matchesWithGoals: number;
};
type PlayerInput = Partial<Player> & Pick<Player, "id">;
type EventInput =
  | (Partial<MatchEvent> & {
      player?: { id?: string | null } | null;
    })
  | null;
type GameInput = Partial<Omit<Game, "events">> & {
  events?: EventInput[] | null;
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

const isInYear = (date: string | undefined, year?: number): boolean => {
  if (!year) return true;
  if (!date) return false;
  return new Date(date).getFullYear() === year;
};

const getGoalEvents = (games: GameInput[] | unknown = [], year?: number) => {
  return normalizeGames(games)
    .filter((game) => isInYear(game.date, year))
    .flatMap((game) => game.events || [])
    .filter(
      (event): event is NonNullable<EventInput> =>
        event !== null && event.type === "goal" && Boolean(event.player?.id)
    );
};

export const getTopScorers = (
  games: GameInput[] | unknown = [],
  players: PlayerInput[] | unknown = [],
  options: StatsOptions = {}
): PlayerWithGoals[] => {
  const { year } = options;

  const goalsByPlayer = getGoalEvents(games, year).reduce<
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

export const getPlayerStats = (
  games: GameInput[] | unknown = [],
  playerId?: string | null,
  options: StatsOptions = {}
): PlayerStats => {
  const { year } = options;

  if (!playerId) {
    return {
      playerId: null,
      goals: 0,
      matchesWithGoals: 0,
    };
  }

  const scopedGames = normalizeGames(games).filter((game) =>
    isInYear(game.date, year)
  );

  let goals = 0;
  let matchesWithGoals = 0;

  scopedGames.forEach((game) => {
    const matchGoals = (game.events || []).filter(
      (event) => event?.type === "goal" && event?.player?.id === playerId
    ).length;

    goals += matchGoals;

    if (matchGoals > 0) {
      matchesWithGoals += 1;
    }
  });

  return {
    playerId,
    goals,
    matchesWithGoals,
  };
};
