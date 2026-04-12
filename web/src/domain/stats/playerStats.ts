import type { Game, Player } from "../../types/models";

type StatsOptions = { year?: number };
type PlayerStats = { playerId: string | null; goals: number; matchesWithGoals: number };
type TopScorer = Player & { goals: number };

const normalizeGames = (games: Game[] = []): Game[] => (Array.isArray(games) ? games : []);
const normalizePlayers = (players: Player[] = []): Player[] =>
  Array.isArray(players) ? players : [];

const isInYear = (date: string | undefined, year?: number): boolean => {
  if (!year) return true;
  if (!date) return false;
  return new Date(date).getFullYear() === year;
};

const getGoalEvents = (games: Game[] = [], year?: number) => {
  return normalizeGames(games)
    .filter((game) => isInYear(game.date, year))
    .flatMap((game) => game.events || [])
    .filter((event) => event?.type === "goal" && event?.player?.id);
};

export const getTopScorers = (
  games: Game[] = [],
  players: Player[] = [],
  options: StatsOptions = {}
): TopScorer[] => {
  const { year } = options;

  const goalsByPlayer = getGoalEvents(games, year).reduce<Record<string, number>>((acc, event) => {
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
  games: Game[] = [],
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

  const scopedGames = normalizeGames(games).filter((game) => isInYear(game.date, year));

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
