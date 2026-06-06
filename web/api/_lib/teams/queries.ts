const dashboardTeamReferenceCountsProjection = `{
  "matches": count(*[_type == "games" && rival._ref == ^._id]),
  "tournaments": count(*[
    _type == "tournaments" &&
    count(participants[team._ref == ^._id]) > 0
  ]),
  "tables": count(*[
    _type == "standingsState" &&
    count(rows[team._ref == ^._id]) > 0
  ]),
  "snapshots": count(*[
    _type == "standingsSnapshots" &&
    count(rows[team._ref == ^._id]) > 0
  ])
}`;

const dashboardTeamProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  isMain,
  logo,
  "logoAssetId": logo.asset->_id,
  "logoUrl": logo.asset->url,
  "referenceCounts": ${dashboardTeamReferenceCountsProjection}
}`;

const dashboardTeamSummaryProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  isMain,
  "logoAssetId": logo.asset->_id,
  "logoUrl": logo.asset->url,
  "referenceCounts": ${dashboardTeamReferenceCountsProjection}
}`;

const dashboardTeamUsageFilter = `(count(*[_type == "games" && rival._ref == ^._id]) + count(*[_type == "tournaments" && count(participants[team._ref == ^._id]) > 0]) + count(*[_type == "standingsState" && count(rows[team._ref == ^._id]) > 0]) + count(*[_type == "standingsSnapshots" && count(rows[team._ref == ^._id]) > 0]))`;

const dashboardTeamPageFilter = `_type == "teams" && (!$hasSearch || name match $search || select(isMain == true => "principal", "rival") match $search) && (!$hasStatus || ($status == "draft" && _id in path("drafts.**")) || ($status == "published" && !(_id in path("drafts.**")) && !defined(*[_id == "drafts." + ^._id][0]._id))) && (!$hasKind || ($kind == "main" && isMain == true) || ($kind == "rivals" && isMain != true)) && (!$hasUsage || ($usage == "with_references" && ${dashboardTeamUsageFilter} > 0) || ($usage == "without_references" && ${dashboardTeamUsageFilter} == 0))`;

export const dashboardTeamListQuery = `*[_type == "teams"] | order(isMain desc, name asc, _updatedAt desc) ${dashboardTeamProjection}`;

const dashboardTeamPageQueries = {
  "name:asc": `{
    "items": *[${dashboardTeamPageFilter}] | order(isMain desc, name asc, _updatedAt desc, _id asc)[$offset...$end] ${dashboardTeamSummaryProjection},
    "total": count(*[${dashboardTeamPageFilter}])
  }`,
  "name:desc": `{
    "items": *[${dashboardTeamPageFilter}] | order(isMain desc, name desc, _updatedAt desc, _id desc)[$offset...$end] ${dashboardTeamSummaryProjection},
    "total": count(*[${dashboardTeamPageFilter}])
  }`,
  "updatedAt:desc": `{
    "items": *[${dashboardTeamPageFilter}] | order(_updatedAt desc, isMain desc, name asc, _id desc)[$offset...$end] ${dashboardTeamSummaryProjection},
    "total": count(*[${dashboardTeamPageFilter}])
  }`,
  "updatedAt:asc": `{
    "items": *[${dashboardTeamPageFilter}] | order(_updatedAt asc, isMain desc, name asc, _id asc)[$offset...$end] ${dashboardTeamSummaryProjection},
    "total": count(*[${dashboardTeamPageFilter}])
  }`,
} as const;

export type DashboardTeamsPageSortBy = "name" | "updatedAt";
export type DashboardTeamsPageStatusFilter = "published" | "draft";
export type DashboardTeamsPageKindFilter = "main" | "rivals";
export type DashboardTeamsPageUsageFilter =
  | "with_references"
  | "without_references";

export const DASHBOARD_TEAMS_PAGE_SORT_BY = ["name", "updatedAt"] as const;

export const DASHBOARD_TEAMS_PAGE_STATUS_FILTERS = [
  "published",
  "draft",
] as const;

export const DASHBOARD_TEAMS_PAGE_KIND_FILTERS = ["main", "rivals"] as const;

export const DASHBOARD_TEAMS_PAGE_USAGE_FILTERS = [
  "with_references",
  "without_references",
] as const;

export const getDashboardTeamsPageQuery = (
  sortBy: DashboardTeamsPageSortBy,
  direction: "asc" | "desc"
): string => dashboardTeamPageQueries[`${sortBy}:${direction}`];

export const dashboardTeamByIdQuery = `*[
  _type == "teams" &&
  (_id == $id || _id == $draftId)
] ${dashboardTeamProjection}`;

export const dashboardTeamReferenceUsageQuery = `{
  "matches": *[
    _type == "games" &&
    (rival._ref == $id || rival._ref == $draftId)
  ]{
    "id": _id
  },
  "tournaments": *[
    _type == "tournaments" &&
    count(participants[team._ref == $id || team._ref == $draftId]) > 0
  ]{
    "id": _id
  },
  "tables": *[
    _type == "standingsState" &&
    count(rows[team._ref == $id || team._ref == $draftId]) > 0
  ]{
    "id": _id
  },
  "snapshots": *[
    _type == "standingsSnapshots" &&
    count(rows[team._ref == $id || team._ref == $draftId]) > 0
  ]{
    "id": _id
  }
}`;
