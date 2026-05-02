import { describe, expect, it } from "vitest";

import {
  shouldLoadNewsInitially,
  shouldLoadPlayerDetailInitially,
  shouldLoadRecordInitially,
  shouldLoadStaffInitially,
  shouldLoadTableInitially,
  shouldLoadTeamInitially,
} from "./loadingState.utils";

describe("loadingState.utils", () => {
  it("marca la home-critical como carga inicial para noticias", () => {
    expect(shouldLoadNewsInitially("home-critical", 4)).toBe(true);
  });

  it("no fuerza recarga de noticias cuando el bootstrap full ya trajo una lista vacia valida", () => {
    expect(shouldLoadNewsInitially("full", 0)).toBe(false);
  });

  it("detecta cuando historial y plantel faltan por bootstrap parcial", () => {
    expect(shouldLoadRecordInitially("news-detail", 0)).toBe(true);
    expect(shouldLoadTeamInitially("player-detail", 0)).toBe(true);
    expect(shouldLoadStaffInitially("player-detail", 0)).toBe(true);
  });

  it("no fuerza tabla cuando el bootstrap full ya resolvio que no hay torneo activo", () => {
    expect(
      shouldLoadTableInitially({
        bootstrapScope: "full",
        tournament: null,
        teamsLength: 0,
        gamesLength: 0,
      })
    ).toBe(false);
  });

  it("mantiene loading inicial en detalle de jugador cuando todavia no existe payload del slug", () => {
    expect(
      shouldLoadPlayerDetailInitially({
        slug: "juan-perez",
        hasInitialDetail: false,
      })
    ).toBe(true);
  });

  it("permite mostrar not found inmediato si el detalle ya vino resuelto desde bootstrap", () => {
    expect(
      shouldLoadPlayerDetailInitially({
        slug: "slug-inexistente",
        hasInitialDetail: true,
      })
    ).toBe(false);
  });
});
