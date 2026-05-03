import type {
  FieldPlayerRatings,
  GoalkeeperRatings,
  Player,
} from "../../../types/models";
import {
  getSanitySlugValue,
  sanityPlayerSchema,
  type SanityPlayer,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

const normalizeRatingValue = (
  value: number | string | null | undefined
): number | null => {
  const numericValue =
    typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : value;

  return typeof numericValue === "number" &&
    Number.isInteger(numericValue) &&
    numericValue >= 1 &&
    numericValue <= 10
    ? numericValue
    : null;
};

const hasAnyRatingValue = (ratings: Record<string, number | null>): boolean =>
  Object.values(ratings).some((value) => value !== null);

const adaptFieldPlayerRatings = (
  ratings: SanityPlayer["fieldRatings"]
): FieldPlayerRatings | undefined => {
  if (!ratings) return undefined;

  const normalized = {
    speed: normalizeRatingValue(ratings.speed),
    shooting: normalizeRatingValue(ratings.shooting),
    passing: normalizeRatingValue(ratings.passing),
    dribbling: normalizeRatingValue(ratings.dribbling),
    defense: normalizeRatingValue(ratings.defense),
    physical: normalizeRatingValue(ratings.physical),
  };

  return hasAnyRatingValue(normalized) ? normalized : undefined;
};

const adaptGoalkeeperRatings = (
  ratings: SanityPlayer["goalkeeperRatings"]
): GoalkeeperRatings | undefined => {
  if (!ratings) return undefined;

  const normalized = {
    jumping: normalizeRatingValue(ratings.jumping),
    saving: normalizeRatingValue(ratings.saving),
    kicking: normalizeRatingValue(ratings.kicking),
    reflexes: normalizeRatingValue(ratings.reflexes),
    speed: normalizeRatingValue(ratings.speed),
    positioning: normalizeRatingValue(ratings.positioning),
  };

  return hasAnyRatingValue(normalized) ? normalized : undefined;
};

export const adaptPlayer = (p: unknown): Player | null => {
  const validated = validateSanityItem(
    sanityPlayerSchema,
    p,
    "players.adapter:adaptPlayer"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    name: validated.name,
    lastName: validated.lastName,
    fullName: `${validated.name} ${validated.lastName}`,
    number: validated.number,
    position: validated.position,
    dominantFoot: validated.dominantFoot,
    fieldRatings: adaptFieldPlayerRatings(validated.fieldRatings),
    goalkeeperRatings: adaptGoalkeeperRatings(validated.goalkeeperRatings),
    birthDate: validated.birthDate,
    slug: getSanitySlugValue(validated.slug),
    imageUrl: validated.imageUrl,
  };
};

export const adaptPlayers = (players: unknown): Player[] => {
  const validatedPlayers: SanityPlayer[] = validateSanityArray(
    sanityPlayerSchema,
    players,
    "players.adapter:adaptPlayers"
  );

  return validatedPlayers
    .map(adaptPlayer)
    .filter((player): player is Player => Boolean(player));
};
