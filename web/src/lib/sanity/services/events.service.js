import { client } from "../sanity.client";
import { GOAL_EVENTS_QUERY } from "../queries/events.queries";
import { adaptGoalEvents } from "../adapters/events.adapter";

export const getGoalEvents = async () => {
  const data = await client.fetch(GOAL_EVENTS_QUERY);
  return adaptGoalEvents(data);
};
