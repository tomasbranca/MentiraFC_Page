export const TOURNAMENT_QUERY = `
  *[_type == "tournaments" && active == true][0]{
    _id,
    organization->{
      name,
      logo,
      primaryColor
    },
    name,
    "mainTeam": *[
      _type == "teams" &&
      !(_id in path("drafts.**")) &&
      isMain == true
    ][0]{
      _id,
      name,
      logo,
      isMain
    },
    primaryPrizeSlots,
    secondaryPrizeSlots,
    "standingsSnapshots": *[
      _type == "standingsSnapshots" &&
      tournament._ref == ^._id &&
      snapshotRole in ["current", "previous"]
    ] | order(snapshotRole asc)[0...2]{
      _id,
      snapshotRole,
      matchdayNumber,
      label,
      snapshotDate,
      gamesThroughDate,
      rows[]{
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points,
        goalDiff,
        position,
        previousPosition,
        positionChange,
        team->{
          _id,
          name,
          logo,
          isMain
        }
      }
    },
    _updatedAt
  }
`;
