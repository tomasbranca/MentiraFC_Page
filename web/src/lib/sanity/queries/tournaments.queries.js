export const TOURNAMENT_QUERY = `
  *[_type == "tournament" && active == true][0]{
    _id,
    title,
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