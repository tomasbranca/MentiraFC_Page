import { describe, expect, it } from "vitest";

import dashboardPlayersRoute from "./index.js";
import dashboardPlayerByIdRoute from "./[id].js";

describe("dashboard players api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardPlayersRoute.fetch).toBeTypeOf("function");
    expect(dashboardPlayerByIdRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardPlayersRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/players")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
