import { describe, expect, it } from "vitest";

import dashboardGalleryRoute from "./_handler.js";

describe("dashboard galleries api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardGalleryRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardGalleryRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/galleries")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
