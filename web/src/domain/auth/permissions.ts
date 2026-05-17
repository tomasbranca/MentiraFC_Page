import type { AppRole } from "../../types/auth";

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
  | "view_admin_panel";

const USER_PERMISSIONS = [
  "comment_news",
  "participate_public_votes",
] as const satisfies readonly AppPermission[];

const TEAM_MEMBER_PERMISSIONS = [
  ...USER_PERMISSIONS,
  "view_private_posts",
  "participate_private_votes",
] as const satisfies readonly AppPermission[];

const EDITOR_PERMISSIONS = [
  ...TEAM_MEMBER_PERMISSIONS,
  "manage_news",
  "manage_matches",
  "manage_tables",
  "manage_team_members",
  "manage_events",
  "view_dashboard",
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

  return (ROLE_PERMISSIONS[role] as readonly AppPermission[]).includes(
    permission
  );
};

export const canAccessDashboard = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, "view_dashboard");

export const canAccessAdminPanel = (
  role: AppRole | null | undefined
): boolean => hasPermission(role, "view_admin_panel");
