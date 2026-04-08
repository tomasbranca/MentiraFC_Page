const adaptEvent = (event) => ({
  id: event._id,
  type: event.type,
  order: event.order,
  player: event.player
    ? {
        id: event.player._id,
        name: event.player.name,
        lastName: event.player.lastName,
        slug: event.player.slug?.current || event.player.slug,
      }
    : null,
});

export const adaptGame = (game) => {
  if (!game) return null;

  return {
    id: game._id,
    date: game.date,
    state: game.state,
    location: game.location,
    competition: game.competition,

    tournament: game.tournament
      ? `${game.tournament.organization?.name} · ${game.tournament.name}`
      : null,

    rival: {
      id: game.rival?._id,
      name: game.rival?.name,
      imageUrl: game.rival?.logoUrl,
    },

    result: {
      goalsFor: game.result?.goalsFor,
      goalsAgainst: game.result?.goalsAgainst,
    },

    events: (game.events || []).map(adaptEvent),
  };
};

export const adaptGames = (games = []) => {
  return games.map(adaptGame);
};
