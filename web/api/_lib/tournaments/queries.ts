const dashboardTournamentParticipantProjection = `{
  "key": _key,
  "teamId": team._ref,
  "teamName": team->name,
  "teamImageUrl": team->logo.asset->url,
  "teamIsMain": team->isMain,
  status,
  activeFromMatchday,
  activeUntilMatchday,
  notes
}`;

const dashboardTournamentReferenceCountsProjection = `{
  "matches": count(*[_type == "games" && tournament._ref == ^._id]),
  "tables": count(*[_type == "standingsState" && tournament._ref == ^._id]),
  "snapshots": count(*[_type == "standingsSnapshots" && tournament._ref == ^._id])
}`;

const dashboardTournamentProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  active,
  primaryPrizeSlots,
  secondaryPrizeSlots,
  "organizationId": organization._ref,
  "organizationName": organization->name,
  "organizationImageUrl": organization->logo.asset->url,
  "participants": participants[]${dashboardTournamentParticipantProjection},
  "referenceCounts": ${dashboardTournamentReferenceCountsProjection}
}`;

export const dashboardTournamentListQuery = `*[_type == "tournaments"] | order(active desc, name asc, _updatedAt desc) ${dashboardTournamentProjection}`;

export const dashboardTournamentByIdQuery = `*[
  _type == "tournaments" &&
  (_id == $id || _id == $draftId)
] ${dashboardTournamentProjection}`;

export const dashboardTournamentOptionsQuery = `{
  "organizations": *[_type == "organizations" && !(_id in path("drafts.**"))] | order(name asc) {
    "id": _id,
    name,
    "imageUrl": logo.asset->url
  },
  "teams": *[
    _type == "teams" &&
    !(_id in path("drafts.**")) &&
    (!defined(isMain) || isMain != true)
  ] | order(name asc) {
    "id": _id,
    name,
    isMain,
    "imageUrl": logo.asset->url
  }
}`;

export const dashboardTournamentValidationOptionsQuery = `{
  "organizations": *[_type == "organizations" && !(_id in path("drafts.**"))]{
    "id": _id
  },
  "teams": *[_type == "teams" && !(_id in path("drafts.**"))]{
    "id": _id,
    name,
    isMain
  }
}`;

export const dashboardTournamentActiveSiblingsQuery = `*[
  _type == "tournaments" &&
  !(_id in path("drafts.**")) &&
  _id != $id &&
  active == true
]{
  "id": _id
}`;

export const dashboardTournamentReferenceUsageQuery = `{
  "matches": *[
    _type == "games" &&
    (tournament._ref == $id || tournament._ref == $draftId)
  ]{
    "id": _id
  },
  "tables": *[
    _type == "standingsState" &&
    (tournament._ref == $id || tournament._ref == $draftId)
  ]{
    "id": _id
  },
  "snapshots": *[
    _type == "standingsSnapshots" &&
    (tournament._ref == $id || tournament._ref == $draftId)
  ]{
    "id": _id
  }
}`;
