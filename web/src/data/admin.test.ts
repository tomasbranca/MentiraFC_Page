import { describe, expect, it } from "vitest";

import { buildAdminUsersPageApiPath } from "./admin";

describe("admin data client", () => {
  it("arma la URL paginada de usuarios sin crear otra Function", () => {
    expect(
      buildAdminUsersPageApiPath({
        page: 2,
        limit: 20,
        sortBy: "email",
        direction: "asc",
        search: "tomas",
        role: "admin",
        status: "active",
      })
    ).toBe(
      "/api/admin/users?page=2&limit=20&sortBy=email&direction=asc&search=tomas&role=admin&status=active"
    );
  });
});
