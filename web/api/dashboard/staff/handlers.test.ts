import { describe, expect, it } from "vitest";

import dashboardStaffRoute from "./_handler.js";

describe("dashboard staff api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardStaffRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardStaffRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/staff")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
