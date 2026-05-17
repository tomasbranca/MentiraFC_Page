import { describe, expect, it } from "vitest";

import { ROLE_LABELS, validateAccountProfile } from "./account.utils";

describe("account utils", () => {
  it("valida nombre y apellido obligatorios", () => {
    expect(
      validateAccountProfile({
        firstName: " ",
        lastName: "",
      })
    ).toEqual({
      firstName: "Ingresá tu nombre.",
      lastName: "Ingresá tu apellido.",
    });
  });

  it("expone etiquetas legibles para los roles", () => {
    expect(ROLE_LABELS.team_member).toBe("Integrante del equipo");
    expect(ROLE_LABELS.admin).toBe("Administrador");
  });
});
