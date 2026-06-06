import { describe, expect, it } from "vitest";

import {
  buildAdminAuditLogPageApiPath,
  buildAdminUsersPageApiPath,
} from "./admin";

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

  it("arma la URL paginada del audit log sin crear otra Function", () => {
    expect(
      buildAdminAuditLogPageApiPath({
        page: 3,
        limit: 20,
        sortBy: "resource",
        direction: "asc",
        search: "usuario",
        role: "admin",
        result: "success",
        resource: "users",
      })
    ).toBe(
      "/api/admin/audit-log?page=3&limit=20&sortBy=resource&direction=asc&search=usuario&role=admin&result=success&resource=users"
    );
  });
});
