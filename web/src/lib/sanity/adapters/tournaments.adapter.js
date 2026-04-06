export const adaptTournament = (data) => {
  if (!data) return null;

  return {
    id: data._id,
    name: `${data.organization?.name} · ${data.name}`,
    imageUrl: data.organization?.logo, // ✅ consistente
    primaryColor: data.organization?.primaryColor,
    updatedAt: data._updatedAt,

    standings: data.standings.map((row) => ({
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