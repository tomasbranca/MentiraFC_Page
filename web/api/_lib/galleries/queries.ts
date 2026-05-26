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

export const dashboardGalleryListQuery = `*[_type == "galleries"] | order(coalesce(game->date, _updatedAt) desc) ${dashboardGalleryProjection}`;

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
