export const GAME_PROJECTION = `{
    _id,
    date,
    state,
    location,
    competition,

    tournament->{
      _id,
      name,
      organization->{
        name
      }
    },

    rival->{
      _id,
      name,
      "logoUrl": logo.asset->url
    },

    result{
      goalsFor,
      goalsAgainst
    },

    "events": *[
      _type == "events" &&
      game._ref == ^._id &&
      type == "goal"
    ]{
      _id,
      type,
      order,
      scorerKind,
      scorerSide,
      scorerSource,
      guestName,
      player->{
        _id,
        name,
        lastName,
        slug
      }
    },

    playedPlayers[]->{
      _id,
      name,
      lastName,
      slug
    }
  }`;

export const LATEST_GAME_QUERY = `
  coalesce(
    *[
      _type == "games" &&
      state == "por_jugar" &&
      defined(date) &&
      dateTime(date) <= dateTime(now())
    ] | order(date desc)[0] ${GAME_PROJECTION},
    *[
      _type == "games" &&
      state == "por_jugar" &&
      defined(date) &&
      dateTime(date) > dateTime(now())
    ] | order(date asc)[0] ${GAME_PROJECTION},
    *[
      _type == "games" &&
      state == "finalizado" &&
      defined(date)
    ] | order(date desc)[0] ${GAME_PROJECTION}
  )
`;

export const FINISHED_GAMES_QUERY = `
  *[_type == "games" && state == "finalizado"] | order(date desc) {
    _id,
    date,
    state,
    location,
    competition,

    tournament->{
      _id,
      name,
      organization->{
        name
      }
    },

    result{
      goalsFor,
      goalsAgainst
    },

    rival->{
      _id,
      name,
      "logoUrl": logo.asset->url
    },

    "events": *[
      _type == "events" &&
      game._ref == ^._id &&
      type == "goal"
    ]{
      _id,
      type,
      order,
      scorerKind,
      scorerSide,
      scorerSource,
      guestName,
      player->{
        _id,
        name,
        lastName,
        slug
      }
    },

    playedPlayers[]->{
      _id,
      name,
      lastName,
      slug
    }
  }
`;

export const FINISHED_TOURNAMENT_GAMES_QUERY = `
  *[_type == "games" && state == "finalizado" && competition == "Torneo"] | order(date desc) {
    _id,
    date,
    state,
    location,
    competition,

    tournament->{
      _id,
      name,
      organization->{
        name
      }
    },

    result{
      goalsFor,
      goalsAgainst
    },

    rival->{
      _id,
      name,
      "logoUrl": logo.asset->url
    },

    "events": *[
      _type == "events" &&
      game._ref == ^._id &&
      type == "goal"
    ]{
      _id,
      type,
      order,
      scorerKind,
      scorerSide,
      scorerSource,
      guestName,
      player->{
        _id,
        name,
        lastName,
        slug
      }
    },

    playedPlayers[]->{
      _id,
      name,
      lastName,
      slug
    }
  }
`;
