import {
  formatMatchGoalScorerLabel,
  getMentiraMatchGoalScorerLines,
} from "../../../domain/games";
import type { GameListItem, MatchEvent } from "../../../types/models";

type MatchResult = "win" | "loss" | "draw" | "unknown";
export type ScorerLine = {
  key: string;
  label: string;
  goals: number;
};

export const groupGamesByMonth = (games: GameListItem[] = []) => {
  return games.reduce<Record<string, GameListItem[]>>((acc, game) => {
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

export const getMatchResult = (game: GameListItem): MatchResult => {
  if (!game.result) {
    return "unknown";
  }

  const { goalsFor, goalsAgainst } = game.result;

  if (goalsFor > goalsAgainst) return "win";
  if (goalsFor < goalsAgainst) return "loss";
  return "draw";
};

export const getRecordScoreLabel = (game: GameListItem): string =>
  game.result
    ? `${game.result.goalsFor} - ${game.result.goalsAgainst}`
    : "Sin resultado";

export const getScorers = (events: MatchEvent[] = []): ScorerLine[] =>
  getMentiraMatchGoalScorerLines(events).map((line) => ({
    key: line.key,
    label: formatMatchGoalScorerLabel(line),
    goals: line.goals,
  }));
