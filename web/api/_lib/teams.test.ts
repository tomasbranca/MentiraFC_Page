import { describe, expect, it } from "vitest";

import {
  dashboardTeamByIdQuery,
  dashboardTeamListQuery,
  dashboardTeamReferenceUsageQuery,
  getDashboardTeamsPageQuery,
  parseDashboardTeamDraftFormData,
  parseDashboardTeamDraftInput,
  parseDashboardTeamFormData,
  parseDashboardTeamInput,
  validateDashboardTeamImageFile,
} from "./teams.js";
import {
  DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES as DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_TEAM_IMAGE_MAX_BYTES as DASHBOARD_TEAM_IMAGE_MAX_BYTES_FOR_API,
} from "./teamImage.js";
import {
  DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES as DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_TEAM_IMAGE_MAX_BYTES as DASHBOARD_TEAM_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";

describe("dashboard teams api input", () => {
  it("acepta datos validos para publicar un club", () => {
    expect(
      parseDashboardTeamInput({
        name: "Rival FC",
        isMain: false,
      })
    ).toEqual({
      name: "Rival FC",
      isMain: false,
    });
  });

  it("parsea FormData con escudo", () => {
    const formData = new FormData();
    const file = new File(["image"], "rival.webp", { type: "image/webp" });

    formData.set("name", "Rival FC");
    formData.set("isMain", "true");
    formData.set("logoImage", file, file.name);

    expect(parseDashboardTeamFormData(formData)).toMatchObject({
      name: "Rival FC",
      isMain: true,
      logoImage: file,
    });
  });

  it("acepta borradores incompletos y escudo removido", () => {
    expect(
      parseDashboardTeamDraftInput({
        name: "",
      })
    ).toEqual({
      name: "",
      isMain: undefined,
    });

    const formData = new FormData();
    formData.set("removeLogo", "true");

    expect(parseDashboardTeamDraftFormData(formData)).toMatchObject({
      name: "",
      isMain: undefined,
      removeLogo: true,
    });
  });

  it("mantiene alineadas las restricciones de escudo entre API y dashboard", () => {
    expect(DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_TEAM_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_TEAM_IMAGE_MAX_BYTES_FOR_UI
    );
    expect(
      validateDashboardTeamImageFile(
        new File(["image"], "logo.gif", { type: "image/gif" })
      )
    ).toBe("El escudo debe ser JPG, PNG o WebP.");
  });

  it("consulta publicados, borradores y usos por referencias deportivas", () => {
    expect(dashboardTeamListQuery).toContain('*[_type == "teams"]');
    expect(dashboardTeamByIdQuery).toContain("_id == $draftId");
    expect(dashboardTeamReferenceUsageQuery).toContain("rival._ref == $id");
    expect(dashboardTeamReferenceUsageQuery).toContain(
      "participants[team._ref == $id"
    );
    expect(dashboardTeamReferenceUsageQuery).toContain("rows[team._ref == $id");
  });

  it("consulta paginas de clubes con filtros whitelisteados y resumen liviano", () => {
    const pageQuery = getDashboardTeamsPageQuery("name", "asc");

    expect(pageQuery).toContain("$offset...$end");
    expect(pageQuery).toContain("$hasSearch");
    expect(pageQuery).toContain("$hasStatus");
    expect(pageQuery).toContain("$hasKind");
    expect(pageQuery).toContain("$hasUsage");
    expect(pageQuery).toContain('"logoUrl": logo.asset->url');
    expect(pageQuery).toContain('"referenceCounts"');
    expect(pageQuery).not.toContain("logo,");
  });
});
