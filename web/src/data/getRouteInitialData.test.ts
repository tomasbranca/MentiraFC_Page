import { describe, expect, it } from "vitest";

import { ROUTES } from "../shared/routing";
import { getRouteInitialData } from "./getRouteInitialData";

describe("getRouteInitialData", () => {
  it("usa un payload mínimo para la ruta de ingreso", async () => {
    const payload = await getRouteInitialData(ROUTES.LOGIN);

    expect(payload.bootstrapScope).toBe("empty");
    expect(payload.news).toEqual([]);
    expect(payload.latestGame).toBeNull();
  });
});
