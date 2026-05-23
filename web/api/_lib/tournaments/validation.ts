import { z } from "zod";

import type {
  DashboardTournamentDraftMutationInput,
  DashboardTournamentItem,
  DashboardTournamentMutationInput,
  DashboardTournamentOptions,
  DashboardTournamentParticipantMutationInput,
} from "../../../src/types/dashboard";

const dashboardTournamentParticipantStatusValues = [
  "active",
  "replaced",
  "withdrawn",
] as const;

const dashboardTournamentParticipantStatusSchema = z.enum(
  dashboardTournamentParticipantStatusValues
);

const booleanSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const nonNegativeIntegerSchema = z.coerce.number().int().min(0);

const optionalPositiveIntegerSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1).optional()
);

const optionalParticipantStatusSchema = z
  .union([dashboardTournamentParticipantStatusSchema, z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const dashboardTournamentParticipantInputSchema = z
  .object({
    key: z.string().trim().optional(),
    teamId: z.string().trim().min(1),
    status: dashboardTournamentParticipantStatusSchema,
    activeFromMatchday: optionalPositiveIntegerSchema,
    activeUntilMatchday: optionalPositiveIntegerSchema,
    notes: z.string().trim().optional(),
  })
  .superRefine((input, context) => {
    if (
      input.activeFromMatchday &&
      input.activeUntilMatchday &&
      input.activeFromMatchday > input.activeUntilMatchday
    ) {
      context.addIssue({
        code: "custom",
        path: ["activeFromMatchday"],
        message: "Invalid active matchday range.",
      });
    }

    if (input.status !== "active" && !input.activeUntilMatchday) {
      context.addIssue({
        code: "custom",
        path: ["activeUntilMatchday"],
        message: "Inactive participants need an end matchday.",
      });
    }
  });

const dashboardTournamentDraftParticipantInputSchema = z
  .object({
    key: z.string().trim().optional(),
    teamId: z.string().trim().optional(),
    status: optionalParticipantStatusSchema,
    activeFromMatchday: optionalPositiveIntegerSchema,
    activeUntilMatchday: optionalPositiveIntegerSchema,
    notes: z.string().trim().optional(),
  })
  .superRefine((input, context) => {
    if (
      input.activeFromMatchday &&
      input.activeUntilMatchday &&
      input.activeFromMatchday > input.activeUntilMatchday
    ) {
      context.addIssue({
        code: "custom",
        path: ["activeFromMatchday"],
        message: "Invalid active matchday range.",
      });
    }
  });

const dashboardTournamentInputSchema = z.object({
  name: z.string().trim().min(1),
  organizationId: z.string().trim().min(1),
  active: booleanSchema,
  primaryPrizeSlots: nonNegativeIntegerSchema,
  secondaryPrizeSlots: nonNegativeIntegerSchema,
  participants: z.array(dashboardTournamentParticipantInputSchema).min(1),
});

const dashboardTournamentDraftInputSchema = z.object({
  name: z.string().trim().optional(),
  organizationId: z.string().trim().optional(),
  active: booleanSchema.optional(),
  primaryPrizeSlots: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    nonNegativeIntegerSchema.optional()
  ),
  secondaryPrizeSlots: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    nonNegativeIntegerSchema.optional()
  ),
  participants: z.array(dashboardTournamentDraftParticipantInputSchema).optional(),
});

const dashboardTournamentParticipantItemSchema = z.object({
  key: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  teamName: z.string().nullable().optional(),
  teamImageUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  activeFromMatchday: z.number().nullable().optional(),
  activeUntilMatchday: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const dashboardTournamentReferenceCountsSchema = z.object({
  matches: z.number(),
  tables: z.number(),
  snapshots: z.number(),
});

const dashboardTournamentItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  organizationId: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  organizationImageUrl: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  primaryPrizeSlots: z.number().nullable().optional(),
  secondaryPrizeSlots: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  participants: z.array(dashboardTournamentParticipantItemSchema),
  referenceCounts: dashboardTournamentReferenceCountsSchema,
});

const dashboardTournamentOptionsSchema = z.object({
  organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
  teams: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isMain: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
});

const hasDuplicateParticipants = (
  participants: DashboardTournamentParticipantMutationInput[]
): boolean => {
  const teamIds = participants.map((participant) => participant.teamId);
  return teamIds.some((teamId, index) => teamIds.indexOf(teamId) !== index);
};

export const parseDashboardTournamentInput = (
  input: unknown
): DashboardTournamentMutationInput | null => {
  const parsed = dashboardTournamentInputSchema.safeParse(input);

  if (!parsed.success || hasDuplicateParticipants(parsed.data.participants)) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardTournamentDraftInput = (
  input: unknown
): DashboardTournamentDraftMutationInput | null => {
  const parsed = dashboardTournamentDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardTournamentRequestInput = async (
  request: Request
): Promise<DashboardTournamentMutationInput | null> =>
  parseDashboardTournamentInput(await request.json());

export const parseDashboardTournamentDraftRequestInput = async (
  request: Request
): Promise<DashboardTournamentDraftMutationInput | null> =>
  parseDashboardTournamentDraftInput(await request.json());

export const adaptDashboardTournamentItem = (
  input: unknown
): DashboardTournamentItem =>
  dashboardTournamentItemSchema.parse(input) as DashboardTournamentItem;

export const adaptDashboardTournamentOptions = (
  input: unknown
): DashboardTournamentOptions =>
  dashboardTournamentOptionsSchema.parse(input) as DashboardTournamentOptions;
