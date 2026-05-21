const HOME_LATEST_GAME_PROJECTION = `{
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

    "events": select(
      state == "finalizado" => *[
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
      },
      []
    )
  }`;

const HOME_LATEST_GAME_ID_QUERY = `coalesce(
  *[
    _type == "games" &&
    state == "por_jugar" &&
    defined(date) &&
    dateTime(date) <= dateTime(now())
  ] | order(date desc)[0]._id,
  *[
    _type == "games" &&
    state == "por_jugar" &&
    defined(date) &&
    dateTime(date) > dateTime(now())
  ] | order(date asc)[0]._id,
  *[
    _type == "games" &&
    state == "finalizado" &&
    defined(date)
  ] | order(date desc)[0]._id
)`;

export const HOME_CRITICAL_QUERY = `
  {
    "news": *[_type == "news" && !(_id in path("drafts.**"))] | order(date desc)[0...6] {
      _id,
      title,
      description,
      date,
      slug,
      "imageAlt": image.alt,
      "imageUrl": image.asset->url
    },
    "latestGame": *[_id == ${HOME_LATEST_GAME_ID_QUERY}][0] ${HOME_LATEST_GAME_PROJECTION}
  }
`;
