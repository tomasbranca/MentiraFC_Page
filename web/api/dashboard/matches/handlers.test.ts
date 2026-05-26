import { describe, expect, it } from "vitest";

import dashboardMatchesRoute from "./_handler.js";

describe("dashboard matches api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardMatchesRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardMatchesRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/matches")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
