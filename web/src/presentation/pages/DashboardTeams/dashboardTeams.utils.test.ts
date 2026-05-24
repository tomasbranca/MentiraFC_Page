import { describe, expect, it } from "vitest";

import {
  buildDashboardTeamDraftInput,
  buildDashboardTeamMutationInput,
  getTeamReferenceCount,
  getTeamUsageLabel,
  validateDashboardTeamImageDimensions,
  validateDashboardTeamImageFile,
  validateDashboardTeamInput,
} from "./dashboardTeams.utils";

describe("dashboardTeams utils", () => {
  it("valida el nombre antes de publicar", () => {
    expect(
      validateDashboardTeamInput({
        name: "",
        isMain: false,
      })
    ).toEqual({
      name: "Escribi el nombre del club.",
    });
  });

  it("normaliza inputs de publicacion y borrador", () => {
    expect(
      buildDashboardTeamMutationInput({
        name: " Rival FC ",
        isMain: false,
      })
    ).toEqual({
      name: "Rival FC",
      isMain: false,
    });

    expect(
      buildDashboardTeamDraftInput({
        name: " ",
        isMain: true,
      })
    ).toEqual({
      name: "",
      isMain: true,
    });
  });

  it("calcula usos y restricciones de escudo", () => {
    const referenceCounts = {
      matches: 2,
      tournaments: 1,
      tables: 1,
      snapshots: 0,
    };

    expect(getTeamReferenceCount(referenceCounts)).toBe(4);
    expect(getTeamUsageLabel(referenceCounts)).toBe(
      "2 partidos - 1 torneos - 1 tablas"
    );
    expect(validateDashboardTeamImageFile({ type: "image/gif", size: 100 })).toBe(
      "El escudo debe ser JPG, PNG o WebP."
    );
    expect(
      validateDashboardTeamImageDimensions({
        width: 16000,
        height: 16001,
      })
    ).toBe("El escudo supera el limite de 256 megapixeles de Sanity.");
  });
});
