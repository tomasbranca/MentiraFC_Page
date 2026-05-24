import { describe, expect, it } from "vitest";

import {
  APP_PERMISSIONS,
  APP_ROLES,
  canAccessAdminPanel,
  canAccessDashboard,
  createPermissionChecker,
  DASHBOARD_RESOURCE_PERMISSION_LIST,
  getDashboardRequestPermission,
  getDashboardResourcePermission,
  hasDashboardResourcePermission,
  hasPermission,
  isAppRole,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type AppPermission,
  type AppRole,
} from "./permissions";

const USER_EXPECTED_PERMISSIONS = [
  PERMISSIONS.commentNews,
  PERMISSIONS.participatePublicVotes,
] as const satisfies readonly AppPermission[];

const TEAM_MEMBER_EXPECTED_PERMISSIONS = [
  ...USER_EXPECTED_PERMISSIONS,
  PERMISSIONS.viewPrivatePosts,
  PERMISSIONS.participatePrivateVotes,
] as const satisfies readonly AppPermission[];

const EDITOR_EXPECTED_PERMISSIONS = [
  ...TEAM_MEMBER_EXPECTED_PERMISSIONS,
  PERMISSIONS.manageNews,
  PERMISSIONS.manageMatches,
  PERMISSIONS.manageTables,
  PERMISSIONS.manageTeamMembers,
  PERMISSIONS.manageEvents,
  PERMISSIONS.viewDashboard,
  ...DASHBOARD_RESOURCE_PERMISSION_LIST,
] as const satisfies readonly AppPermission[];

const MODERATOR_EXPECTED_PERMISSIONS = [
  ...EDITOR_EXPECTED_PERMISSIONS,
  PERMISSIONS.deleteOthersComments,
  PERMISSIONS.banUsers,
  PERMISSIONS.assignTeamMemberOrEditorRoles,
] as const satisfies readonly AppPermission[];

const ADMIN_EXPECTED_PERMISSIONS = [
  ...MODERATOR_EXPECTED_PERMISSIONS,
  PERMISSIONS.manageAllRoles,
  PERMISSIONS.viewAdminPanel,
] as const satisfies readonly AppPermission[];

const EXPECTED_ROLE_PERMISSIONS = {
  user: USER_EXPECTED_PERMISSIONS,
  team_member: TEAM_MEMBER_EXPECTED_PERMISSIONS,
  editor: EDITOR_EXPECTED_PERMISSIONS,
  moderator: MODERATOR_EXPECTED_PERMISSIONS,
  admin: ADMIN_EXPECTED_PERMISSIONS,
} as const satisfies Record<AppRole, readonly AppPermission[]>;

describe("auth permissions", () => {
  it("mantiene una lista unica de permisos sin duplicados", () => {
    expect(new Set(APP_PERMISSIONS).size).toBe(APP_PERMISSIONS.length);
    expect(APP_PERMISSIONS).toContain(PERMISSIONS.viewDashboard);
    expect(APP_PERMISSIONS).toContain(
      getDashboardResourcePermission("players", "updateActiveStatus")
    );
  });

  it.each(APP_ROLES)("define la matriz exacta para %s", (role) => {
    expect(ROLE_PERMISSIONS[role]).toEqual(EXPECTED_ROLE_PERMISSIONS[role]);
  });

  it.each(APP_ROLES)(
    "evalua todos los permisos registrados para %s",
    (role) => {
      const expectedPermissions: readonly AppPermission[] =
        EXPECTED_ROLE_PERMISSIONS[role];

      for (const permission of APP_PERMISSIONS) {
        expect(hasPermission(role, permission)).toBe(
          expectedPermissions.includes(permission)
        );
      }
    }
  );

  it("separa dashboard y panel admin por rol", () => {
    expect(canAccessDashboard("user")).toBe(false);
    expect(canAccessDashboard("team_member")).toBe(false);
    expect(canAccessDashboard("editor")).toBe(true);
    expect(canAccessDashboard("moderator")).toBe(true);
    expect(canAccessDashboard("admin")).toBe(true);

    expect(canAccessAdminPanel("moderator")).toBe(false);
    expect(canAccessAdminPanel("admin")).toBe(true);
  });

  it("resuelve permisos de dashboard por recurso, accion y metodo HTTP", () => {
    expect(hasDashboardResourcePermission("editor", "news", "delete")).toBe(
      true
    );
    expect(
      hasDashboardResourcePermission("team_member", "news", "delete")
    ).toBe(false);
    expect(getDashboardRequestPermission("news", "POST")).toBe(
      getDashboardResourcePermission("news", "create")
    );
    expect(getDashboardRequestPermission("players", "PATCH")).toBe(
      getDashboardResourcePermission("players", "updateActiveStatus")
    );
    expect(getDashboardRequestPermission("matches", "OPTIONS")).toBe(
      getDashboardResourcePermission("matches", "view")
    );
  });

  it("crea verificadores reutilizables para componentes y acciones", () => {
    const editorChecker = createPermissionChecker("editor");
    const guestChecker = createPermissionChecker(null);

    expect(editorChecker.can(PERMISSIONS.viewDashboard)).toBe(true);
    expect(editorChecker.canDashboard("players", "updateActiveStatus")).toBe(
      true
    );
    expect(
      editorChecker.canAny([
        PERMISSIONS.viewAdminPanel,
        getDashboardResourcePermission("news", "edit"),
      ])
    ).toBe(true);
    expect(
      editorChecker.canEvery([
        PERMISSIONS.viewDashboard,
        getDashboardResourcePermission("news", "edit"),
      ])
    ).toBe(true);
    expect(guestChecker.can(PERMISSIONS.viewDashboard)).toBe(false);
  });

  it("valida roles conocidos y niega permisos cuando no hay rol", () => {
    expect(isAppRole("editor")).toBe(true);
    expect(isAppRole("owner")).toBe(false);
    expect(hasPermission(null, PERMISSIONS.viewDashboard)).toBe(false);
  });
});
