import { describe, expect, it } from "vitest";

import dashboardRoute from "./[resource].js";

describe("dashboard api router", () => {
  it("delega recursos conocidos al handler correspondiente", async () => {
    const response = await dashboardRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/matches")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });

  it("rechaza recursos desconocidos sin invocar handlers de dominio", async () => {
    const response = await dashboardRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/unknown")
    );

    await expect(response.json()).resolves.toEqual({
      error: "Recurso de dashboard no encontrado.",
    });
    expect(response.status).toBe(404);
  });
});
