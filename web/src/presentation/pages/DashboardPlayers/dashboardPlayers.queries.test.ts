import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { queryKeys } from "../../../data/queryKeys";
import type { DashboardPlayerItem } from "../../../types/dashboard";
import {
  cacheDashboardPlayer,
  dashboardPlayerDetailQueryOptions,
  dashboardPlayersListQueryOptions,
  invalidateDashboardPlayerPublishDependencies,
  invalidateDashboardPlayersList,
} from "./dashboardPlayers.queries";

describe("dashboardPlayers query helpers", () => {
  it("keeps list and detail cache keys centralized", () => {
    expect(dashboardPlayersListQueryOptions().queryKey).toEqual(
      queryKeys.dashboard.players.all
    );
    expect(dashboardPlayerDetailQueryOptions("players-123").queryKey).toEqual(
      queryKeys.dashboard.players.byId("players-123")
    );
  });

  it("invalidates only the dashboard player list after draft saves", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateDashboardPlayersList(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.players.all,
    });
  });

  it("invalidates dashboard and public dependencies after publish/delete", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateDashboardPlayerPublishDependencies(queryClient);

    expect(invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: queryKeys.dashboard.players.all },
      { queryKey: queryKeys.players.all },
      { queryKey: queryKeys.dashboard.matches.options },
      { queryKey: queryKeys.games.all },
      { queryKey: queryKeys.events.goals() },
    ]);
  });

  it("writes saved players back to the detail cache", () => {
    const queryClient = new QueryClient();
    const player = {
      id: "players-123",
      status: "published",
      hasDraft: false,
      hasPublishedVersion: true,
      isActive: true,
      canManageActiveStatus: true,
      name: "Tomas",
      lastName: "Mentira",
      fullName: "Tomas Mentira",
      slug: "tomas-mentira",
    } as DashboardPlayerItem;

    cacheDashboardPlayer(queryClient, player);

    expect(
      queryClient.getQueryData(queryKeys.dashboard.players.byId(player.id))
    ).toEqual(player);
  });
});
