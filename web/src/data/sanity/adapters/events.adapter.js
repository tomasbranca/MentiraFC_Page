export const adaptGoalEvent = (event) => {
  if (!event) return null;

  return {
    id: event._id,
    type: event.type,
    order: event.order,
    game: event.game
      ? {
          id: event.game._id,
          date: event.game.date,
        }
      : null,
    player: event.player
      ? {
          id: event.player._id,
          name: event.player.name,
          lastName: event.player.lastName,
          slug: event.player.slug?.current || event.player.slug,
        }
      : null,
  };
};

export const adaptGoalEvents = (events = []) => {
  return events.map(adaptGoalEvent).filter(Boolean);
};
