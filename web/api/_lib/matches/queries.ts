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
  "playedPlayers": playedPlayers[]->${dashboardMatchPlayerProjection},
  "goalEvents": *[
    _type == "events" &&
    game._ref == ^._id &&
    type == "goal"
  ] | order(order asc, _createdAt asc) {
    "id": _id,
    order,
    scorerKind,
    scorerSide,
    scorerSource,
    guestName,
    player->${dashboardMatchPlayerProjection}
  }
}`;

const dashboardMatchSummaryProjection = `{
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
  "playedPlayers": [],
  "goalEvents": []
}`;

const dashboardMatchPageFilter = `_type == "games" && (!$hasSearch || rival->name match $search || tournament->name match $search || tournament->organization->name match $search || location match $search || competition match $search) && (!$hasStatus || ($status == "draft" && _id in path("drafts.**")) || ($status == "published" && !(_id in path("drafts.**")) && !defined(*[_id == "drafts." + ^._id][0]._id))) && (!$hasState || state == $state) && (!$hasCompetition || competition == $competition)`;

export const dashboardMatchListQuery = `*[_type == "games"] | order(coalesce(date, _updatedAt) desc) ${dashboardMatchProjection}`;

const dashboardMatchPageQueries = {
  "date:desc": `{
    "items": *[${dashboardMatchPageFilter}] | order(coalesce(date, _updatedAt) desc, _id desc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
  "date:asc": `{
    "items": *[${dashboardMatchPageFilter}] | order(coalesce(date, _updatedAt) asc, _id asc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
  "updatedAt:desc": `{
    "items": *[${dashboardMatchPageFilter}] | order(_updatedAt desc, _id desc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
  "updatedAt:asc": `{
    "items": *[${dashboardMatchPageFilter}] | order(_updatedAt asc, _id asc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
  "rivalName:asc": `{
    "items": *[${dashboardMatchPageFilter}] | order(rival->name asc, _id asc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
  "rivalName:desc": `{
    "items": *[${dashboardMatchPageFilter}] | order(rival->name desc, _id desc)[$offset...$end] ${dashboardMatchSummaryProjection},
    "total": count(*[${dashboardMatchPageFilter}])
  }`,
} as const;

export type DashboardMatchesPageSortBy = "date" | "updatedAt" | "rivalName";
export type DashboardMatchesPageStatusFilter = "published" | "draft";
export type DashboardMatchesPageStateFilter =
  | "por_jugar"
  | "en_juego"
  | "finalizado";
export type DashboardMatchesPageCompetitionFilter =
  | "Torneo"
  | "Copa"
  | "Amistoso";

export const DASHBOARD_MATCHES_PAGE_SORT_BY = [
  "date",
  "updatedAt",
  "rivalName",
] as const;

export const DASHBOARD_MATCHES_PAGE_STATUS_FILTERS = [
  "published",
  "draft",
] as const;

export const DASHBOARD_MATCHES_PAGE_STATE_FILTERS = [
  "por_jugar",
  "en_juego",
  "finalizado",
] as const;

export const DASHBOARD_MATCHES_PAGE_COMPETITION_FILTERS = [
  "Torneo",
  "Copa",
  "Amistoso",
] as const;

export const getDashboardMatchesPageQuery = (
  sortBy: DashboardMatchesPageSortBy,
  direction: "asc" | "desc"
): string => dashboardMatchPageQueries[`${sortBy}:${direction}`];

export const dashboardMatchByIdQuery = `*[
  _type == "games" &&
  (_id == $id || _id == $draftId)
] ${dashboardMatchProjection}`;

export const dashboardMatchRelatedEventsQuery = `*[
  _type == "events" &&
  (game._ref == $id || game._ref == $draftId)
]{
  "id": _id,
  type
}`;

export const dashboardMatchGoalEventsQuery = `*[
  _type == "events" &&
  type == "goal" &&
  (game._ref == $id || game._ref == $draftId || game._ref == $publicId)
]{
  "id": _id
}`;

export const dashboardMatchOptionsQuery = `{
  "teams": *[_type == "teams" && !(_id in path("drafts.**"))] | order(name asc) {
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
