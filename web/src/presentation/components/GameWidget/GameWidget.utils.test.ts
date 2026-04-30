import { describe, expect, it } from "vitest";

import { getGameWidgetVisualState } from "./GameWidget.utils";

describe("GameWidget.utils", () => {
  it("muestra skeleton durante el bootstrap vacio", () => {
    expect(
      getGameWidgetVisualState({
        loading: true,
        game: null,
      })
    ).toBe("skeleton");
  });

  it("no reserva espacio cuando no hay partido pero la carga ya termino", () => {
    expect(
      getGameWidgetVisualState({
        loading: false,
        game: null,
      })
    ).toBe("empty");
  });
});
