import type { GoalEvent } from "../../../types/models";
import {
  getSanitySlugValue,
  sanityGoalEventSchema,
  type SanityGoalEvent,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptGoalEvent = (event: unknown): GoalEvent | null => {
  const validated = validateSanityItem(
    sanityGoalEventSchema,
    event,
    "events.adapter:adaptGoalEvent"
  );
  if (!validated) return null;

  return {
    id: validated._id,
    type: validated.type,
    order: validated.order,
    game: validated.game
      ? {
          id: validated.game._id,
          date: validated.game.date,
        }
      : null,
    player: validated.player
      ? {
          id: validated.player._id,
          name: validated.player.name,
          lastName: validated.player.lastName,
          slug: getSanitySlugValue(validated.player.slug),
        }
      : null,
  };
};

export const adaptGoalEvents = (events: unknown): GoalEvent[] => {
  const validatedEvents: SanityGoalEvent[] = validateSanityArray(
    sanityGoalEventSchema,
    events,
    "events.adapter:adaptGoalEvents"
  );

  return validatedEvents
    .map(adaptGoalEvent)
    .filter((event): event is GoalEvent => Boolean(event));
};
