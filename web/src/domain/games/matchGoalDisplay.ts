import type { MatchEvent } from "../../types/models";
import {
  isGuestGoalEvent,
  isOpponentOwnGoalEvent,
  isRosterGoalEvent,
} from "./matchGoalEvents";

export type MatchGoalScorerLine = {
  key: string;
  label: string;
  goals: number;
  variant: "roster" | "guest" | "opponent_own_goal";
};

const getPlayerLabel = (
  player: NonNullable<MatchEvent["player"]>
): string => `${player.name} ${player.lastName}`.trim();

export const getMatchGoalScorerLines = (
  events: MatchEvent[] = []
): MatchGoalScorerLine[] => {
  const lines = new Map<string, MatchGoalScorerLine>();

  for (const event of events) {
    if (event.type !== "goal") {
      continue;
    }

    if (isOpponentOwnGoalEvent(event)) {
      const key = "opponent-own-goal";
      const current = lines.get(key);

      lines.set(key, {
        key,
        label: "Gol en propia (rival)",
        goals: (current?.goals ?? 0) + 1,
        variant: "opponent_own_goal",
      });
      continue;
    }

    if (isGuestGoalEvent(event)) {
      const guestName = event.guestName?.trim();

      if (!guestName) {
        continue;
      }

      const key = `guest-${guestName.toLowerCase()}`;
      const current = lines.get(key);

      lines.set(key, {
        key,
        label: guestName,
        goals: (current?.goals ?? 0) + 1,
        variant: "guest",
      });
      continue;
    }

    if (!isRosterGoalEvent(event) || !event.player) {
      continue;
    }

    const key = `roster-${event.player.id}`;
    const current = lines.get(key);

    lines.set(key, {
      key,
      label: getPlayerLabel(event.player),
      goals: (current?.goals ?? 0) + 1,
      variant: "roster",
    });
  }

  return [...lines.values()];
};

export const formatMatchGoalScorerLabel = (line: MatchGoalScorerLine): string => {
  if (line.variant === "guest") {
    return `${line.label} (inv.)`;
  }

  if (line.variant === "opponent_own_goal") {
    return line.label;
  }

  return line.label;
};

export const getMentiraMatchGoalScorerLines = (
  events: MatchEvent[] = []
): MatchGoalScorerLine[] => getMatchGoalScorerLines(events);
