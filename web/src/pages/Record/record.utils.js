export const paginateGames = (games = [], visibleCount = 10) => {
  return games.slice(0, visibleCount);
};

export const groupGamesByMonth = (games = []) => {
  return games.reduce((acc, game) => {
    const date = new Date(game.date);

    const key = date.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    if (!acc[key]) acc[key] = [];
    acc[key].push(game);

    return acc;
  }, {});
};

export const getMatchResult = (game) => {
  const { goalsFor, goalsAgainst } = game.result;

  if (goalsFor > goalsAgainst) return "win";
  if (goalsFor < goalsAgainst) return "loss";
  return "draw";
};

export const getScorers = (events = []) => {
  return Object.values(
    events.reduce((acc, event) => {
      const key = `${event.player?.name}-${event.player?.lastName}`;

      if (!acc[key]) {
        acc[key] = {
          player: event.player,
          goals: 0,
        };
      }

      acc[key].goals += 1;

      return acc;
    }, {})
  );
};