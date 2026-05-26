const GALLERY_GAME_PROJECTION = `
  game->{
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
  }
`;

const GALLERY_PHOTOS_PROJECTION = `
  photos[]{
    _key,
    alt,
    caption,
    isHero,
    "imageUrl": image.asset->url,
    "originalFilename": image.asset->originalFilename,
    "dimensions": image.asset->metadata.dimensions
  }
`;

export const GALLERIES_QUERY = `
  *[
    _type == "galleries" &&
    !(_id in path("drafts.**")) &&
    game->state == "finalizado" &&
    defined(photos[0])
  ] | order(game->date desc, _createdAt desc) {
    _id,
    slug,
    ${GALLERY_GAME_PROJECTION},
    ${GALLERY_PHOTOS_PROJECTION}
  }
`;

export const GALLERY_BY_SLUG_QUERY = `
  *[
    _type == "galleries" &&
    !(_id in path("drafts.**")) &&
    slug.current == $slug &&
    game->state == "finalizado"
  ][0] {
    _id,
    slug,
    ${GALLERY_GAME_PROJECTION},
    ${GALLERY_PHOTOS_PROJECTION}
  }
`;
