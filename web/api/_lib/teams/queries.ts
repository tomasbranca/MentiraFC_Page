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

export const dashboardTeamListQuery = `*[_type == "teams"] | order(isMain desc, name asc, _updatedAt desc) ${dashboardTeamProjection}`;

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
