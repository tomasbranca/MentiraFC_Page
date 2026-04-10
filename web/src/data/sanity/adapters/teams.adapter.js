export const adaptTeam = (team) => {
  if (!team) return null;

  return {
    id: team._id,
    name: team.name,
    isMain: team.isMain,
    imageUrl: team.logo,
  };
};

export const adaptTeams = (teams = []) => {
  return teams.map(adaptTeam).filter(Boolean);
};
