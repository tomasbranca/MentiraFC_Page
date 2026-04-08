export const PLAYERS_QUERY = `
  *[_type == "players"] | order(number asc) {
    _id,
    name,
    lastName,
    number,
    position,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;

export const PLAYER_BY_SLUG_QUERY = `
  *[_type == "players" && slug.current == $slug][0] {
    _id,
    name,
    lastName,
    number,
    position,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;
