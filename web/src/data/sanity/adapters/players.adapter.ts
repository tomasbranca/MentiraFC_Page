import type { Player } from "../../../types/models";
import { sanityPlayerSchema, type SanityPlayer } from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptPlayer = (p: unknown): Player | null => {
  const validated = validateSanityItem(sanityPlayerSchema, p, "players.adapter:adaptPlayer");
  if (!validated) return null;

  return {
    id: validated._id,
    name: validated.name,
    lastName: validated.lastName,
    fullName: `${validated.name} ${validated.lastName}`,
    number: validated.number,
    position: validated.position,
    birthDate: validated.birthDate,
    slug: typeof validated.slug === "string" ? validated.slug : validated.slug?.current,
    imageUrl: validated.imageUrl,
  };
};

export const adaptPlayers = (players: unknown): Player[] => {
  const validatedPlayers: SanityPlayer[] = validateSanityArray(
    sanityPlayerSchema,
    players,
    "players.adapter:adaptPlayers",
  );

  return validatedPlayers.map(adaptPlayer).filter((player): player is Player => Boolean(player));
};
