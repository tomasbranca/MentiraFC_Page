import { describe, expect, it } from "vitest";

import {
  canAccessAdminPanel,
  canAccessDashboard,
  hasPermission,
} from "./permissions";

describe("auth permissions", () => {
  it("hereda permisos de los roles inferiores", () => {
    expect(hasPermission("team_member", "comment_news")).toBe(true);
    expect(hasPermission("editor", "view_private_posts")).toBe(true);
    expect(hasPermission("moderator", "manage_events")).toBe(true);
    expect(hasPermission("admin", "ban_users")).toBe(true);
  });

  it("separa dashboard y panel admin por rol", () => {
    expect(canAccessDashboard("user")).toBe(false);
    expect(canAccessDashboard("team_member")).toBe(false);
    expect(canAccessDashboard("editor")).toBe(true);
    expect(canAccessDashboard("moderator")).toBe(true);
    expect(canAccessDashboard("admin")).toBe(true);

    expect(canAccessAdminPanel("moderator")).toBe(false);
    expect(canAccessAdminPanel("admin")).toBe(true);
  });

  it("niega permisos cuando no hay rol", () => {
    expect(hasPermission(null, "view_dashboard")).toBe(false);
  });
});
