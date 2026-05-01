import type { Game, MatchEvent } from "../../../types/models";

type MatchResult = "win" | "loss" | "draw";
type Scorer = {
  player: MatchEvent["player"];
  goals: number;
};

export const paginateGames = (
  games: Game[] = [],
  visibleCount = 10
): Game[] => {
  return games.slice(0, visibleCount);
};

export const groupGamesByMonth = (games: Game[] = []) => {
  return games.reduce<Record<string, Game[]>>((acc, game) => {
    const date = new Date(game.date);

    const key = date.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    if (!acc[key]) acc[key] = [];
    acc[key].push(game);

    return acc;
  }, {});
};

export const getMatchResult = (game: Game): MatchResult => {
  const { goalsFor, goalsAgainst } = game.result;

  if (goalsFor > goalsAgainst) return "win";
  if (goalsFor < goalsAgainst) return "loss";
  return "draw";
};

export const getScorers = (events: MatchEvent[] = []): Scorer[] => {
  return Object.values(
    events.reduce<Record<string, Scorer>>((acc, event) => {
      if (!event.player) return acc;

      const key = `${event.player?.name}-${event.player?.lastName}`;

      if (!acc[key]) {
        acc[key] = {
          player: event.player,
          goals: 0,
        };
      }

      acc[key].goals += 1;

      return acc;
    }, {})
  );
};
