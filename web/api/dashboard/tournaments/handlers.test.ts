import { describe, expect, it } from "vitest";

import dashboardTournamentRoute from "./index.js";

describe("dashboard tournaments api handlers", () => {
  it("exporta handlers compatibles con el runtime Web de Vercel", () => {
    expect(dashboardTournamentRoute.fetch).toBeTypeOf("function");
  });

  it("responde JSON cuando falta autorizacion", async () => {
    const response = await dashboardTournamentRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/dashboard/tournaments")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });
});
