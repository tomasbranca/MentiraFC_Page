export const TEAMS_QUERY = `
  *[_type == "teams"] | order(name asc) {
    _id,
    name,
    isMain,
    logo
  }
`;
