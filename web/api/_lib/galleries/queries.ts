const dashboardGalleryPhotoProjection = `{
  "key": _key,
  alt,
  caption,
  isHero,
  "imageAssetId": image.asset->_id,
  "imageUrl": image.asset->url,
  "originalFilename": image.asset->originalFilename,
  "dimensions": image.asset->metadata.dimensions
}`;

const dashboardGalleryGameFieldsProjection = `
  "gameId": game._ref,
  "gameDate": game->date,
  "gameState": game->state,
  "gameLocation": game->location,
  "gameCompetition": game->competition,
  "gameTournamentId": game->tournament->_id,
  "gameTournamentName": game->tournament->name,
  "gameTournamentOrganizationName": game->tournament->organization->name,
  "rivalId": game->rival->_id,
  "rivalName": game->rival->name,
  "rivalImageUrl": game->rival->logo.asset->url,
  "goalsFor": game->result.goalsFor,
  "goalsAgainst": game->result.goalsAgainst
`;

const dashboardGalleryGameOptionProjection = `{
  "id": _id,
  date,
  state,
  location,
  competition,
  "tournamentId": tournament->_id,
  "tournamentName": tournament->name,
  "tournamentOrganizationName": tournament->organization->name,
  "rivalId": rival->_id,
  "rivalName": rival->name,
  "rivalImageUrl": rival->logo.asset->url,
  "goalsFor": result.goalsFor,
  "goalsAgainst": result.goalsAgainst
}`;

const dashboardGalleryProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  "slug": slug.current,
  ${dashboardGalleryGameFieldsProjection},
  "photos": photos[]${dashboardGalleryPhotoProjection}
}`;

const dashboardGallerySummaryProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  "slug": slug.current,
  ${dashboardGalleryGameFieldsProjection},
  "photos": select(
    count(photos[isHero == true && defined(image.asset)]) > 0 =>
      photos[isHero == true && defined(image.asset)][0...1],
    photos[defined(image.asset)][0...1]
  )[]${dashboardGalleryPhotoProjection},
  "photoCount": count(photos[defined(image.asset)])
}`;

const dashboardGalleryPageFilter = `_type == "galleries" && (!$hasSearch || slug.current match $search || game->rival->name match $search || game->tournament->name match $search || game->tournament->organization->name match $search || game->competition match $search || game->location match $search) && (!$hasStatus || ($status == "draft" && _id in path("drafts.**")) || ($status == "published" && !(_id in path("drafts.**")) && !defined(*[_id == "drafts." + ^._id][0]._id))) && (!$hasPhotos || ($photos == "with_photos" && count(photos[defined(image.asset)]) > 0) || ($photos == "empty" && count(photos[defined(image.asset)]) == 0))`;

export const dashboardGalleryListQuery = `*[_type == "galleries"] | order(coalesce(game->date, _updatedAt) desc) ${dashboardGalleryProjection}`;

const dashboardGalleryPageQueries = {
  "date:desc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(coalesce(game->date, _updatedAt) desc, _id desc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
  "date:asc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(coalesce(game->date, _updatedAt) asc, _id asc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
  "updatedAt:desc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(_updatedAt desc, _id desc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
  "updatedAt:asc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(_updatedAt asc, _id asc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
  "slug:asc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(slug.current asc, _id asc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
  "slug:desc": `{
    "items": *[${dashboardGalleryPageFilter}] | order(slug.current desc, _id desc)[$offset...$end] ${dashboardGallerySummaryProjection},
    "total": count(*[${dashboardGalleryPageFilter}])
  }`,
} as const;

export type DashboardGalleriesPageSortBy = "date" | "updatedAt" | "slug";
export type DashboardGalleriesPageStatusFilter = "published" | "draft";
export type DashboardGalleriesPagePhotoFilter = "with_photos" | "empty";

export const DASHBOARD_GALLERIES_PAGE_SORT_BY = [
  "date",
  "updatedAt",
  "slug",
] as const;

export const DASHBOARD_GALLERIES_PAGE_STATUS_FILTERS = [
  "published",
  "draft",
] as const;

export const DASHBOARD_GALLERIES_PAGE_PHOTO_FILTERS = [
  "with_photos",
  "empty",
] as const;

export const getDashboardGalleriesPageQuery = (
  sortBy: DashboardGalleriesPageSortBy,
  direction: "asc" | "desc"
): string => dashboardGalleryPageQueries[`${sortBy}:${direction}`];

export const dashboardGalleryByIdQuery = `*[
  _type == "galleries" &&
  (_id == $id || _id == $draftId)
] ${dashboardGalleryProjection}`;

export const dashboardGalleryOptionsQuery = `{
  "games": *[
    _type == "games" &&
    !(_id in path("drafts.**")) &&
    state == "finalizado"
  ] | order(date desc) ${dashboardGalleryGameOptionProjection}
}`;

export const dashboardGalleryValidationOptionsQuery = `{
  "games": *[
    _type == "games" &&
    !(_id in path("drafts.**")) &&
    state == "finalizado"
  ]{
    "id": _id
  }
}`;
