export const PLAYERS_QUERY = `
  *[_type == "players"] | order(number asc) {
    _id,
    name,
    lastName,
    number,
    position,
    birthDate,
    goals,
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
    goals,
    slug,
    "imageUrl": photo.asset->url
  }
`;

export const PLAYER_WITH_GOALS_BY_YEAR_QUERY = `
  *[_type == "players" && slug.current == $slug][0]{
    _id,
    name,
    lastName,
    number,
    position,
    birthDate,
    slug,
    "imageUrl": photo.asset->url,

    "goalsThisYear": count(
      *[
        _type == "events" &&
        type == "goal" &&
        player._ref == ^._id &&
        game->date >= $start &&
        game->date < $end
      ]
    )
  }
`;
export const TOP_SCORERS_QUERY = `
  *[_type == "players"]{
    _id,
    name,
    lastName,
    number,
    slug,
    "imageUrl": photo.asset->url,

    "goals": count(
      *[
        _type == "events" &&
        type == "goal" &&
        player._ref == ^._id &&
        game->date >= $start &&
        game->date < $end
      ]
    )
  }
  | order(goals desc)
`;