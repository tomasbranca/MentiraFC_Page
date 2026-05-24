import { describe, expect, it } from "vitest";

import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  getAccountStatusLabel,
  getAvailableAccountActionIds,
  validateAccountProfile,
} from "./account.utils";

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
    expect(ROLE_DESCRIPTIONS.editor).toContain("gestionar contenido");
  });

  it("expone el estado legible de la cuenta", () => {
    expect(getAccountStatusLabel(true)).toBe("Activa");
    expect(getAccountStatusLabel(false)).toBe("Suspendida");
  });

  it("deriva acciones disponibles segun el rol", () => {
    expect(getAvailableAccountActionIds("user")).toEqual(["sign_out"]);
    expect(getAvailableAccountActionIds("editor")).toEqual([
      "open_dashboard",
      "sign_out",
    ]);
  });
});
