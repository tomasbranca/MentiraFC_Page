import { describe, expect, it } from "vitest";

import {
  countsForPlayerGoalStats,
  isGuestGoalEvent,
  isOpponentOwnGoalEvent,
  normalizeGoalScorerKind,
} from "./matchGoalEvents";

describe("matchGoalEvents", () => {
  it("clasifica goles de plantel, invitados y en propia del rival", () => {
    expect(normalizeGoalScorerKind("roster")).toBe("roster");
    expect(normalizeGoalScorerKind("guest")).toBe("guest");
    expect(normalizeGoalScorerKind("opponent_own_goal")).toBe(
      "opponent_own_goal"
    );
    expect(
      normalizeGoalScorerKind(undefined, {
        scorerSide: "rival",
      })
    ).toBe("opponent_own_goal");
  });

  it("solo cuenta goles de plantel para estadisticas de jugadores", () => {
    expect(
      countsForPlayerGoalStats({
        scorerKind: "roster",
        player: { id: "player-1" },
      })
    ).toBe(true);
    expect(countsForPlayerGoalStats({ scorerKind: "guest" })).toBe(false);
    expect(
      countsForPlayerGoalStats({
        scorerKind: "opponent_own_goal",
      })
    ).toBe(false);
    expect(isGuestGoalEvent({ scorerKind: "guest" })).toBe(true);
    expect(isOpponentOwnGoalEvent({ scorerKind: "opponent_own_goal" })).toBe(
      true
    );
  });
});
