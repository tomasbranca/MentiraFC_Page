export const TOURNAMENT_QUERY = `
  *[_type == "tournaments" && active == true][0]{
    _id,
    organization->{
      name,
      logo,
      primaryColor
    },
    name,
    standings[]{
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
