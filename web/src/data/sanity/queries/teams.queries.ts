export const TEAMS_QUERY = `
  *[_type == "teams" && !(_id in path("drafts.**"))] | order(name asc) {
    _id,
    name,
    isMain,
    logo
  }
`;
