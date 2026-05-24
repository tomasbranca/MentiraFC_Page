export type GoalScorerGoalCountInput = Readonly<{
  goals: number | string;
}>;

export const countRecordedGoalsFor = (
  scorers: ReadonlyArray<GoalScorerGoalCountInput>
): number =>
  scorers.reduce((total, scorer) => {
    const goals = Number(scorer.goals);

    if (!Number.isInteger(goals) || goals < 1) {
      return total;
    }

    return total + goals;
  }, 0);

export const parseOpponentOwnGoalCount = (value: string): number => {
  const goals = Number(value.trim());

  if (!Number.isInteger(goals) || goals < 0) {
    return 0;
  }

  return goals;
};

export const countMentiraGoalsRecorded = (
  rosterScorers: ReadonlyArray<GoalScorerGoalCountInput>,
  guestScorers: ReadonlyArray<GoalScorerGoalCountInput> = [],
  opponentOwnGoals = 0
): number =>
  countRecordedGoalsFor(rosterScorers) +
  countRecordedGoalsFor(guestScorers) +
  opponentOwnGoals;

export const getFinishedMatchGoalsMismatchMessage = (
  goalsFor: number,
  rosterScorers: ReadonlyArray<GoalScorerGoalCountInput>,
  guestScorers: ReadonlyArray<GoalScorerGoalCountInput> = [],
  opponentOwnGoals = 0
): string | null => {
  const recordedGoals = countMentiraGoalsRecorded(
    rosterScorers,
    guestScorers,
    opponentOwnGoals
  );

  if (recordedGoals === goalsFor) {
    return null;
  }

  const goalsLabel = goalsFor === 1 ? "gol" : "goles";
  const recordedLabel = recordedGoals === 1 ? "gol" : "goles";

  return `Los goles cargados suman ${recordedGoals} ${recordedLabel}, pero el resultado marca ${goalsFor} ${goalsLabel} de Mentira FC. Ajustá el marcador, el plantel, los invitados o los goles en propia del rival antes de publicar.`;
};
