import { describe, expect, it } from "vitest";

import { getProfileInitials } from "./profile.utils";

describe("getProfileInitials", () => {
  it("combina iniciales de nombre y apellido", () => {
    expect(getProfileInitials("Tomas", "Perez")).toBe("TP");
  });

  it("usa fallback cuando no hay letras", () => {
    expect(getProfileInitials(" ", " ")).toBe("?");
    expect(getProfileInitials("", "", "MC")).toBe("MC");
  });
});
