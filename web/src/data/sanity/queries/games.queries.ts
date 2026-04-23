export const LATEST_GAMES_QUERY = `
  *[_type == "games" && defined(date)] | order(date desc)[0...20] {
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
      player->{
        _id,
        name,
        lastName,
        slug
      }
    }
  }
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
      player->{
        _id,
        name,
        lastName,
        slug
      }
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
      player->{
        _id,
        name,
        lastName,
        slug
      }
    }
  }
`;
