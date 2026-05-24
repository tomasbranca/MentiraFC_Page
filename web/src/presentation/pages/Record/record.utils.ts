import {
  formatMatchGoalScorerLabel,
  getMentiraMatchGoalScorerLines,
} from "../../../domain/games";
import type { Game, MatchEvent } from "../../../types/models";

type MatchResult = "win" | "loss" | "draw";
export type ScorerLine = {
  key: string;
  label: string;
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

export const getScorers = (events: MatchEvent[] = []): ScorerLine[] =>
  getMentiraMatchGoalScorerLines(events).map((line) => ({
    key: line.key,
    label: formatMatchGoalScorerLabel(line),
    goals: line.goals,
  }));
