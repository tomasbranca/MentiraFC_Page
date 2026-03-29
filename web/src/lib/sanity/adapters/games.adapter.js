export const adaptGame = (game) => {
  if (!game) return null;

  return {
    id: game._id,
    date: game.date,
    state: game.state,
    location: game.location,
    competition: game.competition,

    rival: {
      name: game.rival?.name,
      imageUrl: game.rival?.logoUrl,
    },

    result: {
      goalsFor: game.result?.goalsFor,
      goalsAgainst: game.result?.goalsAgainst,
    },

    events: game.events || [], // 🔥 CLAVE
  };
};

export const adaptGames = (games = []) => {
  return games.map(adaptGame);
};