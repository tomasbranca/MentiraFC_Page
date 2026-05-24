const dashboardTableRowProjection = `{
  "key": _key,
  "teamId": team._ref,
  "teamName": team->name,
  "teamImageUrl": team->logo.asset->url,
  wins,
  draws,
  losses,
  goalsFor,
  goalsAgainst
}`;

const dashboardTableProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  "tournamentId": tournament._ref,
  "tournamentName": tournament->name,
  "tournamentOrganizationName": tournament->organization->name,
  "tournamentImageUrl": tournament->organization->logo.asset->url,
  matchdayNumber,
  label,
  snapshotDate,
  gamesThroughDate,
  "rows": rows[]${dashboardTableRowProjection}
}`;

export const dashboardTableListQuery = `*[_type == "standingsState"] | order(coalesce(snapshotDate, _updatedAt) desc, matchdayNumber desc) ${dashboardTableProjection}`;

export const dashboardTableByIdQuery = `*[
  _type == "standingsState" &&
  (_id == $id || _id == $draftId)
] ${dashboardTableProjection}`;

export const dashboardTableOptionsQuery = `{
  "tournaments": *[_type == "tournaments" && !(_id in path("drafts.**"))] | order(active desc, name asc) {
    "id": _id,
    name,
    active,
    "organizationName": organization->name,
    "imageUrl": organization->logo.asset->url,
    "participants": participants[]{
      status,
      activeFromMatchday,
      activeUntilMatchday,
      team->{
        "id": _id,
        name,
        isMain,
        "imageUrl": logo.asset->url
      }
    }
  }
}`;

export const dashboardTableTournamentValidationQuery = `{
  "mainTeam": *[
    _type == "teams" &&
    !(_id in path("drafts.**")) &&
    isMain == true
  ][0]{
    "id": _id,
    name,
    isMain
  },
  "tournament": *[_type == "tournaments" && _id == $tournamentId][0]{
    "id": _id,
    name,
    participants[]{
      status,
      activeFromMatchday,
      activeUntilMatchday,
      team->{
        "id": _id,
        name,
        isMain
      }
    }
  }
}`;
