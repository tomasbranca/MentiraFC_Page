import { describe, expect, it } from "vitest";

import {
  normalizeEmoji,
  normalizeReactionTarget,
} from "./reactions";

describe("reaction api helpers", () => {
  it("normaliza targets validos", () => {
    expect(
      normalizeReactionTarget({
        targetType: "news",
        targetId: "news-123",
      })
    ).toEqual({
      targetType: "news",
      targetId: "news-123",
    });
  });

  it("rechaza targets desconocidos o drafts", () => {
    expect(
      normalizeReactionTarget({
        targetType: "staff",
        targetId: "staff-123",
      })
    ).toBeNull();
    expect(
      normalizeReactionTarget({
        targetType: "news",
        targetId: "drafts.news-123",
      })
    ).toBeNull();
  });

  it("acepta un unico emoji valido", () => {
    expect(normalizeEmoji("💜")).toBe("💜");
    expect(normalizeEmoji("🏳️‍🌈")).toBe("🏳️‍🌈");
  });

  it("rechaza texto, multiples emojis o strings vacios", () => {
    expect(normalizeEmoji("vamos")).toBeNull();
    expect(normalizeEmoji("💜🔥")).toBeNull();
    expect(normalizeEmoji("")).toBeNull();
  });
});
