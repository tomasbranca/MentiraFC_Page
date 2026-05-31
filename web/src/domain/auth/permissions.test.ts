import { describe, expect, it } from "vitest";

import {
  APP_PERMISSIONS,
  APP_ROLES,
  canAssignAppRole,
  canAccessAdminPanel,
  canAccessDashboard,
  compareAppRoles,
  createPermissionChecker,
  DASHBOARD_RESOURCE_PERMISSION_LIST,
  getAssignableAppRoles,
  getAdminResourcePermission,
  getDashboardRequestPermission,
  getDashboardResourcePermission,
  getRoleRank,
  hasDashboardResourcePermission,
  hasPermission,
  HIGH_PRIVILEGE_ROLES,
  isAppRole,
  isHighPrivilegeRole,
  isRoleAtLeast,
  isSelfRoleElevation,
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  STANDARD_ASSIGNABLE_ROLES,
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
  PERMISSIONS.manageAdminUsers,
  PERMISSIONS.manageAdminRoles,
  PERMISSIONS.manageFooterSettings,
  PERMISSIONS.manageModeration,
  PERMISSIONS.manageReports,
  PERMISSIONS.viewAuditLog,
  PERMISSIONS.viewMetrics,
  PERMISSIONS.manageFeatureFlags,
  PERMISSIONS.manageAuthControls,
  PERMISSIONS.manageMaintenance,
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

  it("mantiene permisos admin fuera de Sanity y solo en admin", () => {
    expect(getAdminResourcePermission("footer-settings")).toBe(
      PERMISSIONS.manageFooterSettings
    );
    expect(getAdminResourcePermission("feature-flags")).toBe(
      PERMISSIONS.manageFeatureFlags
    );
    expect(hasPermission("moderator", PERMISSIONS.manageFooterSettings)).toBe(
      false
    );
    expect(hasPermission("admin", PERMISSIONS.manageFooterSettings)).toBe(true);
    expect(hasPermission("admin", PERMISSIONS.manageMaintenance)).toBe(true);
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

  it("mantiene una jerarquia explicita para comparar roles", () => {
    expect(ROLE_HIERARCHY).toEqual({
      user: 0,
      team_member: 1,
      editor: 2,
      moderator: 3,
      admin: 4,
    });
    expect(APP_ROLES.map(getRoleRank)).toEqual([0, 1, 2, 3, 4]);
    expect(compareAppRoles("admin", "editor")).toBeGreaterThan(0);
    expect(compareAppRoles("user", "team_member")).toBeLessThan(0);
    expect(isRoleAtLeast("moderator", "moderator")).toBe(true);
    expect(isRoleAtLeast("editor", "moderator")).toBe(false);
    expect(STANDARD_ASSIGNABLE_ROLES).toEqual(["user", "team_member", "editor"]);
    expect(HIGH_PRIVILEGE_ROLES).toEqual(["moderator", "admin"]);
    expect(isHighPrivilegeRole("moderator")).toBe(true);
    expect(isHighPrivilegeRole("editor")).toBe(false);
  });

  it("permite que solo admin asigne roles altos desde la UI", () => {
    expect(
      canAssignAppRole({
        actorRole: "moderator",
        targetRole: "editor",
      })
    ).toBe(true);
    expect(
      canAssignAppRole({
        actorRole: "moderator",
        targetRole: "moderator",
      })
    ).toBe(false);
    expect(
      canAssignAppRole({
        actorRole: "moderator",
        targetRole: "admin",
      })
    ).toBe(false);
    expect(
      canAssignAppRole({
        actorRole: "admin",
        targetRole: "moderator",
      })
    ).toBe(true);
    expect(
      canAssignAppRole({
        actorRole: "admin",
        targetRole: "admin",
      })
    ).toBe(true);
  });

  it("expone los roles asignables para combos de administracion", () => {
    expect(getAssignableAppRoles({ actorRole: "editor" })).toEqual([]);
    expect(getAssignableAppRoles({ actorRole: "moderator" })).toEqual([
      "user",
      "team_member",
      "editor",
    ]);
    expect(getAssignableAppRoles({ actorRole: "admin" })).toEqual(APP_ROLES);
  });

  it("bloquea que cualquier usuario eleve su propio rol desde la UI", () => {
    const selfChange = {
      actorUserId: "6deef514-2b87-4bff-85df-a669860a9990",
      targetUserId: "6deef514-2b87-4bff-85df-a669860a9990",
    };

    expect(
      isSelfRoleElevation({
        ...selfChange,
        actorRole: "editor",
        targetCurrentRole: "editor",
        targetRole: "moderator",
      })
    ).toBe(true);
    expect(
      canAssignAppRole({
        ...selfChange,
        actorRole: "admin",
        targetCurrentRole: "moderator",
        targetRole: "admin",
      })
    ).toBe(false);
    expect(
      canAssignAppRole({
        ...selfChange,
        actorRole: "admin",
        targetCurrentRole: "admin",
        targetRole: "moderator",
      })
    ).toBe(true);
    expect(
      canAssignAppRole({
        ...selfChange,
        actorRole: "admin",
        targetCurrentRole: "admin",
        targetRole: "admin",
      })
    ).toBe(true);
  });

  it("incluye la regla de roles en el verificador reutilizable", () => {
    const moderatorChecker = createPermissionChecker("moderator");
    const adminChecker = createPermissionChecker("admin");

    expect(
      moderatorChecker.canAssignRole({
        targetRole: "admin",
      })
    ).toBe(false);
    expect(moderatorChecker.getAssignableRoles()).toEqual([
      "user",
      "team_member",
      "editor",
    ]);
    expect(
      adminChecker.canAssignRole({
        targetRole: "admin",
      })
    ).toBe(true);
  });
});
