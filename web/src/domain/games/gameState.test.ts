import { describe, expect, it } from "vitest";

import {
  KNOWN_GAME_STATES,
  UNKNOWN_GAME_STATE,
  isFinishedGameState,
  isKnownGameState,
  isScheduledGameState,
  isUnknownGameState,
  normalizeGameState,
} from "./gameState";

describe("gameState", () => {
  it("reconoce los estados conocidos del dominio", () => {
    for (const state of KNOWN_GAME_STATES) {
      expect(isKnownGameState(state)).toBe(true);
      expect(normalizeGameState(state)).toBe(state);
    }
  });

  it("normaliza estados desconocidos o invalidos a desconocido", () => {
    expect(normalizeGameState("suspendido")).toBe(UNKNOWN_GAME_STATE);
    expect(normalizeGameState("")).toBe(UNKNOWN_GAME_STATE);
    expect(normalizeGameState(null)).toBe(UNKNOWN_GAME_STATE);
    expect(normalizeGameState(undefined)).toBe(UNKNOWN_GAME_STATE);
  });

  it("clasifica helpers solo para estados conocidos", () => {
    expect(isFinishedGameState("finalizado")).toBe(true);
    expect(isFinishedGameState("por_jugar")).toBe(false);
    expect(isFinishedGameState(UNKNOWN_GAME_STATE)).toBe(false);

    expect(isScheduledGameState("por_jugar")).toBe(true);
    expect(isScheduledGameState(UNKNOWN_GAME_STATE)).toBe(false);

    expect(isUnknownGameState(UNKNOWN_GAME_STATE)).toBe(true);
    expect(isUnknownGameState("finalizado")).toBe(false);
  });
});
