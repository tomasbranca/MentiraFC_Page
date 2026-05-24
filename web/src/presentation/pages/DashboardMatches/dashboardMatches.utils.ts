import {
  getFinishedMatchGoalsMismatchMessage,
  isFinishedGameState,
  isKnownGameState,
  parseOpponentOwnGoalCount,
  type GameState,
} from "../../../domain/games";
import type {
  DashboardMatchCompetition,
  DashboardMatchDraftMutationInput,
  DashboardMatchInput,
  DashboardMatchMutationInput,
  DashboardMatchState,
} from "../../../types/dashboard";

export type DashboardMatchErrors = Partial<
  Record<keyof DashboardMatchInput, string>
>;

const ARGENTINA_UTC_OFFSET = "-03:00";
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export const MATCH_COMPETITION_OPTIONS: Array<{
  value: DashboardMatchCompetition;
  label: string;
}> = [
  { value: "Torneo", label: "Torneo" },
  { value: "Copa", label: "Copa" },
  { value: "Amistoso", label: "Amistoso" },
];

export const MATCH_STATE_OPTIONS: Array<{
  value: DashboardMatchState;
  label: string;
}> = [
  { value: "por_jugar", label: "Por jugar" },
  { value: "finalizado", label: "Finalizado" },
];

export const toDatetimeLocalValue = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const parts = Object.fromEntries(
    dateParts.map(({ type, value: partValue }) => [type, partValue])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const fromDatetimeLocalValue = (value: string): string => {
  const date = new Date(`${value}:00${ARGENTINA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const isValidScore = (value: string): boolean => {
  const numericValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isInteger(numericValue) &&
    numericValue >= 0
  );
};

const parseScore = (value: string): number | undefined =>
  isValidScore(value) ? Number(value) : undefined;

const uniqueIds = (ids: string[]): string[] => [...new Set(ids)];

const normalizePlayerGoalScorers = (
  scorers: DashboardMatchInput["goalScorers"]
): DashboardMatchMutationInput["goalScorers"] => {
  const goalsByPlayer = new Map<string, number>();

  for (const scorer of scorers) {
    const playerId = scorer.playerId.trim();
    const goals = Number(scorer.goals);

    if (!playerId || !Number.isInteger(goals) || goals < 1) {
      continue;
    }

    goalsByPlayer.set(playerId, (goalsByPlayer.get(playerId) ?? 0) + goals);
  }

  return [...goalsByPlayer.entries()].map(([playerId, goals]) => ({
    playerId,
    goals,
  }));
};

const normalizeGuestGoalScorers = (
  scorers: DashboardMatchInput["guestGoalScorers"]
): DashboardMatchMutationInput["guestGoalScorers"] => {
  const goalsByGuest = new Map<string, number>();

  for (const scorer of scorers) {
    const name = scorer.name.trim();
    const goals = Number(scorer.goals);

    if (!name || !Number.isInteger(goals) || goals < 1) {
      continue;
    }

    goalsByGuest.set(name, (goalsByGuest.get(name) ?? 0) + goals);
  }

  return [...goalsByGuest.entries()].map(([name, goals]) => ({
    name,
    goals,
  }));
};

export const validateDashboardMatchInput = (
  values: DashboardMatchInput
): DashboardMatchErrors => {
  const errors: DashboardMatchErrors = {};

  if (!values.rivalId.trim()) {
    errors.rivalId = "Elegi un rival.";
  }

  if (!values.date.trim() || Number.isNaN(new Date(values.date).getTime())) {
    errors.date = "Elegi una fecha valida.";
  }

  if (!values.location.trim()) {
    errors.location = "Escribi la ubicacion.";
  }

  if (values.competition === "Torneo" && !values.tournamentId.trim()) {
    errors.tournamentId = "Elegi el torneo.";
  }

  if (isFinishedGameState(values.state)) {
    if (!isValidScore(values.goalsFor)) {
      errors.goalsFor = "Carga los goles de Mentira FC.";
    }

    if (!isValidScore(values.goalsAgainst)) {
      errors.goalsAgainst = "Carga los goles del rival.";
    }

    if (isValidScore(values.goalsFor)) {
      const goalsFor = Number(values.goalsFor);
      const opponentOwnGoals = parseOpponentOwnGoalCount(values.opponentOwnGoals);
      const goalsMismatchMessage = getFinishedMatchGoalsMismatchMessage(
        goalsFor,
        values.goalScorers,
        values.guestGoalScorers,
        opponentOwnGoals
      );

      if (goalsMismatchMessage) {
        errors.goalScorers = goalsMismatchMessage;
      }
    }
  }

  return errors;
};

export const buildDashboardMatchMutationInput = (
  values: DashboardMatchInput
): DashboardMatchMutationInput => {
  const isFinished = isFinishedGameState(values.state);

  return {
    rivalId: values.rivalId.trim(),
    date: values.date.trim(),
    location: values.location.trim(),
    competition: values.competition,
    tournamentId:
      values.competition === "Torneo" ? values.tournamentId.trim() : undefined,
    state: values.state,
    goalsFor: isFinished ? parseScore(values.goalsFor) : undefined,
    goalsAgainst: isFinished ? parseScore(values.goalsAgainst) : undefined,
    playedPlayerIds: isFinished ? uniqueIds(values.playedPlayerIds) : [],
    goalScorers: isFinished ? normalizePlayerGoalScorers(values.goalScorers) : [],
    guestGoalScorers: isFinished
      ? normalizeGuestGoalScorers(values.guestGoalScorers)
      : [],
    opponentOwnGoals: isFinished
      ? parseOpponentOwnGoalCount(values.opponentOwnGoals)
      : 0,
  };
};

export const buildDashboardMatchDraftInput = (
  values: DashboardMatchInput
): DashboardMatchDraftMutationInput => buildDashboardMatchMutationInput(values);

export const getDashboardMatchStateLabel = (
  state?: GameState | string | null
): string => {
  if (!isKnownGameState(state)) {
    return "Sin estado";
  }

  const option = MATCH_STATE_OPTIONS.find((item) => item.value === state);
  return option?.label ?? "Sin estado";
};

export const getDashboardMatchCompetitionLabel = (
  competition?: string | null
): string => competition?.trim() || "Sin competencia";
