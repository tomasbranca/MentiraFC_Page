import { z } from "zod";

const sanitySlugSchema = z.union([
  z.string(),
  z.object({ current: z.string().optional() }),
  z.undefined(),
]);

export const sanityPlayerRefSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  slug: sanitySlugSchema.optional(),
});

export const sanityNewsSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.unknown().optional(),
  date: z.string(),
  slug: sanitySlugSchema.optional(),
  imageUrl: z.string().nullable().optional(),
});

export const sanityEventSchema = z.object({
  _id: z.string(),
  type: z.string(),
  order: z.number().optional(),
  player: sanityPlayerRefSchema.optional(),
});

export const sanityGameSchema = z.object({
  _id: z.string(),
  date: z.string(),
  state: z.string(),
  location: z.string().optional(),
  competition: z.string().optional(),
  tournament: z
    .object({
      _id: z.string(),
      name: z.string().optional(),
      organization: z
        .object({
          name: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  rival: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
      logoUrl: z.string().optional(),
    })
    .optional(),
  result: z
    .object({
      goalsFor: z.number().nullable().optional(),
      goalsAgainst: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  events: z.array(sanityEventSchema).optional(),
});

export const sanityPlayerSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  slug: sanitySlugSchema.optional(),
  imageUrl: z.string().nullable().optional(),
});

export const sanityTeamSchema = z.object({
  _id: z.string(),
  name: z.string(),
  isMain: z.boolean().optional(),
  logo: z.unknown().optional(),
});

export const sanityTournamentSchema = z
  .object({
    _id: z.string().nullable().optional(),
    _updatedAt: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    organization: z
      .object({
        name: z.string().nullable().optional(),
        logo: z.unknown().optional(),
        primaryColor: z
          .union([
            z.object({
              hex: z.string().nullable().optional(),
            }),
            z.string(),
            z.null(),
          ])
          .optional(),
      })
      .optional(),
    standings: z.array(z.unknown()).nullish(),
  })
  .passthrough();

export const sanityStandingRowSchema = z.object({
  played: z.union([z.number(), z.string(), z.null()]).optional(),
  wins: z.union([z.number(), z.string(), z.null()]).optional(),
  draws: z.union([z.number(), z.string(), z.null()]).optional(),
  losses: z.union([z.number(), z.string(), z.null()]).optional(),
  goalsFor: z.union([z.number(), z.string(), z.null()]).optional(),
  goalsAgainst: z.union([z.number(), z.string(), z.null()]).optional(),
  team: z.object({
    _id: z.string(),
    name: z.string(),
    logo: z.unknown().optional(),
    isMain: z.boolean().optional(),
  }),
});

export const sanityGoalEventSchema = z.object({
  _id: z.string(),
  type: z.string(),
  order: z.number().optional(),
  game: z
    .object({
      _id: z.string(),
      date: z.string(),
    })
    .optional(),
  player: sanityPlayerRefSchema.optional(),
});

export type SanityNews = z.infer<typeof sanityNewsSchema>;
export type SanityGame = z.infer<typeof sanityGameSchema>;
export type SanityEvent = z.infer<typeof sanityEventSchema>;
export type SanityPlayer = z.infer<typeof sanityPlayerSchema>;
export type SanityTeam = z.infer<typeof sanityTeamSchema>;
export type SanityTournament = z.infer<typeof sanityTournamentSchema>;
export type SanityStandingRow = z.infer<typeof sanityStandingRowSchema>;
export type SanityGoalEvent = z.infer<typeof sanityGoalEventSchema>;
