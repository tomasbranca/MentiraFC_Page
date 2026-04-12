import type { Player } from "../../../types/models";

type SanitySlug = { current?: string } | string | undefined;
type SanityPlayer = {
  _id: string;
  name: string;
  lastName: string;
  number?: number | null;
  position?: string | null;
  birthDate?: string | null;
  slug?: SanitySlug;
  imageUrl?: string | null;
};

export const adaptPlayer = (p: SanityPlayer | null | undefined): Player | null => {
  if (!p) return null;

  return {
    id: p._id,
    name: p.name,
    lastName: p.lastName,
    fullName: `${p.name} ${p.lastName}`,
    number: p.number,
    position: p.position,
    birthDate: p.birthDate,
    slug: typeof p.slug === "string" ? p.slug : p.slug?.current,
    imageUrl: p.imageUrl,
  };
};

export const adaptPlayers = (players: SanityPlayer[] = []): Player[] => {
  return players.map(adaptPlayer).filter((player): player is Player => Boolean(player));
};
