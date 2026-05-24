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
      tournament._ref == ^._id
    ] | order(matchdayNumber desc, snapshotDate desc, _updatedAt desc)[0...2]{
      _id,
      matchdayNumber,
      label,
      snapshotDate,
      gamesThroughDate,
      rows[]{
        "played": coalesce(wins, 0) + coalesce(draws, 0) + coalesce(losses, 0),
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        "points": coalesce(wins, 0) * 3 + coalesce(draws, 0),
        "goalDiff": coalesce(goalsFor, 0) - coalesce(goalsAgainst, 0),
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
