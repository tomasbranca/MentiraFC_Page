import { describe, expect, it } from "vitest";

import dashboardRoute from "./[resource].js";

describe("dashboard api router", () => {
  it("delega recursos conocidos al handler correspondiente", async () => {
    const response = await dashboardRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/galleries")
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

  it("rechaza ids de dashboard invalidos antes de delegar", async () => {
    const response = await dashboardRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/dashboard/news?id=news%22%5D%20%7C%20*%5B_type==%22secret%22%5D"
      )
    );

    await expect(response.json()).resolves.toEqual({
      error: "Identificador de dashboard invalido.",
    });
    expect(response.status).toBe(400);
  });
});
