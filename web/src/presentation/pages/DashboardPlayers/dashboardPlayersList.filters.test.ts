import { describe, expect, it } from "vitest";

import type { DashboardPlayerItem } from "../../../types/dashboard";
import {
  defaultDashboardPlayersListFilters,
  filterDashboardPlayersList,
} from "./dashboardPlayersList.filters";

const createPlayer = (
  overrides: Partial<DashboardPlayerItem> = {}
): DashboardPlayerItem => ({
  id: "players-1",
  status: "published",
  hasDraft: false,
  hasPublishedVersion: true,
  isActive: true,
  canManageActiveStatus: true,
  name: "Tomas",
  lastName: "Mentira",
  fullName: "Tomas Mentira",
  slug: "tomas-mentira",
  ...overrides,
});

describe("filterDashboardPlayersList", () => {
  it("filtra jugadores activos e inactivos del plantel publico", () => {
    const players = [
      createPlayer({ id: "players-1", isActive: true }),
      createPlayer({
        id: "players-2",
        fullName: "Juan Perez",
        name: "Juan",
        lastName: "Perez",
        slug: "juan-perez",
        isActive: false,
      }),
      createPlayer({
        id: "players-3",
        status: "draft",
        hasPublishedVersion: false,
        canManageActiveStatus: false,
        isActive: false,
      }),
    ];

    expect(
      filterDashboardPlayersList(players, {
        ...defaultDashboardPlayersListFilters(),
        roster: "active",
      }).map((player) => player.id)
    ).toEqual(["players-1"]);
    expect(
      filterDashboardPlayersList(players, {
        ...defaultDashboardPlayersListFilters(),
        roster: "inactive",
      }).map((player) => player.id)
    ).toEqual(["players-2", "players-3"]);
  });
});
