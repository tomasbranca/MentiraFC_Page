import {
  formatMatchGoalScorerLabel,
  getMentiraMatchGoalScorerLines,
  isScheduledGameState,
} from "../../../../domain/games";
import type { Game, MatchEvent } from "../../../../types/models";

export type ScorerLine = {
  key: string;
  label: string;
  goals: number;
};

export const isGameInProgress = (game: Game | null): boolean => {
  if (!game) return false;

  const now = new Date();
  const gameDate = new Date(game.date);

  return isScheduledGameState(game.state) && gameDate <= now;
};

export const getScorers = (events: MatchEvent[] = []): ScorerLine[] =>
  getMentiraMatchGoalScorerLines(events).map((line) => ({
    key: line.key,
    label: formatMatchGoalScorerLabel(line),
    goals: line.goals,
  }));

export const getShortName = (
  name?: string,
  lastName?: string
): string => {
  if (!name || !lastName) return "";
  return `${name[0].toUpperCase()}. ${lastName}`;
};
