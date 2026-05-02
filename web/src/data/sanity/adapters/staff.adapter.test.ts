import { describe, expect, it } from "vitest";

import { adaptStaffMember } from "./staff.adapter";

const createSanityStaffMember = (overrides: Record<string, unknown> = {}) => ({
  _id: "staff-1",
  name: "Juan",
  lastName: "Perez",
  role: "Director tecnico",
  ...overrides,
});

describe("staff.adapter", () => {
  it("adapta un integrante del staff con rol y slug canonico", () => {
    expect(
      adaptStaffMember(
        createSanityStaffMember({ slug: { current: "juan-perez" } })
      )
    ).toMatchObject({
      id: "staff-1",
      fullName: "Juan Perez",
      role: "Director tecnico",
      slug: "juan-perez",
    });
  });

  it("normaliza slugs vacios como ausentes", () => {
    expect(
      adaptStaffMember(createSanityStaffMember({ slug: { current: "   " } }))
    ).toMatchObject({
      id: "staff-1",
      slug: undefined,
    });
  });

  it("rechaza integrantes sin rol para evitar cards incompletas", () => {
    expect(adaptStaffMember(createSanityStaffMember({ role: "   " }))).toBeNull();
  });
});
