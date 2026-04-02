export const adaptTournament = (data) => {
  if (!data) return null;

  return {
    id: data._id,
    name: data.name,
    imageUrl: data.logo, // ✅ consistente
    primaryColor: data.primaryColor,
    updatedAt: data._updatedAt,

    standings: data.standings.map((row) => ({
      position: row.position,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,

      team: {
        id: row.team._id,
        name: row.team.name,
        imageUrl: row.team.logo, // ✅ consistente
        isMain: row.team.isMain,
      },
    })),
  };
};