export const TABLE_QUERY = `
  *[_type == "table" && active == true][0]{
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