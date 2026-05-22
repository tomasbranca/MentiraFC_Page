import { describe, expect, it } from "vitest";

import {
  dashboardStaffByIdQuery,
  dashboardStaffListQuery,
  parseDashboardStaffDraftFormData,
  parseDashboardStaffDraftInput,
  parseDashboardStaffFormData,
  parseDashboardStaffInput,
  validateDashboardStaffImageFile,
} from "./staff.js";
import {
  DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES as DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_STAFF_IMAGE_MAX_BYTES as DASHBOARD_STAFF_IMAGE_MAX_BYTES_FOR_API,
} from "./staffImage.js";
import {
  DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES as DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_STAFF_IMAGE_MAX_BYTES as DASHBOARD_STAFF_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";
import { buildDashboardStaffSlug } from "./staff/repository.js";

describe("dashboard staff api input", () => {
  it("acepta datos validos para publicar un integrante", () => {
    expect(
      parseDashboardStaffInput({
        name: "Juan",
        lastName: "Perez",
        role: "Director tecnico",
        birthDate: "1980-04-12",
      })
    ).toEqual({
      name: "Juan",
      lastName: "Perez",
      role: "Director tecnico",
      birthDate: "1980-04-12",
    });
  });

  it("parsea FormData con foto y genera slug desde nombre completo", () => {
    const formData = new FormData();
    const file = new File(["image"], "staff.webp", { type: "image/webp" });

    formData.set("name", "Juan");
    formData.set("lastName", "Perez");
    formData.set("role", "Preparador fisico");
    formData.set("birthDate", "1985-02-08");
    formData.set("photoImage", file, file.name);

    expect(parseDashboardStaffFormData(formData)).toMatchObject({
      name: "Juan",
      lastName: "Perez",
      role: "Preparador fisico",
      photoImage: file,
    });
    expect(
      buildDashboardStaffSlug({
        id: "staff-1",
        name: "Juan",
        lastName: "Perez",
      })
    ).toBe("juan-perez");
  });

  it("acepta borradores incompletos y foto removida", () => {
    expect(
      parseDashboardStaffDraftInput({
        name: "",
        lastName: "",
        role: "",
      })
    ).toEqual({
      name: "",
      lastName: "",
      role: "",
      birthDate: undefined,
    });

    const formData = new FormData();
    formData.set("removePhoto", "true");

    expect(parseDashboardStaffDraftFormData(formData)).toMatchObject({
      name: "",
      lastName: "",
      role: "",
      removePhoto: true,
    });
  });

  it("mantiene alineadas las restricciones de foto entre API y dashboard", () => {
    expect(DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_STAFF_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_STAFF_IMAGE_MAX_BYTES_FOR_UI
    );
    expect(
      validateDashboardStaffImageFile(
        new File(["image"], "staff.gif", { type: "image/gif" })
      )
    ).toBe("La foto debe ser JPG, PNG o WebP.");
  });

  it("consulta publicados y borradores de staff", () => {
    expect(dashboardStaffListQuery).toContain('*[_type == "staff"]');
    expect(dashboardStaffByIdQuery).toContain("_id == $draftId");
  });
});
