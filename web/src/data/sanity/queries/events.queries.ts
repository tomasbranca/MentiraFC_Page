export const GOAL_EVENTS_QUERY = `
  *[_type == "events" && type == "goal"] {
    _id,
    type,
    order,
    game->{
      _id,
      date
    },
    player->{
      _id,
      name,
      lastName,
      slug
    }
  }
`;

export const GOAL_EVENTS_BY_YEAR_QUERY = `
  *[
    _type == "events" &&
    type == "goal" &&
    defined(game->date) &&
    game->date >= $from &&
    game->date < $to
  ] {
    _id,
    type,
    order,
    game->{
      _id,
      date
    },
    player->{
      _id,
      name,
      lastName,
      slug
    }
  }
`;
