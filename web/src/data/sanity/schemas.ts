import { z } from "zod/v3";
import { FOOTER_SOCIAL_PLATFORMS } from "../../../shared/site/footerSettings";

const sanitySlugSchema = z.union([
  z.string(),
  z.object({ current: z.string().optional() }),
  z.undefined(),
  z.null(),
]);

type SanitySlug = z.infer<typeof sanitySlugSchema>;

export const getSanitySlugValue = (slug: SanitySlug): string | undefined => {
  const value = typeof slug === "string" ? slug : slug?.current;
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
};

export const sanityPlayerRefSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  slug: sanitySlugSchema.optional(),
});

const sanityRatingValueSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional();

const sanityFieldPlayerRatingsSchema = z
  .object({
    speed: sanityRatingValueSchema,
    shooting: sanityRatingValueSchema,
    passing: sanityRatingValueSchema,
    dribbling: sanityRatingValueSchema,
    defense: sanityRatingValueSchema,
    physical: sanityRatingValueSchema,
  })
  .nullable()
  .optional();

const sanityGoalkeeperRatingsSchema = z
  .object({
    jumping: sanityRatingValueSchema,
    saving: sanityRatingValueSchema,
    kicking: sanityRatingValueSchema,
    reflexes: sanityRatingValueSchema,
    speed: sanityRatingValueSchema,
    positioning: sanityRatingValueSchema,
  })
  .nullable()
  .optional();

export const sanityNewsSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  content: z.array(z.unknown()).nullish(),
  date: z.string(),
  slug: sanitySlugSchema.optional(),
  imageAlt: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const sanityImageDimensionsSchema = z
  .object({
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    aspectRatio: z.number().nullable().optional(),
  })
  .nullable()
  .optional();

export const sanityGalleryImageSchema = z.object({
  _key: z.string().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  isHero: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  dimensions: sanityImageDimensionsSchema,
});

export const sanityEventSchema = z.object({
  _id: z.string(),
  type: z.string(),
  order: z.number().nullable().optional(),
  scorerKind: z
    .enum(["roster", "guest", "opponent_own_goal"])
    .nullable()
    .optional(),
  scorerSide: z.string().nullable().optional(),
  scorerSource: z.string().nullable().optional(),
  guestName: z.string().nullable().optional(),
  player: sanityPlayerRefSchema.nullable().optional(),
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
    .nullable()
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
  playedPlayers: z.array(sanityPlayerRefSchema).nullish(),
});

export const sanityGallerySchema = z.object({
  _id: z.string(),
  slug: sanitySlugSchema.optional(),
  game: sanityGameSchema.optional(),
  photos: z.array(sanityGalleryImageSchema).nullish(),
  photoCount: z.number().nullable().optional(),
});

export const sanityPlayerSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  dominantFoot: z.enum(["left", "right"]).nullable().optional(),
  fieldRatings: sanityFieldPlayerRatingsSchema,
  goalkeeperRatings: sanityGoalkeeperRatingsSchema,
  birthDate: z.string().nullable().optional(),
  slug: sanitySlugSchema.optional(),
  imageUrl: z.string().nullable().optional(),
});

export const sanityStaffSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  role: z.string().trim().min(1),
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
    mainTeam: z
      .object({
        _id: z.string(),
        name: z.string(),
        logo: z.unknown().optional(),
        isMain: z.boolean().optional(),
      })
      .nullable()
      .optional(),
    primaryPrizeSlots: z
      .union([z.number(), z.string(), z.null()])
      .optional(),
    secondaryPrizeSlots: z
      .union([z.number(), z.string(), z.null()])
      .optional(),
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
      standingsSnapshots: z.array(z.unknown()).nullish(),
    })
    .passthrough();

export const sanityStandingRowSchema = z.object({
  played: z.union([z.number(), z.string(), z.null()]).optional(),
  wins: z.union([z.number(), z.string(), z.null()]).optional(),
  draws: z.union([z.number(), z.string(), z.null()]).optional(),
  losses: z.union([z.number(), z.string(), z.null()]).optional(),
  goalsFor: z.union([z.number(), z.string(), z.null()]).optional(),
  goalsAgainst: z.union([z.number(), z.string(), z.null()]).optional(),
  points: z.union([z.number(), z.string(), z.null()]).optional(),
  goalDiff: z.union([z.number(), z.string(), z.null()]).optional(),
  position: z.union([z.number(), z.string(), z.null()]).optional(),
  previousPosition: z.union([z.number(), z.string(), z.null()]).optional(),
  positionChange: z.union([z.number(), z.string(), z.null()]).optional(),
  team: z.object({
    _id: z.string(),
    name: z.string(),
    logo: z.unknown().optional(),
    isMain: z.boolean().optional(),
  }),
});

export const sanityStandingsSnapshotSchema = z.object({
  _id: z.string().nullable().optional(),
  snapshotRole: z.enum(["current", "previous"]).nullable().optional(),
  matchdayNumber: z.union([z.number(), z.string(), z.null()]).optional(),
  label: z.string().nullable().optional(),
  snapshotDate: z.string().nullable().optional(),
  gamesThroughDate: z.string().nullable().optional(),
  rows: z.array(z.unknown()).nullish(),
});

export const sanityGoalEventSchema = z.object({
  _id: z.string(),
  type: z.string(),
  order: z.number().nullable().optional(),
  scorerKind: z
    .enum(["roster", "guest", "opponent_own_goal"])
    .nullable()
    .optional(),
  scorerSide: z.string().nullable().optional(),
  scorerSource: z.string().nullable().optional(),
  guestName: z.string().nullable().optional(),
  game: z
    .object({
      _id: z.string(),
      date: z.string(),
      state: z.string().nullable().optional(),
      result: z
        .object({
          goalsFor: z.number().nullable().optional(),
          goalsAgainst: z.number().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  player: sanityPlayerRefSchema.nullable().optional(),
});

export const sanityFooterSettingsSchema = z
  .object({
    _id: z.string().optional().default("footerSettings"),
    _updatedAt: z.string().nullable().optional(),
    contactEmail: z.string().nullable().optional(),
    socials: z
      .array(
        z.object({
          _key: z.string().nullable().optional(),
          label: z.string().nullable().optional(),
          platform: z.enum(FOOTER_SOCIAL_PLATFORMS),
          url: z.string().nullable().optional(),
        })
      )
      .nullish(),
    links: z
      .array(
        z.object({
          _key: z.string().nullable().optional(),
          label: z.string().nullable().optional(),
          url: z.string().nullable().optional(),
        })
      )
      .nullish(),
    sponsors: z
      .array(
        z.object({
          _key: z.string().nullable().optional(),
          name: z.string().nullable().optional(),
          url: z.string().nullable().optional(),
          logoAlt: z.string().nullable().optional(),
          resolvedLogoUrl: z.string().nullable().optional(),
        })
      )
      .nullish(),
  })
  .nullable();

export type SanityNews = z.infer<typeof sanityNewsSchema>;
export type SanityGallery = z.infer<typeof sanityGallerySchema>;
export type SanityGalleryImage = z.infer<typeof sanityGalleryImageSchema>;
export type SanityGame = z.infer<typeof sanityGameSchema>;
export type SanityEvent = z.infer<typeof sanityEventSchema>;
export type SanityPlayer = z.infer<typeof sanityPlayerSchema>;
export type SanityStaff = z.infer<typeof sanityStaffSchema>;
export type SanityTeam = z.infer<typeof sanityTeamSchema>;
export type SanityTournament = z.infer<typeof sanityTournamentSchema>;
export type SanityStandingRow = z.infer<typeof sanityStandingRowSchema>;
export type SanityStandingsSnapshot = z.infer<
  typeof sanityStandingsSnapshotSchema
>;
export type SanityGoalEvent = z.infer<typeof sanityGoalEventSchema>;
export type SanityFooterSettings = NonNullable<
  z.infer<typeof sanityFooterSettingsSchema>
>;
