import { describe, expect, it } from "vitest";

import {
  canAccessAdminPanel,
  canAccessDashboard,
  DASHBOARD_RESOURCE_PERMISSIONS,
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

  it("expone permisos especificos por ruta y accion del dashboard", () => {
    expect(hasPermission("editor", DASHBOARD_RESOURCE_PERMISSIONS.news.view)).toBe(
      true
    );
    expect(
      hasPermission("editor", DASHBOARD_RESOURCE_PERMISSIONS.news.create)
    ).toBe(true);
    expect(
      hasPermission("editor", DASHBOARD_RESOURCE_PERMISSIONS.news.edit)
    ).toBe(true);
    expect(
      hasPermission("editor", DASHBOARD_RESOURCE_PERMISSIONS.news.delete)
    ).toBe(true);
    expect(
      hasPermission(
        "editor",
        DASHBOARD_RESOURCE_PERMISSIONS.players.updateActiveStatus
      )
    ).toBe(true);
  });

  it("no habilita acciones de dashboard por estar logueado sin permisos", () => {
    expect(hasPermission("team_member", "view_dashboard")).toBe(false);
    expect(
      hasPermission("team_member", DASHBOARD_RESOURCE_PERMISSIONS.news.view)
    ).toBe(false);
    expect(
      hasPermission("team_member", DASHBOARD_RESOURCE_PERMISSIONS.news.delete)
    ).toBe(false);
  });

  it("niega permisos cuando no hay rol", () => {
    expect(hasPermission(null, "view_dashboard")).toBe(false);
  });
});
