export const GOAL_SCORER_KINDS = [
  "roster",
  "guest",
  "opponent_own_goal",
] as const;

export type GoalScorerKind = (typeof GOAL_SCORER_KINDS)[number];

export type GoalEventClassificationInput = Readonly<{
  scorerKind?: string | null;
  /** @deprecated Legacy field from an earlier draft. */
  scorerSide?: string | null;
  /** @deprecated Legacy field from an earlier draft. */
  scorerSource?: string | null;
}>;

const isLegacyOpponentOwnGoal = (
  event: GoalEventClassificationInput
): boolean =>
  event.scorerSide === "rival" ||
  event.scorerKind === "opponent_own_goal";

export const normalizeGoalScorerKind = (
  value?: string | null,
  legacy?: GoalEventClassificationInput
): GoalScorerKind => {
  if (value === "guest" || value === "opponent_own_goal" || value === "roster") {
    return value;
  }

  if (legacy && isLegacyOpponentOwnGoal(legacy)) {
    return "opponent_own_goal";
  }

  if (legacy?.scorerSource === "guest") {
    return "guest";
  }

  return "roster";
};

export const isOpponentOwnGoalEvent = (
  event: GoalEventClassificationInput
): boolean =>
  normalizeGoalScorerKind(event.scorerKind, event) === "opponent_own_goal";

export const isGuestGoalEvent = (
  event: GoalEventClassificationInput
): boolean =>
  normalizeGoalScorerKind(event.scorerKind, event) === "guest";

export const isRosterGoalEvent = (
  event: GoalEventClassificationInput
): boolean =>
  normalizeGoalScorerKind(event.scorerKind, event) === "roster";

export const countsForPlayerGoalStats = (
  event: GoalEventClassificationInput & {
    player?: { id?: string | null } | null;
  }
): boolean => isRosterGoalEvent(event) && Boolean(event.player?.id);
