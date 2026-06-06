const FINISHED_GOAL_EVENT_FILTER = `
    _type == "events" &&
    type == "goal" &&
    game->state == "finalizado" &&
    defined(game->result.goalsFor) &&
    defined(game->result.goalsAgainst)
`;

const GOAL_EVENT_PROJECTION = `{
    _id,
    type,
    order,
    scorerKind,
    scorerSide,
    scorerSource,
    guestName,
    game->{
      _id,
      date,
      state,
      result{
        goalsFor,
        goalsAgainst
      }
    },
    player->{
      _id,
      name,
      lastName,
      slug
    }
  }`;

export const GOAL_EVENTS_QUERY = `
  *[${FINISHED_GOAL_EVENT_FILTER}] ${GOAL_EVENT_PROJECTION}
`;

export const GOAL_EVENTS_BY_YEAR_QUERY = `
  *[
    ${FINISHED_GOAL_EVENT_FILTER} &&
    defined(game->date) &&
    game->date >= $from &&
    game->date < $to
  ] ${GOAL_EVENT_PROJECTION}
`;
