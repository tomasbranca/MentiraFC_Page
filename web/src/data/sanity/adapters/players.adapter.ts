import type { Player } from "../../../types/models";
import {
  getSanitySlugValue,
  sanityPlayerSchema,
  type SanityPlayer,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

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
