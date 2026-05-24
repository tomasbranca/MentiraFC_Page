import type { AppRole } from "../../types/auth";

const DASHBOARD_RESOURCE_PERMISSION_LIST = [
  "view_dashboard_news",
  "create_dashboard_news",
  "edit_dashboard_news",
  "delete_dashboard_news",
  "view_dashboard_matches",
  "create_dashboard_matches",
  "edit_dashboard_matches",
  "delete_dashboard_matches",
  "view_dashboard_table",
  "create_dashboard_table",
  "edit_dashboard_table",
  "delete_dashboard_table",
  "view_dashboard_tournaments",
  "create_dashboard_tournaments",
  "edit_dashboard_tournaments",
  "delete_dashboard_tournaments",
  "view_dashboard_organizations",
  "create_dashboard_organizations",
  "edit_dashboard_organizations",
  "delete_dashboard_organizations",
  "view_dashboard_teams",
  "create_dashboard_teams",
  "edit_dashboard_teams",
  "delete_dashboard_teams",
  "view_dashboard_players",
  "create_dashboard_players",
  "edit_dashboard_players",
  "delete_dashboard_players",
  "update_dashboard_player_active_status",
  "view_dashboard_staff",
  "create_dashboard_staff",
  "edit_dashboard_staff",
  "delete_dashboard_staff",
] as const;

export type DashboardResourcePermission =
  (typeof DASHBOARD_RESOURCE_PERMISSION_LIST)[number];

export type AppPermission =
  | "comment_news"
  | "participate_public_votes"
  | "view_private_posts"
  | "participate_private_votes"
  | "manage_news"
  | "manage_matches"
  | "manage_tables"
  | "manage_team_members"
  | "manage_events"
  | "delete_others_comments"
  | "ban_users"
  | "assign_team_member_or_editor_roles"
  | "manage_all_roles"
  | "view_dashboard"
  | "view_admin_panel"
  | DashboardResourcePermission;

export type DashboardPermissionResource =
  | "news"
  | "matches"
  | "table"
  | "tournaments"
  | "organizations"
  | "teams"
  | "players"
  | "staff";

type DashboardResourcePermissionSet = {
  view: DashboardResourcePermission;
  create: DashboardResourcePermission;
  edit: DashboardResourcePermission;
  delete: DashboardResourcePermission;
  updateActiveStatus?: DashboardResourcePermission;
};

export const DASHBOARD_RESOURCE_PERMISSIONS = {
  news: {
    view: "view_dashboard_news",
    create: "create_dashboard_news",
    edit: "edit_dashboard_news",
    delete: "delete_dashboard_news",
  },
  matches: {
    view: "view_dashboard_matches",
    create: "create_dashboard_matches",
    edit: "edit_dashboard_matches",
    delete: "delete_dashboard_matches",
  },
  table: {
    view: "view_dashboard_table",
    create: "create_dashboard_table",
    edit: "edit_dashboard_table",
    delete: "delete_dashboard_table",
  },
  tournaments: {
    view: "view_dashboard_tournaments",
    create: "create_dashboard_tournaments",
    edit: "edit_dashboard_tournaments",
    delete: "delete_dashboard_tournaments",
  },
  organizations: {
    view: "view_dashboard_organizations",
    create: "create_dashboard_organizations",
    edit: "edit_dashboard_organizations",
    delete: "delete_dashboard_organizations",
  },
  teams: {
    view: "view_dashboard_teams",
    create: "create_dashboard_teams",
    edit: "edit_dashboard_teams",
    delete: "delete_dashboard_teams",
  },
  players: {
    view: "view_dashboard_players",
    create: "create_dashboard_players",
    edit: "edit_dashboard_players",
    delete: "delete_dashboard_players",
    updateActiveStatus: "update_dashboard_player_active_status",
  },
  staff: {
    view: "view_dashboard_staff",
    create: "create_dashboard_staff",
    edit: "edit_dashboard_staff",
    delete: "delete_dashboard_staff",
  },
} as const satisfies Record<
  DashboardPermissionResource,
  DashboardResourcePermissionSet
>;

const USER_PERMISSIONS = [
  "comment_news",
  "participate_public_votes",
] as const satisfies readonly AppPermission[];

const TEAM_MEMBER_PERMISSIONS = [
  ...USER_PERMISSIONS,
  "view_private_posts",
  "participate_private_votes",
] as const satisfies readonly AppPermission[];

const DASHBOARD_EDITOR_PERMISSIONS = [
  "view_dashboard",
  "view_dashboard_news",
  "create_dashboard_news",
  "edit_dashboard_news",
  "delete_dashboard_news",
  "view_dashboard_matches",
  "create_dashboard_matches",
  "edit_dashboard_matches",
  "delete_dashboard_matches",
  "view_dashboard_table",
  "create_dashboard_table",
  "edit_dashboard_table",
  "delete_dashboard_table",
  "view_dashboard_tournaments",
  "create_dashboard_tournaments",
  "edit_dashboard_tournaments",
  "delete_dashboard_tournaments",
  "view_dashboard_organizations",
  "create_dashboard_organizations",
  "edit_dashboard_organizations",
  "delete_dashboard_organizations",
  "view_dashboard_teams",
  "create_dashboard_teams",
  "edit_dashboard_teams",
  "delete_dashboard_teams",
  "view_dashboard_players",
  "create_dashboard_players",
  "edit_dashboard_players",
  "delete_dashboard_players",
  "update_dashboard_player_active_status",
  "view_dashboard_staff",
  "create_dashboard_staff",
  "edit_dashboard_staff",
  "delete_dashboard_staff",
] as const satisfies readonly AppPermission[];

const EDITOR_PERMISSIONS = [
  ...TEAM_MEMBER_PERMISSIONS,
  "manage_news",
  "manage_matches",
  "manage_tables",
  "manage_team_members",
  "manage_events",
  ...DASHBOARD_EDITOR_PERMISSIONS,
] as const satisfies readonly AppPermission[];

const MODERATOR_PERMISSIONS = [
  ...EDITOR_PERMISSIONS,
  "delete_others_comments",
  "ban_users",
  "assign_team_member_or_editor_roles",
] as const satisfies readonly AppPermission[];

const ADMIN_PERMISSIONS = [
  ...MODERATOR_PERMISSIONS,
  "manage_all_roles",
  "view_admin_panel",
] as const satisfies readonly AppPermission[];

export const ROLE_PERMISSIONS = {
  user: USER_PERMISSIONS,
  team_member: TEAM_MEMBER_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
} as const satisfies Record<AppRole, readonly AppPermission[]>;

export const hasPermission = (
  role: AppRole | null | undefined,
  permission: AppPermission
): boolean => {
  if (!role) {
    return false;
  }

  const rolePermissions = ROLE_PERMISSIONS[role] as
    | readonly AppPermission[]
    | undefined;

  return Boolean(rolePermissions?.includes(permission));
};

export const canAccessDashboard = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, "view_dashboard");

export const canAccessAdminPanel = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, "view_admin_panel");
