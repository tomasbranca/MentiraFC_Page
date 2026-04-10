export const adaptPlayers = (players = []) => {
  return players.map(adaptPlayer);
};

export const adaptPlayer = (p) => {
  if (!p) return null;

  return {
    id: p._id,
    name: p.name,
    lastName: p.lastName,
    fullName: `${p.name} ${p.lastName}`,
    number: p.number,
    position: p.position,
    birthDate: p.birthDate,
    slug: p.slug?.current || p.slug,
    imageUrl: p.imageUrl,
  };
};
