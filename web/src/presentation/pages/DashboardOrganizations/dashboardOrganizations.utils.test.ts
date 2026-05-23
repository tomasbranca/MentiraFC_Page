import { describe, expect, it } from "vitest";

import {
  buildDashboardOrganizationDraftInput,
  buildDashboardOrganizationMutationInput,
  getOrganizationColorLabel,
  getOrganizationReferenceCount,
  validateDashboardOrganizationImageDimensions,
  validateDashboardOrganizationImageFile,
  validateDashboardOrganizationInput,
} from "./dashboardOrganizations.utils";

describe("dashboardOrganizations utils", () => {
  it("valida el nombre y el color antes de publicar", () => {
    expect(
      validateDashboardOrganizationInput({
        name: "",
        primaryColor: "violet",
      })
    ).toEqual({
      name: "Escribi el nombre del organizador.",
      primaryColor: "Carga un color hexadecimal valido.",
    });
  });

  it("normaliza inputs de publicacion y borrador", () => {
    expect(
      buildDashboardOrganizationMutationInput({
        name: " Liga Amateur ",
        primaryColor: "#7C3AED",
      })
    ).toEqual({
      name: "Liga Amateur",
      primaryColor: "#7c3aed",
    });

    expect(
      buildDashboardOrganizationDraftInput({
        name: " ",
        primaryColor: "",
      })
    ).toEqual({
      name: "",
      primaryColor: undefined,
    });
  });

  it("calcula etiquetas, usos y restricciones de logo", () => {
    expect(getOrganizationColorLabel(null)).toBe("Sin color");
    expect(getOrganizationReferenceCount({ tournaments: 3 })).toBe(3);
    expect(validateDashboardOrganizationImageFile({ type: "image/gif", size: 100 })).toBe(
      "El logo debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardOrganizationImageDimensions({
        width: 16000,
        height: 16001,
      })
    ).toBe("El logo supera el limite de 256 megapixeles de Sanity.");
  });
});
