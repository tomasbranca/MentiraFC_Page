import { describe, expect, it } from "vitest";

import type { Game } from "../../../types/models";
import {
  getGameWidgetResultLabel,
  getGameWidgetVisualState,
} from "./GameWidget.utils";

const createGame = (overrides: Partial<Game> = {}): Game => ({
  id: "game-1",
  date: "2026-05-16T21:30:00.000Z",
  state: "por_jugar",
  rival: {
    id: "team-1",
    name: "Rival FC",
  },
  result: null,
  events: [],
  playedPlayers: [],
  ...overrides,
});

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

  it("muestra VS para partidos por jugar sin inventar 0-0", () => {
    expect(getGameWidgetResultLabel(createGame())).toBe("VS");
  });

  it("muestra marcador solo cuando el partido finalizado tiene resultado", () => {
    expect(
      getGameWidgetResultLabel(
        createGame({
          state: "finalizado",
          result: {
            goalsFor: 2,
            goalsAgainst: 1,
          },
        })
      )
    ).toBe("2 - 1");
  });

  it("marca finalizados incompletos como sin resultado", () => {
    expect(
      getGameWidgetResultLabel(
        createGame({
          state: "finalizado",
          result: null,
        })
      )
    ).toBe("Sin resultado");
  });
});
