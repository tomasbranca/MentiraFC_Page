import { describe, expect, it } from "vitest";

import {
  countMentiraGoalsRecorded,
  countRecordedGoalsFor,
  getFinishedMatchGoalsMismatchMessage,
} from "./matchGoals";

describe("matchGoals", () => {
  it("suma solo goles validos de goleadores", () => {
    expect(
      countRecordedGoalsFor([
        { goals: "2" },
        { goals: 1 },
        { goals: "0" },
        { goals: "x" },
      ])
    ).toBe(3);
  });

  it("suma plantel, invitados y goles en propia del rival", () => {
    expect(countMentiraGoalsRecorded([{ goals: 2 }], [{ goals: 1 }], 1)).toBe(4);
  });

  it("exige que los goles cargados coincidan con el resultado", () => {
    expect(getFinishedMatchGoalsMismatchMessage(2, [{ goals: 2 }], [], 0)).toBeNull();
    expect(getFinishedMatchGoalsMismatchMessage(3, [{ goals: 2 }], [], 1)).toBeNull();
    expect(getFinishedMatchGoalsMismatchMessage(2, [{ goals: 1 }], [], 0)).toContain(
      "2 goles"
    );
  });
});
