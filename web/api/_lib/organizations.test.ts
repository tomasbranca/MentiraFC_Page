import { describe, expect, it } from "vitest";

import {
  buildDashboardOrganizationColorValue,
  dashboardOrganizationByIdQuery,
  dashboardOrganizationListQuery,
  dashboardOrganizationReferenceUsageQuery,
  parseDashboardOrganizationDraftFormData,
  parseDashboardOrganizationDraftInput,
  parseDashboardOrganizationFormData,
  parseDashboardOrganizationInput,
  validateDashboardOrganizationImageFile,
} from "./organizations.js";
import {
  DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES as DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES as DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES_FOR_API,
} from "./organizationImage.js";
import {
  DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES as DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES as DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";

describe("dashboard organizations api input", () => {
  it("acepta datos validos para publicar un organizador", () => {
    expect(
      parseDashboardOrganizationInput({
        name: "Liga Amateur",
        primaryColor: "#7C3AED",
      })
    ).toEqual({
      name: "Liga Amateur",
      primaryColor: "#7c3aed",
    });
  });

  it("parsea FormData con logo", () => {
    const formData = new FormData();
    const file = new File(["image"], "liga.webp", { type: "image/webp" });

    formData.set("name", "Liga Amateur");
    formData.set("primaryColor", "#7c3aed");
    formData.set("logoImage", file, file.name);

    expect(parseDashboardOrganizationFormData(formData)).toMatchObject({
      name: "Liga Amateur",
      primaryColor: "#7c3aed",
      logoImage: file,
    });
  });

  it("acepta borradores incompletos y logo removido", () => {
    expect(
      parseDashboardOrganizationDraftInput({
        name: "",
        primaryColor: "",
      })
    ).toEqual({
      name: "",
      primaryColor: undefined,
    });

    const formData = new FormData();
    formData.set("removeLogo", "true");

    expect(parseDashboardOrganizationDraftFormData(formData)).toMatchObject({
      name: "",
      primaryColor: undefined,
      removeLogo: true,
    });
  });

  it("construye un valor compatible con el color input de Sanity", () => {
    expect(buildDashboardOrganizationColorValue("#7C3AED")).toMatchObject({
      _type: "color",
      hex: "#7c3aed",
      alpha: 1,
      hsl: {
        _type: "hslaColor",
        a: 1,
      },
      hsv: {
        _type: "hsvaColor",
        a: 1,
      },
      rgb: {
        _type: "rgbaColor",
        r: 124,
        g: 58,
        b: 237,
        a: 1,
      },
    });
  });

  it("mantiene alineadas las restricciones de logo entre API y dashboard", () => {
    expect(DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES_FOR_UI
    );
    expect(
      validateDashboardOrganizationImageFile(
        new File(["image"], "logo.gif", { type: "image/gif" })
      )
    ).toBe("El logo debe ser JPG, PNG o WebP.");
  });

  it("consulta publicados, borradores y usos por torneos", () => {
    expect(dashboardOrganizationListQuery).toContain(
      '*[_type == "organizations"]'
    );
    expect(dashboardOrganizationByIdQuery).toContain("_id == $draftId");
    expect(dashboardOrganizationReferenceUsageQuery).toContain(
      "organization._ref == $id"
    );
  });
});
