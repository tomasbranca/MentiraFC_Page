import { z } from "zod";

import {
  KNOWN_GAME_STATES,
  isKnownGameState,
  normalizeGameState,
} from "../../../src/domain/games/gameState.js";
import { countMentiraGoalsRecorded } from "../../../src/domain/games/matchGoals.js";
import type {
  DashboardMatchCompetition,
  DashboardMatchDraftMutationInput,
  DashboardMatchInput,
  DashboardMatchItem,
  DashboardMatchMutationInput,
  DashboardMatchOptions,
  DashboardMatchState,
} from "../../../src/types/dashboard";

const dashboardMatchCompetitionValues = ["Torneo", "Copa", "Amistoso"] as const;
const dashboardMatchStateValues = KNOWN_GAME_STATES;

const dashboardMatchCompetitionSchema = z.enum(
  dashboardMatchCompetitionValues
);
const dashboardMatchStateSchema = z.enum(dashboardMatchStateValues);
const scoreSchema = z.coerce.number().int().min(0);
const scorerGoalSchema = z.coerce.number().int().min(1);
const optionalScoreSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  scoreSchema.optional()
);
const dashboardMatchGoalScorerSchema = z.object({
  playerId: z.string().trim().min(1),
  goals: scorerGoalSchema,
});

const dashboardMatchGuestGoalScorerSchema = z.object({
  name: z.string().trim().min(1),
  goals: scorerGoalSchema,
});

const dashboardMatchInputSchema = z
  .object({
    rivalId: z.string().trim().min(1),
    date: z.string().datetime(),
    location: z.string().trim().min(1),
    competition: dashboardMatchCompetitionSchema,
    tournamentId: z.string().trim().optional(),
    state: dashboardMatchStateSchema,
    goalsFor: optionalScoreSchema,
    goalsAgainst: optionalScoreSchema,
    playedPlayerIds: z.array(z.string().trim().min(1)).optional(),
    goalScorers: z.array(dashboardMatchGoalScorerSchema).optional(),
    guestGoalScorers: z.array(dashboardMatchGuestGoalScorerSchema).optional(),
    opponentOwnGoals: optionalScoreSchema,
  })
  .superRefine((input, context) => {
    if (input.competition === "Torneo" && !input.tournamentId?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["tournamentId"],
        message: "Tournament is required for tournament matches.",
      });
    }

    if (input.state === "finalizado") {
      if (typeof input.goalsFor !== "number") {
        context.addIssue({
          code: "custom",
          path: ["goalsFor"],
          message: "Goals for are required for finished matches.",
        });
      }

      if (typeof input.goalsAgainst !== "number") {
        context.addIssue({
          code: "custom",
          path: ["goalsAgainst"],
          message: "Goals against are required for finished matches.",
        });
      }

      if (typeof input.goalsFor === "number") {
        const recordedGoals = countMentiraGoalsRecorded(
          input.goalScorers ?? [],
          input.guestGoalScorers ?? [],
          input.opponentOwnGoals ?? 0
        );

        if (recordedGoals !== input.goalsFor) {
          context.addIssue({
            code: "custom",
            path: ["goalScorers"],
            message: `Recorded goals (${recordedGoals}) must match goals for (${input.goalsFor}).`,
          });
        }
      }
    }
  });

const dashboardMatchDraftInputSchema = z.object({
  rivalId: z.string().trim().optional(),
  date: z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()))
    .optional(),
  location: z.string().trim().optional(),
  competition: z
    .union([dashboardMatchCompetitionSchema, z.literal("")])
    .optional(),
  tournamentId: z.string().trim().optional(),
  state: z.union([dashboardMatchStateSchema, z.literal("")]).optional(),
  goalsFor: optionalScoreSchema,
  goalsAgainst: optionalScoreSchema,
  playedPlayerIds: z.array(z.string().trim().min(1)).optional(),
  goalScorers: z.array(dashboardMatchGoalScorerSchema).optional(),
  guestGoalScorers: z.array(dashboardMatchGuestGoalScorerSchema).optional(),
  opponentOwnGoals: optionalScoreSchema,
});

const dashboardMatchPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
});

const dashboardMatchItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  date: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  state: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) =>
      value == null || value === "" ? null : normalizeGameState(value)
    ),
  location: z.string().nullable().optional(),
  competition: z.string().nullable().optional(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  tournamentLabel: z.string().nullable().optional(),
  rivalId: z.string().nullable().optional(),
  rivalName: z.string().nullable().optional(),
  rivalImageUrl: z.string().nullable().optional(),
  result: z
    .object({
      goalsFor: z.number().nullable().optional(),
      goalsAgainst: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  playedPlayers: z.array(dashboardMatchPlayerSchema),
  goalScorers: z.array(
    dashboardMatchPlayerSchema.extend({
      goals: z.number(),
    })
  ),
  guestGoalScorers: z.array(
    z.object({
      name: z.string(),
      goals: z.number(),
    })
  ),
  opponentOwnGoals: z.number().int().min(0).default(0),
});

const dashboardMatchOptionsSchema = z.object({
  teams: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isMain: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
  tournaments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organizationName: z.string().nullable().optional(),
      active: z.boolean().optional(),
    })
  ),
  players: z.array(dashboardMatchPlayerSchema),
});

const uniqueIds = (ids: string[] = []): string[] => [...new Set(ids)];

const normalizePlayerGoalScorers = (
  scorers: Array<{ playerId: string; goals: number }> = []
): Array<{ playerId: string; goals: number }> => {
  const goalsByPlayer = new Map<string, number>();

  for (const scorer of scorers) {
    const playerId = scorer.playerId.trim();

    if (!playerId || scorer.goals < 1) {
      continue;
    }

    goalsByPlayer.set(playerId, (goalsByPlayer.get(playerId) ?? 0) + scorer.goals);
  }

  return [...goalsByPlayer.entries()].map(([playerId, goals]) => ({
    playerId,
    goals,
  }));
};

const normalizeGuestGoalScorers = (
  scorers: Array<{ name: string; goals: number }> = []
): Array<{ name: string; goals: number }> => {
  const goalsByGuest = new Map<string, number>();

  for (const scorer of scorers) {
    const name = scorer.name.trim();

    if (!name || scorer.goals < 1) {
      continue;
    }

    goalsByGuest.set(name, (goalsByGuest.get(name) ?? 0) + scorer.goals);
  }

  return [...goalsByGuest.entries()].map(([name, goals]) => ({
    name,
    goals,
  }));
};

const isMatchCompetition = (
  value?: string
): value is DashboardMatchCompetition =>
  dashboardMatchCompetitionValues.includes(
    value as DashboardMatchCompetition
  );

const isMatchState = (value?: string): value is DashboardMatchState =>
  isKnownGameState(value);

export const parseDashboardMatchInput = (
  input: unknown
): DashboardMatchMutationInput | null => {
  const parsed = dashboardMatchInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;
  const isFinished = data.state === "finalizado";

  return {
    rivalId: data.rivalId,
    date: data.date,
    location: data.location,
    competition: data.competition,
    tournamentId:
      data.competition === "Torneo" ? data.tournamentId?.trim() : undefined,
    state: data.state,
    goalsFor: isFinished ? data.goalsFor : undefined,
    goalsAgainst: isFinished ? data.goalsAgainst : undefined,
    playedPlayerIds: isFinished ? uniqueIds(data.playedPlayerIds) : [],
    goalScorers: isFinished ? normalizePlayerGoalScorers(data.goalScorers) : [],
    guestGoalScorers: isFinished
      ? normalizeGuestGoalScorers(data.guestGoalScorers)
      : [],
    opponentOwnGoals: isFinished ? data.opponentOwnGoals ?? 0 : 0,
  };
};

export const parseDashboardMatchDraftInput = (
  input: unknown
): DashboardMatchDraftMutationInput | null => {
  const parsed = dashboardMatchDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;
  const isFinished = data.state === "finalizado";

  return {
    rivalId: data.rivalId ?? "",
    date: data.date ?? "",
    location: data.location ?? "",
    competition: isMatchCompetition(data.competition)
      ? data.competition
      : undefined,
    tournamentId: data.tournamentId ?? "",
    state: isMatchState(data.state) ? data.state : undefined,
    goalsFor: isFinished ? data.goalsFor : undefined,
    goalsAgainst: isFinished ? data.goalsAgainst : undefined,
    playedPlayerIds: isFinished ? uniqueIds(data.playedPlayerIds) : [],
    goalScorers: isFinished ? normalizePlayerGoalScorers(data.goalScorers) : [],
    guestGoalScorers: isFinished
      ? normalizeGuestGoalScorers(data.guestGoalScorers)
      : [],
    opponentOwnGoals: isFinished ? data.opponentOwnGoals ?? 0 : 0,
  };
};

export const parseDashboardMatchRequestInput = async (
  request: Request
): Promise<DashboardMatchMutationInput | null> => {
  const payload = (await request.json()) as DashboardMatchInput;
  return parseDashboardMatchInput(payload);
};

export const parseDashboardMatchDraftRequestInput = async (
  request: Request
): Promise<DashboardMatchDraftMutationInput | null> => {
  const payload = (await request.json()) as DashboardMatchDraftMutationInput;
  return parseDashboardMatchDraftInput(payload);
};

export const adaptDashboardMatchItem = (input: unknown): DashboardMatchItem =>
  dashboardMatchItemSchema.parse(input) as DashboardMatchItem;

export const adaptDashboardMatchOptions = (
  input: unknown
): DashboardMatchOptions =>
  dashboardMatchOptionsSchema.parse(input) as DashboardMatchOptions;
