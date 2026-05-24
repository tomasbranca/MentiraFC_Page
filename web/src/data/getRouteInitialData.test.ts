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
});
