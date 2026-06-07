import { z } from "zod";

import type {
  DashboardTableDraftMutationInput,
  DashboardTableItem,
  DashboardTableMutationInput,
  DashboardTableOptions,
} from "../../../src/types/dashboard";

const optionalNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).optional()
);

const optionalPositiveIntegerSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1).optional()
);

const dateTimeSchema = z.string().trim().min(1).refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid datetime"
);

const optionalDateTimeSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  dateTimeSchema.optional()
);

const dashboardTableRowInputSchema = z.object({
  key: z.string().trim().optional(),
  teamId: z.string().trim().min(1),
  wins: z.coerce.number().int().min(0),
  draws: z.coerce.number().int().min(0),
  losses: z.coerce.number().int().min(0),
  goalsFor: z.coerce.number().int().min(0),
  goalsAgainst: z.coerce.number().int().min(0),
});

const dashboardTableDraftRowInputSchema = z.object({
  key: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
  wins: optionalNumberSchema,
  draws: optionalNumberSchema,
  losses: optionalNumberSchema,
  goalsFor: optionalNumberSchema,
  goalsAgainst: optionalNumberSchema,
});

const dashboardTableInputSchema = z.object({
  tournamentId: z.string().trim().min(1),
  matchdayNumber: z.coerce.number().int().min(1),
  label: z.string().trim().optional(),
  snapshotDate: dateTimeSchema,
  rows: z.array(dashboardTableRowInputSchema).min(1),
});

const dashboardTableDraftInputSchema = z.object({
  tournamentId: z.string().trim().optional(),
  matchdayNumber: optionalPositiveIntegerSchema,
  label: z.string().trim().optional(),
  snapshotDate: optionalDateTimeSchema,
  rows: z.array(dashboardTableDraftRowInputSchema).optional(),
});

const dashboardTableRowItemSchema = z.object({
  key: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  teamName: z.string().nullable().optional(),
  teamImageUrl: z.string().nullable().optional(),
  wins: z.number().nullable().optional(),
  draws: z.number().nullable().optional(),
  losses: z.number().nullable().optional(),
  goalsFor: z.number().nullable().optional(),
  goalsAgainst: z.number().nullable().optional(),
});

const dashboardTableItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  tournamentOrganizationName: z.string().nullable().optional(),
  tournamentImageUrl: z.string().nullable().optional(),
  matchdayNumber: z.number().nullable().optional(),
  label: z.string().nullable().optional(),
  snapshotDate: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  rows: z.array(dashboardTableRowItemSchema),
});

const dashboardTableTeamOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  isMain: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  activeFromMatchday: z.number().nullable().optional(),
  activeUntilMatchday: z.number().nullable().optional(),
});

const dashboardTableOptionsSchema = z.object({
  tournaments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organizationName: z.string().nullable().optional(),
      active: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
      participants: z.array(dashboardTableTeamOptionSchema),
    })
  ),
});

const hasDuplicateTeams = (
  rows: DashboardTableMutationInput["rows"]
): boolean => {
  const teamIds = rows.map((row) => row.teamId);
  return teamIds.some((teamId, index) => teamIds.indexOf(teamId) !== index);
};

export const parseDashboardTableInput = (
  input: unknown
): DashboardTableMutationInput | null => {
  const parsed = dashboardTableInputSchema.safeParse(input);

  if (!parsed.success || hasDuplicateTeams(parsed.data.rows)) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardTableDraftInput = (
  input: unknown
): DashboardTableDraftMutationInput | null => {
  const parsed = dashboardTableDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardTableRequestInput = async (
  request: Request
): Promise<DashboardTableMutationInput | null> =>
  parseDashboardTableInput(await request.json());

export const parseDashboardTableDraftRequestInput = async (
  request: Request
): Promise<DashboardTableDraftMutationInput | null> =>
  parseDashboardTableDraftInput(await request.json());

export const adaptDashboardTableItem = (input: unknown): DashboardTableItem =>
  dashboardTableItemSchema.parse(input) as DashboardTableItem;

export const adaptDashboardTableOptions = (
  input: unknown
): DashboardTableOptions =>
  dashboardTableOptionsSchema.parse(input) as DashboardTableOptions;
