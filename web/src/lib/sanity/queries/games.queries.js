export const LATEST_GAME_QUERY = `
  *[_type == "games"] | order(date desc)[0] {
    _id,
    date,
    state,
    location,
    competition,

    tournament->{
      name,
      organization->{
        name
      }
    },

    rival->{
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
      player->{
        name,
        lastName
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
      name,
      "logoUrl": logo.asset->url
    },

    "events": *[
      _type == "events" &&
      game._ref == ^._id &&
      type == "goal"
    ]{
      player->{
        name,
        lastName
      }
    }
  }
`;
