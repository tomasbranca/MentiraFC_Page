import { describe, expect, it } from "vitest";

import { adaptCurrentAccountRow } from "./account";

describe("account data", () => {
  it("adapta la fila de mi cuenta a camelCase", () => {
    expect(
      adaptCurrentAccountRow({
        id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
        first_name: "Tomas",
        last_name: "Brancatisano",
        role: "editor",
        is_active: true,
      })
    ).toEqual({
      id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
      firstName: "Tomas",
      lastName: "Brancatisano",
      role: "editor",
      isActive: true,
    });
  });

  it("rechaza payloads invalidos de mi cuenta", () => {
    expect(
      adaptCurrentAccountRow({
        id: "not-a-uuid",
        first_name: "",
        last_name: "Brancatisano",
        role: "owner",
        is_active: "true",
      })
    ).toBeNull();
  });
});
