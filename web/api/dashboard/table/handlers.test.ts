import { describe, expect, it } from "vitest";

import dashboardTableRoute from "./index.js";
import dashboardTableByIdRoute from "./[id].js";

describe("dashboard table api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardTableRoute.fetch).toBeTypeOf("function");
    expect(dashboardTableByIdRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardTableRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/table")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
