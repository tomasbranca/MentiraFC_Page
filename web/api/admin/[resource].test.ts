import { describe, expect, it } from "vitest";

import adminRoute from "./[resource].js";

describe("admin api router", () => {
  it("expone una Function admin centralizada", () => {
    expect(adminRoute.fetch).toBeTypeOf("function");
  });

  it("devuelve 404 para recursos admin desconocidos", async () => {
    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/desconocido")
    );

    await expect(response.json()).resolves.toEqual({
      error: "Recurso admin no encontrado.",
    });
    expect(response.status).toBe(404);
  });
});
