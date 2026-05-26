import { describe, expect, it } from "vitest";

import dashboardNewsRoute from "./_handler.js";

describe("dashboard news api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardNewsRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizaciÃ³n", async () => {
    const response = await dashboardNewsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/news")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
