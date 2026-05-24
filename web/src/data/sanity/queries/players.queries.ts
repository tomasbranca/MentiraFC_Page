export const PLAYERS_QUERY = `
  *[_type == "players" && coalesce(isActive, true) == true] | order(number asc) {
    _id,
    name,
    lastName,
    number,
    position,
    dominantFoot,
    fieldRatings,
    goalkeeperRatings,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;

export const PLAYER_BY_SLUG_OR_ID_QUERY = `
  coalesce(
    *[_type == "players" && slug.current == $slug][0],
    *[_type == "players" && _id == $slug][0]
  ) {
    _id,
    name,
    lastName,
    number,
    position,
    dominantFoot,
    fieldRatings,
    goalkeeperRatings,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;
