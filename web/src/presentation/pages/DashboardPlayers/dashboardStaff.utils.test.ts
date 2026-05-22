import { describe, expect, it } from "vitest";

import {
  buildDashboardStaffDraftInput,
  buildDashboardStaffMutationInput,
  validateDashboardStaffImageDimensions,
  validateDashboardStaffImageFile,
  validateDashboardStaffInput,
} from "./dashboardStaff.utils";

const createValues = () => ({
  name: "Juan",
  lastName: "Perez",
  role: "Director tecnico",
  birthDate: "1980-04-12",
});

describe("dashboard staff utils", () => {
  it("valida campos obligatorios y normaliza datos publicables", () => {
    expect(
      validateDashboardStaffInput({
        ...createValues(),
        name: "",
        role: "",
      })
    ).toMatchObject({
      name: "Escribi el nombre.",
      role: "Escribi el rol.",
    });
    expect(buildDashboardStaffMutationInput(createValues())).toEqual({
      name: "Juan",
      lastName: "Perez",
      role: "Director tecnico",
      birthDate: "1980-04-12",
    });
  });

  it("mantiene borradores incompletos", () => {
    expect(
      buildDashboardStaffDraftInput({
        ...createValues(),
        role: "",
        birthDate: "",
      })
    ).toEqual({
      name: "Juan",
      lastName: "Perez",
      role: "",
      birthDate: undefined,
    });
  });

  it("valida fotos por formato, peso y dimensiones", () => {
    expect(validateDashboardStaffImageFile({ type: "image/gif", size: 100 })).toBe(
      "La foto debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardStaffImageFile({
        type: "image/webp",
        size: 5 * 1024 * 1024,
      })
    ).toBe("La foto no puede superar 4 MB en produccion.");
    expect(
      validateDashboardStaffImageDimensions({ width: 16000, height: 16001 })
    ).toBe("La foto supera el limite de 256 megapixeles de Sanity.");
  });
});
