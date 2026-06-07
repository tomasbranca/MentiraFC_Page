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
    ] | order(snapshotDate desc, _updatedAt desc)[0...1]{
      _id,
      matchdayNumber,
      label,
      snapshotDate,
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
