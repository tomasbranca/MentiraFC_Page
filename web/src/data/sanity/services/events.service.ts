import {
  GOAL_EVENTS_BY_YEAR_QUERY,
  GOAL_EVENTS_QUERY,
} from "../queries/events.queries";
import { adaptGoalEvents } from "../adapters/events.adapter";
import { fetchSanityQuery } from "../sanityFetch";

import type { GoalEvent } from "../../../types/models";

type GoalEventsOptions = {
  year?: number;
};

const getYearRange = (year: number) => ({
  from: `${year}-01-01T00:00:00.000Z`,
  to: `${year + 1}-01-01T00:00:00.000Z`,
});

export const getGoalEvents = async (
  options: GoalEventsOptions = {}
): Promise<GoalEvent[]> => {
  const { year } = options;
  const data = year
    ? await fetchSanityQuery(GOAL_EVENTS_BY_YEAR_QUERY, {
        params: getYearRange(year),
      })
    : await fetchSanityQuery(GOAL_EVENTS_QUERY);

  return adaptGoalEvents(data);
};
