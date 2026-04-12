import type { GoalEvent } from "../../../types/models";

type SanitySlug = { current?: string } | string | undefined;
type SanityGoalEvent = {
  _id: string;
  type: string;
  order?: number;
  game?: { _id: string; date: string };
  player?: { _id: string; name: string; lastName: string; slug?: SanitySlug };
};

export const adaptGoalEvent = (event: SanityGoalEvent | null | undefined): GoalEvent | null => {
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
          slug: typeof event.player.slug === "string" ? event.player.slug : event.player.slug?.current,
        }
      : null,
  };
};

export const adaptGoalEvents = (events: SanityGoalEvent[] = []): GoalEvent[] => {
  return events.map(adaptGoalEvent).filter((event): event is GoalEvent => Boolean(event));
};
