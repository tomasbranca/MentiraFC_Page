export const isGameInProgress = (game) => {
  if (!game) return false;

  const now = new Date();
  const gameDate = new Date(game.date);

  return game.state === "por_jugar" && gameDate <= now;
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

export const getShortName = (name, lastName) => {
  if (!name || !lastName) return "";
  return `${name[0].toUpperCase()}. ${lastName}`;
};