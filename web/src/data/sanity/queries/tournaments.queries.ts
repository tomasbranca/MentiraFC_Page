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
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        position,
        previousPosition,
        team->{
          _id,
          name,
          logo,
          isMain
        }
      }
    },
    "mainTeamGames": *[
      _type == "games" &&
      !(_id in path("drafts.**")) &&
      state == "finalizado" &&
      competition == "Torneo" &&
      defined(result.goalsFor) &&
      defined(result.goalsAgainst) &&
      tournament._ref == ^._id
    ]{
      result{
        goalsFor,
        goalsAgainst
      }
    },
    _updatedAt
  }
`;
