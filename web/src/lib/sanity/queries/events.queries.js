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
