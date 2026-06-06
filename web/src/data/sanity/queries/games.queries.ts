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

const GAME_LIST_PROJECTION = `{
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
    }
  }`;

const VALID_FINISHED_GAME_FILTER = `state == "finalizado" && defined(result.goalsFor) && defined(result.goalsAgainst)`;
const FINISHED_GAMES_PAGE_FILTER = `_type == "games" && !(_id in path("drafts.**")) && ${VALID_FINISHED_GAME_FILTER} && (!$hasSearch || rival->name match $search || tournament->name match $search || location match $search || competition match $search)`;

const GAMES_PAGE_QUERIES = {
  "date:desc": `{
    "items": *[${FINISHED_GAMES_PAGE_FILTER}] | order(date desc, _id desc)[$offset...$end] ${GAME_LIST_PROJECTION},
    "total": count(*[${FINISHED_GAMES_PAGE_FILTER}])
  }`,
  "date:asc": `{
    "items": *[${FINISHED_GAMES_PAGE_FILTER}] | order(date asc, _id asc)[$offset...$end] ${GAME_LIST_PROJECTION},
    "total": count(*[${FINISHED_GAMES_PAGE_FILTER}])
  }`,
} as const;

export type GamesPageSortBy = "date";

export const GAMES_PAGE_SORT_BY = ["date"] as const;

export const getGamesPageQuery = (
  sortBy: GamesPageSortBy,
  direction: "asc" | "desc"
): string => GAMES_PAGE_QUERIES[`${sortBy}:${direction}`];

export const GAME_BY_ID_QUERY = `
  *[
    _type == "games" &&
    !(_id in path("drafts.**")) &&
    ${VALID_FINISHED_GAME_FILTER} &&
    _id == $id
  ][0] ${GAME_PROJECTION}
`;

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
      ${VALID_FINISHED_GAME_FILTER} &&
      defined(date)
    ] | order(date desc)[0] ${GAME_PROJECTION}
  )
`;

export const FINISHED_GAMES_QUERY = `
  *[_type == "games" && ${VALID_FINISHED_GAME_FILTER}] | order(date desc) {
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
  *[
    _type == "games" &&
    ${VALID_FINISHED_GAME_FILTER} &&
    defined(tournament._ref)
  ] | order(date desc) {
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
