import { getGoalEvents as fetchGoalEvents } from "./sanity/services/events.service";

import type { GoalEvent } from "../types/models";

type GoalEventsOptions = {
  year?: number;
};

export const getGoalEvents = async (
  options: GoalEventsOptions = {}
): Promise<GoalEvent[]> => fetchGoalEvents(options);
