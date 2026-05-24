const dashboardPlayerProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  lastName,
  number,
  position,
  dominantFoot,
  isActive,
  fieldRatings,
  goalkeeperRatings,
  birthDate,
  "slug": slug.current,
  photo,
  "imageAssetId": photo.asset->_id,
  "imageUrl": photo.asset->url
}`;

export const dashboardPlayerListQuery = `*[_type == "players"] | order(coalesce(number, 9999) asc, lastName asc, name asc) ${dashboardPlayerProjection}`;

export const dashboardPlayerByIdQuery = `*[
  _type == "players" &&
  (_id == $id || _id == $draftId)
] ${dashboardPlayerProjection}`;

export const dashboardPlayerReferenceUsageQuery = `{
  "games": *[
    _type == "games" &&
    count(playedPlayers[_ref == $id || _ref == $draftId]) > 0
  ]{
    "id": _id,
    playedPlayers
  },
  "events": *[
    _type == "events" &&
    (player._ref == $id || player._ref == $draftId)
  ]{
    "id": _id
  }
}`;
