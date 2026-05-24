import { describe, expect, it } from "vitest";

import dashboardTeamRoute from "./index.js";

describe("dashboard teams api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardTeamRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardTeamRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/teams")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
