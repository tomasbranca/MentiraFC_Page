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

const GALLERY_LIST_GAME_PROJECTION = `
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

const GALLERY_LIST_PHOTOS_PROJECTION = `
  "photoCount": count(photos),
  photos[0...1]{
    _key,
    alt,
    caption,
    isHero,
    "imageUrl": image.asset->url,
    "originalFilename": image.asset->originalFilename,
    "dimensions": image.asset->metadata.dimensions
  }
`;

const PUBLISHED_GALLERIES_FILTER = `_type == "galleries" && !(_id in path("drafts.**")) && game->state == "finalizado" && defined(photos[0])`;
const GALLERIES_PAGE_FILTER = `${PUBLISHED_GALLERIES_FILTER} && (!$hasSearch || slug.current match $search || game->rival->name match $search || game->tournament->name match $search)`;

export const GALLERIES_QUERY = `
  *[${PUBLISHED_GALLERIES_FILTER}] | order(game->date desc, _createdAt desc) {
    _id,
    slug,
    ${GALLERY_GAME_PROJECTION},
    ${GALLERY_PHOTOS_PROJECTION}
  }
`;

const GALLERIES_PAGE_QUERIES = {
  "date:desc": `{
    "items": *[${GALLERIES_PAGE_FILTER}] | order(game->date desc, _createdAt desc, _id desc)[$offset...$end] {
      _id,
      slug,
      ${GALLERY_LIST_GAME_PROJECTION},
      ${GALLERY_LIST_PHOTOS_PROJECTION}
    },
    "total": count(*[${GALLERIES_PAGE_FILTER}])
  }`,
  "date:asc": `{
    "items": *[${GALLERIES_PAGE_FILTER}] | order(game->date asc, _createdAt asc, _id asc)[$offset...$end] {
      _id,
      slug,
      ${GALLERY_LIST_GAME_PROJECTION},
      ${GALLERY_LIST_PHOTOS_PROJECTION}
    },
    "total": count(*[${GALLERIES_PAGE_FILTER}])
  }`,
} as const;

export type GalleriesPageSortBy = "date";

export const GALLERIES_PAGE_SORT_BY = ["date"] as const;

export const getGalleriesPageQuery = (
  sortBy: GalleriesPageSortBy,
  direction: "asc" | "desc"
): string => GALLERIES_PAGE_QUERIES[`${sortBy}:${direction}`];

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
