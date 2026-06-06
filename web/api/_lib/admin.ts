import type { SupabaseClient } from "@supabase/supabase-js";

import {
  APP_PERMISSIONS,
  APP_ROLES,
  canAssignAppRole,
  ROLE_PERMISSIONS,
  isAppRole,
  type AppPermission,
  type AppRole,
} from "../../shared/auth/permissions.js";
import type {
  OffsetPaginationParams,
  PaginatedResult,
  SortDirection,
} from "../../shared/pagination.js";
import { createAdminSupabaseClient } from "./supabase.js";

type AuthorizedAdminUser = {
  userId: string;
  role: AppRole;
};

export type AdminUser = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: AppRole;
  isActive: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export const ADMIN_USERS_PAGE_SORT_BY = [
  "createdAt",
  "email",
  "lastSignInAt",
  "role",
] as const;

export type AdminUsersPageSortBy = (typeof ADMIN_USERS_PAGE_SORT_BY)[number];

export const ADMIN_USERS_PAGE_STATUS_FILTERS = ["active", "inactive"] as const;

export type AdminUsersPageStatusFilter =
  (typeof ADMIN_USERS_PAGE_STATUS_FILTERS)[number];

export type AdminUsersPageFilters = {
  role?: AppRole | null;
  status?: AdminUsersPageStatusFilter | null;
};

export type AdminAuditLogItem = {
  id: string;
  actorUserId: string;
  actorRole: AppRole;
  action: string;
  resource: string;
  targetId: string | null;
  changes: Record<string, unknown> | null;
  result: string;
  createdAt: string;
};

export const ADMIN_AUDIT_LOG_PAGE_SORT_BY = [
  "createdAt",
  "resource",
  "action",
  "actorRole",
  "result",
] as const;

export type AdminAuditLogPageSortBy =
  (typeof ADMIN_AUDIT_LOG_PAGE_SORT_BY)[number];

export const ADMIN_AUDIT_LOG_RESULT_FILTERS = ["success", "failure"] as const;

export type AdminAuditLogResultFilter =
  (typeof ADMIN_AUDIT_LOG_RESULT_FILTERS)[number];

export type AdminAuditLogPageFilters = {
  role?: AppRole | null;
  result?: AdminAuditLogResultFilter | null;
  resource?: string | null;
};

export type AdminFeatureFlag = {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  updatedAt: string | null;
};

export type AdminMaintenanceSettings = {
  enabled: boolean;
  message: string;
  updatedAt: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type UserAccountRow = {
  user_id: string;
  role: string | null;
  is_active: boolean | null;
};

type AuditLogInput = {
  actor: AuthorizedAdminUser;
  action: string;
  resource: string;
  targetId?: string | null;
  changes?: Record<string, unknown> | null;
  result?: "success" | "failure";
};

type RolePermissionOverrideRow = {
  role: string;
  permissions: string[] | null;
  updated_at: string | null;
};

type FeatureFlagRow = {
  key: string;
  label: string | null;
  description: string | null;
  enabled: boolean | null;
  updated_at: string | null;
};

type RuntimeSettingsRow = {
  maintenance_enabled: boolean | null;
  maintenance_message: string | null;
  updated_at: string | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

export const createSupabaseAdminClient = createAdminSupabaseClient;

const ADMIN_RPC_FUNCTIONS = [
  "admin_get_audit_log",
  "admin_get_maintenance_settings",
  "admin_get_metrics",
  "admin_get_role_permission_overrides",
  "admin_get_user_account",
  "admin_get_user_profiles_and_accounts",
  "admin_list_feature_flags",
  "admin_record_audit_log",
  "admin_save_feature_flag",
  "admin_save_maintenance_settings",
  "admin_save_role_permission_override",
  "admin_update_user",
] as const;

type AdminRpcFunctionName = (typeof ADMIN_RPC_FUNCTIONS)[number];

const trimText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const callAdminRpc = async <T>(
  supabase: SupabaseClient,
  functionName: AdminRpcFunctionName,
  args?: Record<string, unknown>
): Promise<T> => {
  const { data, error } = await supabase.rpc(functionName, args);

  if (error) throw error;

  return data as T;
};

const getSingleRpcRow = <T>(rows: T[]): T | null => rows[0] ?? null;

const ADMIN_USERS_PROVIDER_PAGE_SIZE = 50;
const ADMIN_USERS_FILTER_SCAN_LIMIT = 500;
const ADMIN_AUDIT_LOG_LEGACY_LIMIT = 100;
const ADMIN_AUDIT_LOG_SCAN_LIMIT = 500;

export const recordAuditLog = async (
  supabase: SupabaseClient,
  input: AuditLogInput
): Promise<void> => {
  await callAdminRpc<null>(supabase, "admin_record_audit_log", {
    p_actor_user_id: input.actor.userId,
    p_actor_role: input.actor.role,
    p_action: input.action,
    p_resource: input.resource,
    p_target_id: input.targetId ?? null,
    p_changes: input.changes ?? null,
    p_result: input.result ?? "success",
  });
};

const fetchProfilesAndAccountsByIds = async (
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, ProfileRow>> => {
  if (ids.length === 0) return new Map();

  const data = await callAdminRpc<ProfileRow[]>(
    supabase,
    "admin_get_user_profiles_and_accounts",
    {
      p_user_ids: ids,
    }
  );

  return new Map(data.map((row) => [row.id, row]));
};

const mapAuthUsersToAdminUsers = async (
  supabase: SupabaseClient,
  users: SupabaseAuthUser[]
): Promise<AdminUser[]> => {
  const ids = users.map((user) => user.id);
  const profiles = await fetchProfilesAndAccountsByIds(supabase, ids);

  return users.map((user) => {
    const profile = profiles.get(user.id);
    const role = isAppRole(profile?.role) ? profile.role : "user";

    return {
      id: user.id,
      email: user.email ?? null,
      firstName: trimText(profile?.first_name) || "Usuario",
      lastName: trimText(profile?.last_name),
      role,
      isActive: profile?.is_active !== false,
      createdAt: user.created_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  });
};

const listAuthUsersPage = async (
  supabase: SupabaseClient,
  {
    page,
    perPage,
  }: {
    page: number;
    perPage: number;
  }
): Promise<SupabaseAuthUser[]> => {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) throw error;

  return (data.users ?? []) as SupabaseAuthUser[];
};

export const listAdminUsers = async (): Promise<AdminUser[]> => {
  const supabase = createSupabaseAdminClient();
  const users = await listAuthUsersPage(supabase, {
    page: 1,
    perPage: 200,
  });

  return mapAuthUsersToAdminUsers(supabase, users);
};

const getAdminUserSortValue = (
  user: AdminUser,
  sortBy: AdminUsersPageSortBy
): string => {
  switch (sortBy) {
    case "email":
      return user.email?.toLowerCase() ?? "";
    case "lastSignInAt":
      return user.lastSignInAt ?? "";
    case "role":
      return user.role;
    case "createdAt":
    default:
      return user.createdAt ?? "";
  }
};

const sortAdminUsers = (
  users: AdminUser[],
  sortBy: AdminUsersPageSortBy,
  direction: SortDirection
): AdminUser[] =>
  [...users].sort((left, right) => {
    const leftValue = getAdminUserSortValue(left, sortBy);
    const rightValue = getAdminUserSortValue(right, sortBy);
    const comparison = leftValue.localeCompare(rightValue);

    return direction === "asc" ? comparison : -comparison;
  });

const adminUserMatchesSearch = (
  user: AdminUser,
  search: string | null
): boolean => {
  if (!search) return true;

  const normalizedSearch = search.toLowerCase();
  const haystack = [
    user.email,
    user.firstName,
    user.lastName,
    user.role,
    user.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
};

const adminUserMatchesFilters = (
  user: AdminUser,
  filters: AdminUsersPageFilters,
  search: string | null
): boolean => {
  if (filters.role && user.role !== filters.role) return false;
  if (filters.status === "active" && !user.isActive) return false;
  if (filters.status === "inactive" && user.isActive) return false;

  return adminUserMatchesSearch(user, search);
};

const shouldUseDirectAuthPage = (
  pagination: OffsetPaginationParams<AdminUsersPageSortBy>,
  filters: AdminUsersPageFilters
): boolean =>
  pagination.sortBy === "createdAt" &&
  pagination.direction === "desc" &&
  !pagination.search &&
  !filters.role &&
  !filters.status;

export const getAdminUsersPage = async (
  pagination: OffsetPaginationParams<AdminUsersPageSortBy>,
  filters: AdminUsersPageFilters = {}
): Promise<PaginatedResult<AdminUser>> => {
  const supabase = createSupabaseAdminClient();

  if (shouldUseDirectAuthPage(pagination, filters)) {
    const users = await listAuthUsersPage(supabase, {
      page: pagination.page,
      perPage: pagination.limit + 1,
    });
    const hasNextPage = users.length > pagination.limit;
    const items = await mapAuthUsersToAdminUsers(
      supabase,
      users.slice(0, pagination.limit)
    );

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      hasPreviousPage: pagination.page > 1,
      hasNextPage,
      nextCursor: null,
      previousCursor: null,
    };
  }

  if (pagination.offset >= ADMIN_USERS_FILTER_SCAN_LIMIT) {
    throw new Error("Admin users filtered page exceeds scan limit.");
  }

  const matchedUsers: AdminUser[] = [];
  let authPage = 1;
  let scannedUsers = 0;
  let reachedEnd = false;

  while (scannedUsers < ADMIN_USERS_FILTER_SCAN_LIMIT && !reachedEnd) {
    const remainingScanLimit = ADMIN_USERS_FILTER_SCAN_LIMIT - scannedUsers;
    const perPage = Math.min(ADMIN_USERS_PROVIDER_PAGE_SIZE, remainingScanLimit);
    const users = await listAuthUsersPage(supabase, {
      page: authPage,
      perPage,
    });

    scannedUsers += users.length;

    if (users.length < perPage) {
      reachedEnd = true;
    }

    const adminUsers = await mapAuthUsersToAdminUsers(supabase, users);
    matchedUsers.push(
      ...adminUsers.filter((user) =>
        adminUserMatchesFilters(user, filters, pagination.search)
      )
    );

    authPage += 1;
  }

  const sortedUsers = sortAdminUsers(
    matchedUsers,
    pagination.sortBy,
    pagination.direction
  );
  const end = pagination.offset + pagination.limit;

  return {
    items: sortedUsers.slice(pagination.offset, end),
    total: reachedEnd ? sortedUsers.length : undefined,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: reachedEnd
      ? Math.max(1, Math.ceil(sortedUsers.length / pagination.limit))
      : undefined,
    hasPreviousPage: pagination.page > 1,
    hasNextPage: sortedUsers.length > end,
    nextCursor: null,
    previousCursor: null,
  };
};

export const updateAdminUser = async ({
  actor,
  targetUserId,
  firstName,
  lastName,
  role,
  isActive,
}: {
  actor: AuthorizedAdminUser;
  targetUserId: string;
  firstName?: unknown;
  lastName?: unknown;
  role?: unknown;
  isActive?: unknown;
}): Promise<AdminUser> => {
  const supabase = createSupabaseAdminClient();
  const existingAccount = getSingleRpcRow(
    await callAdminRpc<UserAccountRow[]>(supabase, "admin_get_user_account", {
      p_target_user_id: targetUserId,
    })
  );
  const currentRole = isAppRole(existingAccount?.role)
    ? existingAccount.role
    : "user";
  const nextRole = isAppRole(role) ? role : undefined;
  const nextActive = normalizeBoolean(isActive);
  const nextFirstName = firstName == null ? undefined : trimText(firstName);
  const nextLastName = lastName == null ? undefined : trimText(lastName);

  if (nextRole) {
    const canAssign = canAssignAppRole({
      actorRole: actor.role,
      actorUserId: actor.userId,
      targetUserId,
      targetCurrentRole: currentRole,
      targetRole: nextRole,
    });

    if (!canAssign) {
      throw new Error("Role assignment is not allowed.");
    }
  }

  if (targetUserId === actor.userId && nextActive === false) {
    throw new Error("Self deactivation is not allowed.");
  }

  await callAdminRpc<null>(supabase, "admin_update_user", {
    p_actor_user_id: actor.userId,
    p_actor_role: actor.role,
    p_target_user_id: targetUserId,
    p_first_name: nextFirstName ?? null,
    p_last_name: nextLastName ?? null,
    p_role: nextRole ?? null,
    p_is_active: nextActive,
    p_changes: {
      firstName: nextFirstName,
      lastName: nextLastName,
      role: nextRole,
      isActive: nextActive,
    },
  });

  return (await listAdminUsers()).find((user) => user.id === targetUserId) ??
    (() => {
      throw new Error("Updated user was not found.");
    })();
};

const filterAppPermissions = (values: unknown): AppPermission[] => {
  if (!Array.isArray(values)) return [];

  return values.filter((value): value is AppPermission =>
    APP_PERMISSIONS.includes(value as AppPermission)
  );
};

export const getAdminRoles = async () => {
  const supabase = createSupabaseAdminClient();
  const data = await callAdminRpc<RolePermissionOverrideRow[]>(
    supabase,
    "admin_get_role_permission_overrides"
  );

  return {
    roles: APP_ROLES,
    permissions: APP_PERMISSIONS,
    defaults: ROLE_PERMISSIONS,
    overrides: data
      .filter((row) => isAppRole(row.role))
      .map((row) => ({
        role: row.role as AppRole,
        permissions: filterAppPermissions(row.permissions),
        updatedAt: row.updated_at,
      })),
  };
};

export const saveAdminRoleOverride = async ({
  actor,
  role,
  permissions,
}: {
  actor: AuthorizedAdminUser;
  role: unknown;
  permissions: unknown;
}) => {
  if (!isAppRole(role)) {
    throw new Error("Invalid role.");
  }

  if (role === "admin") {
    throw new Error("Admin role permissions cannot be overridden.");
  }

  const nextPermissions = filterAppPermissions(permissions);
  const supabase = createSupabaseAdminClient();
  await callAdminRpc<null>(supabase, "admin_save_role_permission_override", {
    p_actor_user_id: actor.userId,
    p_actor_role: actor.role,
    p_role: role,
    p_permissions: nextPermissions,
    p_changes: { permissions: nextPermissions },
  });

  return getAdminRoles();
};

export const listFeatureFlags = async (): Promise<AdminFeatureFlag[]> => {
  const supabase = createSupabaseAdminClient();
  const data = await callAdminRpc<FeatureFlagRow[]>(
    supabase,
    "admin_list_feature_flags"
  );

  return data.map((row) => ({
    key: row.key,
    label: trimText(row.label) || row.key,
    description: row.description ?? null,
    enabled: row.enabled === true,
    updatedAt: row.updated_at,
  }));
};

export const saveFeatureFlag = async ({
  actor,
  key,
  label,
  description,
  enabled,
}: {
  actor: AuthorizedAdminUser;
  key: unknown;
  label: unknown;
  description?: unknown;
  enabled: unknown;
}): Promise<AdminFeatureFlag[]> => {
  const flagKey = trimText(key)
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "_");
  const flagLabel = trimText(label);

  if (!flagKey || !flagLabel || typeof enabled !== "boolean") {
    throw new Error("Invalid feature flag.");
  }

  const supabase = createSupabaseAdminClient();
  await callAdminRpc<null>(supabase, "admin_save_feature_flag", {
    p_actor_user_id: actor.userId,
    p_actor_role: actor.role,
    p_key: flagKey,
    p_label: flagLabel,
    p_description: trimText(description) || null,
    p_enabled: enabled,
    p_changes: { label: flagLabel, enabled },
  });

  return listFeatureFlags();
};

export const getMaintenanceSettings =
  async (): Promise<AdminMaintenanceSettings> => {
    const supabase = createSupabaseAdminClient();
    const row = getSingleRpcRow(
      await callAdminRpc<RuntimeSettingsRow[]>(
        supabase,
        "admin_get_maintenance_settings"
      )
    );

    return {
      enabled: row?.maintenance_enabled === true,
      message:
        trimText(row?.maintenance_message) ||
        "Estamos realizando mantenimiento. Volve a intentar en unos minutos.",
      updatedAt: row?.updated_at ?? null,
    };
  };

export const saveMaintenanceSettings = async ({
  actor,
  enabled,
  message,
}: {
  actor: AuthorizedAdminUser;
  enabled: unknown;
  message: unknown;
}): Promise<AdminMaintenanceSettings> => {
  if (typeof enabled !== "boolean") {
    throw new Error("Invalid maintenance status.");
  }

  const nextMessage =
    trimText(message) ||
    "Estamos realizando mantenimiento. Volve a intentar en unos minutos.";
  const supabase = createSupabaseAdminClient();
  await callAdminRpc<null>(supabase, "admin_save_maintenance_settings", {
    p_actor_user_id: actor.userId,
    p_actor_role: actor.role,
    p_enabled: enabled,
    p_message: nextMessage,
    p_changes: { enabled, message: nextMessage },
  });

  return getMaintenanceSettings();
};

type AdminAuditLogRow = {
  id: string;
  actor_user_id: string;
  actor_role: AppRole;
  action: string;
  resource: string;
  target_id: string | null;
  changes: Record<string, unknown> | null;
  result: string;
  created_at: string;
};

const fetchAuditLogItems = async (
  supabase: SupabaseClient,
  limit: number
): Promise<AdminAuditLogItem[]> => {
  const data = await callAdminRpc<AdminAuditLogRow[]>(
    supabase,
    "admin_get_audit_log",
    { p_limit: limit }
  );

  return data.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    action: row.action,
    resource: row.resource,
    targetId: row.target_id,
    changes: row.changes,
    result: row.result,
    createdAt: row.created_at,
  }));
};

export const getAuditLog = async (): Promise<AdminAuditLogItem[]> => {
  const supabase = createSupabaseAdminClient();

  return fetchAuditLogItems(supabase, ADMIN_AUDIT_LOG_LEGACY_LIMIT);
};

const getAuditLogSortValue = (
  item: AdminAuditLogItem,
  sortBy: AdminAuditLogPageSortBy
): string => {
  switch (sortBy) {
    case "resource":
      return item.resource.toLowerCase();
    case "action":
      return item.action.toLowerCase();
    case "actorRole":
      return item.actorRole;
    case "result":
      return item.result.toLowerCase();
    case "createdAt":
    default:
      return item.createdAt;
  }
};

const sortAuditLogItems = (
  items: AdminAuditLogItem[],
  sortBy: AdminAuditLogPageSortBy,
  direction: SortDirection
): AdminAuditLogItem[] =>
  [...items].sort((left, right) => {
    const comparison = getAuditLogSortValue(left, sortBy).localeCompare(
      getAuditLogSortValue(right, sortBy)
    );

    return direction === "asc" ? comparison : -comparison;
  });

const auditLogMatchesSearch = (
  item: AdminAuditLogItem,
  search: string | null
): boolean => {
  if (!search) return true;

  const normalizedSearch = search.toLowerCase();
  const haystack = [
    item.actorUserId,
    item.actorRole,
    item.action,
    item.resource,
    item.targetId,
    item.result,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
};

const auditLogMatchesFilters = (
  item: AdminAuditLogItem,
  filters: AdminAuditLogPageFilters,
  search: string | null
): boolean => {
  if (filters.role && item.actorRole !== filters.role) return false;
  if (filters.result && item.result !== filters.result) return false;
  if (filters.resource && item.resource !== filters.resource) return false;

  return auditLogMatchesSearch(item, search);
};

const shouldUseDirectAuditLogPage = (
  pagination: OffsetPaginationParams<AdminAuditLogPageSortBy>,
  filters: AdminAuditLogPageFilters
): boolean =>
  pagination.sortBy === "createdAt" &&
  pagination.direction === "desc" &&
  !pagination.search &&
  !filters.role &&
  !filters.result &&
  !filters.resource;

export const getAuditLogPage = async (
  pagination: OffsetPaginationParams<AdminAuditLogPageSortBy>,
  filters: AdminAuditLogPageFilters = {}
): Promise<PaginatedResult<AdminAuditLogItem>> => {
  if (pagination.offset >= ADMIN_AUDIT_LOG_SCAN_LIMIT) {
    throw new Error("Admin audit log page exceeds scan limit.");
  }

  const supabase = createSupabaseAdminClient();
  const end = pagination.offset + pagination.limit;
  const requestedLimit = shouldUseDirectAuditLogPage(pagination, filters)
    ? Math.min(end + 1, ADMIN_AUDIT_LOG_SCAN_LIMIT)
    : ADMIN_AUDIT_LOG_SCAN_LIMIT;
  const items = await fetchAuditLogItems(supabase, requestedLimit);
  const reachedEnd = items.length < requestedLimit;
  const filteredItems = shouldUseDirectAuditLogPage(pagination, filters)
    ? items
    : sortAuditLogItems(
        items.filter((item) =>
          auditLogMatchesFilters(item, filters, pagination.search)
        ),
        pagination.sortBy,
        pagination.direction
      );

  return {
    items: filteredItems.slice(pagination.offset, end),
    total: reachedEnd ? filteredItems.length : undefined,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: reachedEnd
      ? Math.max(1, Math.ceil(filteredItems.length / pagination.limit))
      : undefined,
    hasPreviousPage: pagination.page > 1,
    hasNextPage: filteredItems.length > end,
    nextCursor: null,
    previousCursor: null,
  };
};

type AdminMetricsRow = {
  users: number | string | null;
  active_users: number | string | null;
  comments: number | string | null;
  open_reports: number | string | null;
  feature_flags: number | string | null;
  audit_events: number | string | null;
};

const parseMetricCount = (value: number | string | null | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const getAdminMetrics = async () => {
  const supabase = createSupabaseAdminClient();
  const metrics = getSingleRpcRow(
    await callAdminRpc<AdminMetricsRow[]>(supabase, "admin_get_metrics")
  );

  return {
    users: parseMetricCount(metrics?.users),
    activeUsers: parseMetricCount(metrics?.active_users),
    comments: parseMetricCount(metrics?.comments),
    openReports: parseMetricCount(metrics?.open_reports),
    featureFlags: parseMetricCount(metrics?.feature_flags),
    auditEvents: parseMetricCount(metrics?.audit_events),
    external: {
      vercelAnalyticsUrl: "https://vercel.com/analytics",
      vercelSpeedInsightsUrl: "https://vercel.com/docs/speed-insights",
    },
  };
};

export const getAuthControls = async () => ({
  provider: "Supabase Auth",
  controls: [
    {
      id: "sessions",
      label: "Sesiones y tokens",
      description:
        "Las sesiones se validan con Supabase Auth y las acciones sensibles se revalidan en API.",
    },
    {
      id: "password-reset",
      label: "Reset de contraseña",
      description:
        "Los usuarios pueden usar el flujo existente de recuperacion de contraseña.",
    },
    {
      id: "bans",
      label: "Suspension de cuentas",
      description:
        "La suspension se gestiona con private.user_accounts.is_active y se refleja por realtime.",
    },
  ],
});

export const mapAdminErrorToStatus = (
  error: unknown
): { message: string; status: number } => {
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;

  if (errorCode === "PGRST106" || errorCode === "42501") {
    return {
      message: "La configuracion admin de Supabase no esta lista.",
      status: 500,
    };
  }

  if (!(error instanceof Error)) {
    return {
      message: "No pudimos procesar la solicitud admin.",
      status: 500,
    };
  }

  switch (error.message) {
    case "Role assignment is not allowed.":
    case "Self deactivation is not allowed.":
    case "Admin role permissions cannot be overridden.":
      return { message: "La accion no esta permitida.", status: 403 };
    case "Invalid role.":
    case "Invalid feature flag.":
    case "Invalid maintenance status.":
    case "Admin users filtered page exceeds scan limit.":
    case "Admin audit log page exceeds scan limit.":
      return { message: "Revisa los datos enviados.", status: 400 };
    default:
      return {
        message: "No pudimos procesar la solicitud admin.",
        status: 500,
      };
  }
};
