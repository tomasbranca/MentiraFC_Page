export const TOURNAMENT_QUERY = `
  *[_type == "tournaments" && active == true][0]{
    _id,
    name,
    logo,
    primaryColor,
    standings[]{
      position,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      team->{
        _id,
        name,
        logo,
        isMain
      }
    },
    _updatedAt
  }
`;