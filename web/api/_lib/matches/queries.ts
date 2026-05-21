const dashboardMatchPlayerProjection = `{
  "id": _id,
  name,
  lastName,
  number,
  position
}`;

const dashboardMatchProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  date,
  state,
  location,
  competition,
  "tournamentId": tournament._ref,
  "tournamentName": tournament->name,
  "tournamentOrganizationName": tournament->organization->name,
  "rivalId": rival._ref,
  "rivalName": rival->name,
  "rivalImageUrl": rival->logo.asset->url,
  result{
    goalsFor,
    goalsAgainst
  },
  "playedPlayers": playedPlayers[]->${dashboardMatchPlayerProjection}
}`;

export const dashboardMatchListQuery = `*[_type == "games"] | order(coalesce(date, _updatedAt) desc) ${dashboardMatchProjection}`;

export const dashboardMatchByIdQuery = `*[
  _type == "games" &&
  (_id == $id || _id == $draftId)
] ${dashboardMatchProjection}`;

export const dashboardMatchRelatedEventsQuery = `*[
  _type == "events" &&
  (game._ref == $id || game._ref == $draftId)
]{
  "id": _id
}`;

export const dashboardMatchOptionsQuery = `{
  "teams": *[_type == "teams"] | order(name asc) {
    "id": _id,
    name,
    isMain,
    "imageUrl": logo.asset->url
  },
  "tournaments": *[_type == "tournaments"] | order(active desc, name asc) {
    "id": _id,
    name,
    active,
    "organizationName": organization->name
  },
  "players": *[_type == "players"] | order(number asc, lastName asc, name asc) ${dashboardMatchPlayerProjection}
}`;
