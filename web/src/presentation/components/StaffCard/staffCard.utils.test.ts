import { describe, expect, it } from "vitest";

import type { StaffMember } from "../../../types/models";
import { getStaffLink } from "./staffCard.utils";

const createStaffMember = (
  overrides: Partial<StaffMember> = {}
): StaffMember => ({
  id: "staff-1",
  name: "Juan",
  lastName: "Perez",
  fullName: "Juan Perez",
  role: "Director tecnico",
  ...overrides,
});

describe("staffCard.utils", () => {
  it("usa el slug como ruta canonica cuando existe", () => {
    expect(getStaffLink(createStaffMember({ slug: "juan-perez" }))).toBe(
      "/plantel/staff/juan-perez"
    );
  });

  it("usa el id como fallback cuando el staff no tiene slug", () => {
    expect(getStaffLink(createStaffMember({ slug: undefined }))).toBe(
      "/plantel/staff/staff-1"
    );
  });

  it("usa el id como fallback cuando el slug esta vacio", () => {
    expect(getStaffLink(createStaffMember({ slug: "   " }))).toBe(
      "/plantel/staff/staff-1"
    );
  });
});
