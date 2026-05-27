import { describe, expect, it } from "vitest";

import { ROUTES } from "../shared/routing";
import { getRouteInitialData } from "./getRouteInitialData";

describe("getRouteInitialData", () => {
  it("usa un payload mínimo para las rutas de autenticación", async () => {
    await Promise.all([
      ROUTES.LOGIN,
      ROUTES.PASSWORD_RESET_REQUEST,
      ROUTES.PASSWORD_RESET_UPDATE,
    ].map(async (route) => {
      const payload = await getRouteInitialData(route);

      expect(payload.bootstrapScope).toBe("empty");
      expect(payload.news).toEqual([]);
      expect(payload.latestGame).toBeNull();
    }));
  });
  it("usa un payload minimo para las rutas internas del dashboard", async () => {
    await Promise.all([
      ROUTES.DASHBOARD,
      ROUTES.DASHBOARD_GALLERIES,
      ROUTES.DASHBOARD_GALLERIES_NEW,
      ROUTES.DASHBOARD_GALLERIES_EDIT("galleries-1"),
    ].map(async (route) => {
      const payload = await getRouteInitialData(route);

      expect(payload.bootstrapScope).toBe("empty");
      expect(payload.galleries).toEqual([]);
      expect(payload.latestGame).toBeNull();
    }));
  });

  it("usa un payload minimo para cuenta y admin", async () => {
    await Promise.all([
      ROUTES.ACCOUNT,
      ROUTES.ADMIN,
      ROUTES.ADMIN_COMMENT_REPORTS,
    ].map(async (route) => {
      const payload = await getRouteInitialData(route);

      expect(payload.bootstrapScope).toBe("empty");
      expect(payload.news).toEqual([]);
      expect(payload.latestGame).toBeNull();
    }));
  });
});
