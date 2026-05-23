import { describe, expect, it } from "vitest";

import dashboardOrganizationRoute from "./index.js";
import dashboardOrganizationByIdRoute from "./[id].js";

describe("dashboard organizations api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardOrganizationRoute.fetch).toBeTypeOf("function");
    expect(dashboardOrganizationByIdRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardOrganizationRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/organizations")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
