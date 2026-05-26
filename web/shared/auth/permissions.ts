export const APP_ROLES = [
  "user",
  "team_member",
  "editor",
  "moderator",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_HIERARCHY = {
  user: 0,
  team_member: 1,
  editor: 2,
  moderator: 3,
  admin: 4,
} as const satisfies Record<AppRole, number>;

export const STANDARD_ASSIGNABLE_ROLES = [
  "user",
  "team_member",
  "editor",
] as const satisfies readonly AppRole[];

export const HIGH_PRIVILEGE_ROLES = [
  "moderator",
  "admin",
] as const satisfies readonly AppRole[];

export type HighPrivilegeRole = (typeof HIGH_PRIVILEGE_ROLES)[number];

export const PERMISSIONS = {
  commentNews: "comment_news",
  participatePublicVotes: "participate_public_votes",
  viewPrivatePosts: "view_private_posts",
  participatePrivateVotes: "participate_private_votes",
  manageNews: "manage_news",
  manageMatches: "manage_matches",
  manageTables: "manage_tables",
  manageTeamMembers: "manage_team_members",
  manageEvents: "manage_events",
  deleteOthersComments: "delete_others_comments",
  banUsers: "ban_users",
  assignTeamMemberOrEditorRoles: "assign_team_member_or_editor_roles",
  manageAllRoles: "manage_all_roles",
  viewDashboard: "view_dashboard",
  viewAdminPanel: "view_admin_panel",
} as const;

export type CorePermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DASHBOARD_PERMISSION_RESOURCES = [
  "news",
  "matches",
  "table",
  "tournaments",
  "galleries",
  "organizations",
  "teams",
  "players",
  "staff",
] as const;

export type DashboardPermissionResource =
  (typeof DASHBOARD_PERMISSION_RESOURCES)[number];

export const DASHBOARD_PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
] as const;

export type DashboardPermissionAction =
  (typeof DASHBOARD_PERMISSION_ACTIONS)[number];

type ValueOf<T> = T[keyof T];

type DashboardPermissionName<
  Action extends DashboardPermissionAction,
  Resource extends DashboardPermissionResource,
> = `${Action}_dashboard_${Resource}`;

type DashboardCrudPermissionSet<Resource extends DashboardPermissionResource> = {
  [Action in DashboardPermissionAction]: DashboardPermissionName<
    Action,
    Resource
  >;
};

const createDashboardPermission = <
  Action extends DashboardPermissionAction,
  Resource extends DashboardPermissionResource,
>(
  action: Action,
  resource: Resource
): DashboardPermissionName<Action, Resource> =>
  `${action}_dashboard_${resource}` as DashboardPermissionName<
    Action,
    Resource
  >;

const createDashboardResourcePermissions = <
  Resource extends DashboardPermissionResource,
>(
  resource: Resource
): DashboardCrudPermissionSet<Resource> => ({
  view: createDashboardPermission("view", resource),
  create: createDashboardPermission("create", resource),
  edit: createDashboardPermission("edit", resource),
  delete: createDashboardPermission("delete", resource),
});

export const DASHBOARD_RESOURCE_PERMISSIONS = {
  news: createDashboardResourcePermissions("news"),
  matches: createDashboardResourcePermissions("matches"),
  table: createDashboardResourcePermissions("table"),
  tournaments: createDashboardResourcePermissions("tournaments"),
  galleries: createDashboardResourcePermissions("galleries"),
  organizations: createDashboardResourcePermissions("organizations"),
  teams: createDashboardResourcePermissions("teams"),
  players: {
    ...createDashboardResourcePermissions("players"),
    updateActiveStatus: "update_dashboard_player_active_status",
  },
  staff: createDashboardResourcePermissions("staff"),
} as const;

type DashboardResourcePermissionMap = typeof DASHBOARD_RESOURCE_PERMISSIONS;

export type DashboardResourcePermission = ValueOf<{
  [Resource in DashboardPermissionResource]: ValueOf<
    DashboardResourcePermissionMap[Resource]
  >;
}>;

export type DashboardResourcePermissionAction<
  Resource extends DashboardPermissionResource = DashboardPermissionResource,
> = Resource extends DashboardPermissionResource
  ? Extract<keyof DashboardResourcePermissionMap[Resource], string>
  : never;

export type AppPermission = CorePermission | DashboardResourcePermission;

export const getDashboardResourcePermission = <
  Resource extends DashboardPermissionResource,
  Action extends DashboardResourcePermissionAction<Resource>,
>(
  resource: Resource,
  action: Action
): DashboardResourcePermission =>
  DASHBOARD_RESOURCE_PERMISSIONS[resource][action] as DashboardResourcePermission;

const DASHBOARD_PERMISSION_ACTION_BY_METHOD = {
  GET: "view",
  POST: "create",
  PUT: "edit",
  DELETE: "delete",
} as const satisfies Record<string, DashboardPermissionAction>;

export const getDashboardRequestPermission = (
  resource: DashboardPermissionResource,
  method: string
): DashboardResourcePermission => {
  const normalizedMethod = method.toUpperCase();

  if (resource === "players" && normalizedMethod === "PATCH") {
    return DASHBOARD_RESOURCE_PERMISSIONS.players.updateActiveStatus;
  }

  const action =
    DASHBOARD_PERMISSION_ACTION_BY_METHOD[
      normalizedMethod as keyof typeof DASHBOARD_PERMISSION_ACTION_BY_METHOD
    ] ?? "view";

  return getDashboardResourcePermission(resource, action);
};

export const DASHBOARD_RESOURCE_PERMISSION_LIST =
  DASHBOARD_PERMISSION_RESOURCES.flatMap(
    (resource) =>
      Object.values(
        DASHBOARD_RESOURCE_PERMISSIONS[resource]
      ) as DashboardResourcePermission[]
  ) as readonly DashboardResourcePermission[];

export const APP_PERMISSIONS = [
  ...(Object.values(PERMISSIONS) as CorePermission[]),
  ...DASHBOARD_RESOURCE_PERMISSION_LIST,
] as readonly AppPermission[];

const USER_PERMISSIONS = [
  PERMISSIONS.commentNews,
  PERMISSIONS.participatePublicVotes,
] as const satisfies readonly AppPermission[];

const TEAM_MEMBER_PERMISSIONS = [
  ...USER_PERMISSIONS,
  PERMISSIONS.viewPrivatePosts,
  PERMISSIONS.participatePrivateVotes,
] as const satisfies readonly AppPermission[];

const DASHBOARD_EDITOR_PERMISSIONS = [
  PERMISSIONS.viewDashboard,
  ...DASHBOARD_RESOURCE_PERMISSION_LIST,
] as const satisfies readonly AppPermission[];

const EDITOR_PERMISSIONS = [
  ...TEAM_MEMBER_PERMISSIONS,
  PERMISSIONS.manageNews,
  PERMISSIONS.manageMatches,
  PERMISSIONS.manageTables,
  PERMISSIONS.manageTeamMembers,
  PERMISSIONS.manageEvents,
  ...DASHBOARD_EDITOR_PERMISSIONS,
] as const satisfies readonly AppPermission[];

const MODERATOR_PERMISSIONS = [
  ...EDITOR_PERMISSIONS,
  PERMISSIONS.deleteOthersComments,
  PERMISSIONS.banUsers,
  PERMISSIONS.assignTeamMemberOrEditorRoles,
] as const satisfies readonly AppPermission[];

const ADMIN_PERMISSIONS = [
  ...MODERATOR_PERMISSIONS,
  PERMISSIONS.manageAllRoles,
  PERMISSIONS.viewAdminPanel,
] as const satisfies readonly AppPermission[];

export const ROLE_PERMISSIONS = {
  user: USER_PERMISSIONS,
  team_member: TEAM_MEMBER_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
} as const satisfies Record<AppRole, readonly AppPermission[]>;

export const isAppRole = (role: unknown): role is AppRole =>
  typeof role === "string" && APP_ROLES.includes(role as AppRole);

export const getRoleRank = (role: AppRole): number => ROLE_HIERARCHY[role];

export const compareAppRoles = (leftRole: AppRole, rightRole: AppRole): number =>
  getRoleRank(leftRole) - getRoleRank(rightRole);

export const isRoleAtLeast = (
  role: AppRole,
  minimumRole: AppRole
): boolean => compareAppRoles(role, minimumRole) >= 0;

export const isHighPrivilegeRole = (
  role: AppRole
): role is HighPrivilegeRole =>
  HIGH_PRIVILEGE_ROLES.includes(role as HighPrivilegeRole);

export const getRolePermissions = (
  role: AppRole | null | undefined
): readonly AppPermission[] => (role ? ROLE_PERMISSIONS[role] : []);

export const hasPermission = (
  role: AppRole | null | undefined,
  permission: AppPermission
): boolean => getRolePermissions(role).includes(permission);

export const hasAnyPermission = (
  role: AppRole | null | undefined,
  permissions: readonly AppPermission[]
): boolean => permissions.some((permission) => hasPermission(role, permission));

export const hasEveryPermission = (
  role: AppRole | null | undefined,
  permissions: readonly AppPermission[]
): boolean => permissions.every((permission) => hasPermission(role, permission));

export const hasDashboardResourcePermission = <
  Resource extends DashboardPermissionResource,
  Action extends DashboardResourcePermissionAction<Resource>,
>(
  role: AppRole | null | undefined,
  resource: Resource,
  action: Action
): boolean =>
  hasPermission(role, getDashboardResourcePermission(resource, action));

export type RoleAssignmentContext = {
  actorRole: AppRole | null | undefined;
  actorUserId?: string | null | undefined;
  targetUserId?: string | null | undefined;
  targetCurrentRole?: AppRole | null | undefined;
  targetRole: AppRole;
};

export type AssignableRolesContext = Omit<RoleAssignmentContext, "targetRole">;

const isSameUser = (
  actorUserId: string | null | undefined,
  targetUserId: string | null | undefined
): boolean => Boolean(actorUserId && targetUserId && actorUserId === targetUserId);

export const isSelfRoleElevation = ({
  actorRole,
  actorUserId,
  targetUserId,
  targetCurrentRole,
  targetRole,
}: RoleAssignmentContext): boolean => {
  if (!actorRole || !isSameUser(actorUserId, targetUserId)) {
    return false;
  }

  return compareAppRoles(targetRole, targetCurrentRole ?? actorRole) > 0;
};

// UI guard for role controls. Server authorization and RLS still own enforcement.
export const canAssignAppRole = (
  context: RoleAssignmentContext
): boolean => {
  const { actorRole, targetRole } = context;

  if (!actorRole || isSelfRoleElevation(context)) {
    return false;
  }

  if (isHighPrivilegeRole(targetRole)) {
    return actorRole === "admin";
  }

  return hasAnyPermission(actorRole, [
    PERMISSIONS.assignTeamMemberOrEditorRoles,
    PERMISSIONS.manageAllRoles,
  ]);
};

export const getAssignableAppRoles = (
  context: AssignableRolesContext
): readonly AppRole[] =>
  APP_ROLES.filter((targetRole) =>
    canAssignAppRole({
      ...context,
      targetRole,
    })
  );

export type PermissionChecker = {
  can: (permission: AppPermission) => boolean;
  canAny: (permissions: readonly AppPermission[]) => boolean;
  canEvery: (permissions: readonly AppPermission[]) => boolean;
  canDashboard: <
    Resource extends DashboardPermissionResource,
    Action extends DashboardResourcePermissionAction<Resource>,
  >(
    resource: Resource,
    action: Action
  ) => boolean;
  canAssignRole: (context: Omit<RoleAssignmentContext, "actorRole">) => boolean;
  getAssignableRoles: (
    context?: Omit<AssignableRolesContext, "actorRole">
  ) => readonly AppRole[];
};

export const createPermissionChecker = (
  role: AppRole | null | undefined
): PermissionChecker => ({
  can: (permission) => hasPermission(role, permission),
  canAny: (permissions) => hasAnyPermission(role, permissions),
  canEvery: (permissions) => hasEveryPermission(role, permissions),
  canDashboard: (resource, action) =>
    hasDashboardResourcePermission(role, resource, action),
  canAssignRole: (context) =>
    canAssignAppRole({
      ...context,
      actorRole: role,
    }),
  getAssignableRoles: (context = {}) =>
    getAssignableAppRoles({
      ...context,
      actorRole: role,
    }),
});

export const canAccessDashboard = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, PERMISSIONS.viewDashboard);

export const canAccessAdminPanel = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, PERMISSIONS.viewAdminPanel);
