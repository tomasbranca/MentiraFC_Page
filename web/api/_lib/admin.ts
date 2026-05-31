import process from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  APP_PERMISSIONS,
  APP_ROLES,
  canAssignAppRole,
  ROLE_PERMISSIONS,
  isAppRole,
  type AppPermission,
  type AppRole,
} from "../../shared/auth/permissions.js";

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

const getSupabaseAdminConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return { supabaseUrl, serviceRoleKey };
};

export const createSupabaseAdminClient = (): SupabaseClient => {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const privateTable = (supabase: SupabaseClient, table: string) =>
  supabase.schema("private").from(table);

const trimText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

export const recordAuditLog = async (
  supabase: SupabaseClient,
  input: AuditLogInput
): Promise<void> => {
  const { error } = await privateTable(supabase, "audit_log").insert({
    actor_user_id: input.actor.userId,
    actor_role: input.actor.role,
    action: input.action,
    resource: input.resource,
    target_id: input.targetId ?? null,
    changes: input.changes ?? null,
    result: input.result ?? "success",
  });

  if (error) {
    throw error;
  }
};

const fetchProfilesByIds = async (
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, ProfileRow>> => {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", ids);

  if (error) throw error;

  return new Map(((data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
};

const fetchAccountsByIds = async (
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, UserAccountRow>> => {
  if (ids.length === 0) return new Map();

  const { data, error } = await privateTable(supabase, "user_accounts")
    .select("user_id, role, is_active")
    .in("user_id", ids);

  if (error) throw error;

  return new Map(
    ((data ?? []) as UserAccountRow[]).map((row) => [row.user_id, row])
  );
};

export const listAdminUsers = async (): Promise<AdminUser[]> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) throw error;

  const users = data.users ?? [];
  const ids = users.map((user) => user.id);
  const [profiles, accounts] = await Promise.all([
    fetchProfilesByIds(supabase, ids),
    fetchAccountsByIds(supabase, ids),
  ]);

  return users.map((user) => {
    const profile = profiles.get(user.id);
    const account = accounts.get(user.id);
    const role = isAppRole(account?.role) ? account.role : "user";

    return {
      id: user.id,
      email: user.email ?? null,
      firstName: trimText(profile?.first_name) || "Usuario",
      lastName: trimText(profile?.last_name),
      role,
      isActive: account?.is_active !== false,
      createdAt: user.created_at ?? null,
      lastSignInAt: user.last_sign_in_at ?? null,
    };
  });
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
  const { data: existingAccount, error: existingAccountError } =
    await privateTable(supabase, "user_accounts")
      .select("user_id, role, is_active")
      .eq("user_id", targetUserId)
      .maybeSingle();

  if (existingAccountError) throw existingAccountError;

  const currentRole = isAppRole((existingAccount as UserAccountRow | null)?.role)
    ? ((existingAccount as UserAccountRow).role as AppRole)
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

  if (nextFirstName != null || nextLastName != null) {
    const profileUpdate: Record<string, string> = {};

    if (nextFirstName != null) profileUpdate.first_name = nextFirstName;
    if (nextLastName != null) profileUpdate.last_name = nextLastName;

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", targetUserId);

    if (error) throw error;
  }

  if (nextRole || nextActive !== null) {
    const accountUpdate: Record<string, string | boolean> = {
      user_id: targetUserId,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    };

    if (nextRole) accountUpdate.role = nextRole;
    if (nextActive !== null) accountUpdate.is_active = nextActive;

    const { error } = await privateTable(supabase, "user_accounts")
      .upsert(accountUpdate, { onConflict: "user_id" });

    if (error) throw error;
  }

  await recordAuditLog(supabase, {
    actor,
    action: "admin.users.update",
    resource: "users",
    targetId: targetUserId,
    changes: {
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
  const { data, error } = await privateTable(
    supabase,
    "role_permission_overrides"
  ).select("role, permissions, updated_at");

  if (error) throw error;

  return {
    roles: APP_ROLES,
    permissions: APP_PERMISSIONS,
    defaults: ROLE_PERMISSIONS,
    overrides: ((data ?? []) as RolePermissionOverrideRow[])
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
  const { error } = await privateTable(supabase, "role_permission_overrides")
    .upsert({
      role,
      permissions: nextPermissions,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  await recordAuditLog(supabase, {
    actor,
    action: "admin.roles.update",
    resource: "roles",
    targetId: role,
    changes: { permissions: nextPermissions },
  });

  return getAdminRoles();
};

export const listFeatureFlags = async (): Promise<AdminFeatureFlag[]> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await privateTable(supabase, "feature_flags")
    .select("key, label, description, enabled, updated_at")
    .order("key");

  if (error) throw error;

  return ((data ?? []) as FeatureFlagRow[]).map((row) => ({
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
  const { error } = await privateTable(supabase, "feature_flags").upsert({
    key: flagKey,
    label: flagLabel,
    description: trimText(description) || null,
    enabled,
    updated_by: actor.userId,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  await recordAuditLog(supabase, {
    actor,
    action: "admin.feature_flags.update",
    resource: "feature-flags",
    targetId: flagKey,
    changes: { label: flagLabel, enabled },
  });

  return listFeatureFlags();
};

export const getMaintenanceSettings =
  async (): Promise<AdminMaintenanceSettings> => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await privateTable(
      supabase,
      "app_runtime_settings"
    )
      .select("maintenance_enabled, maintenance_message, updated_at")
      .eq("id", "app")
      .maybeSingle();

    if (error) throw error;

    const row = data as RuntimeSettingsRow | null;

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
  const { error } = await privateTable(supabase, "app_runtime_settings")
    .upsert({
      id: "app",
      maintenance_enabled: enabled,
      maintenance_message: nextMessage,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  await recordAuditLog(supabase, {
    actor,
    action: "admin.maintenance.update",
    resource: "maintenance",
    targetId: "app",
    changes: { enabled, message: nextMessage },
  });

  return getMaintenanceSettings();
};

export const getAuditLog = async () => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await privateTable(supabase, "audit_log")
    .select(
      "id, actor_user_id, actor_role, action, resource, target_id, changes, result, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => ({
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

export const getAdminMetrics = async () => {
  const supabase = createSupabaseAdminClient();
  const [
    usersResult,
    activeUsersResult,
    commentsResult,
    openReportsResult,
    featureFlagsResult,
    auditEventsResult,
  ] = await Promise.all([
    privateTable(supabase, "user_accounts").select("*", {
      count: "exact",
      head: true,
    }),
    privateTable(supabase, "user_accounts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("news_comments").select("*", {
      count: "exact",
      head: true,
    }),
    supabase
      .from("comment_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    privateTable(supabase, "feature_flags").select("*", {
      count: "exact",
      head: true,
    }),
    privateTable(supabase, "audit_log").select("*", {
      count: "exact",
      head: true,
    }),
  ]);

  const results = [
    usersResult,
    activeUsersResult,
    commentsResult,
    openReportsResult,
    featureFlagsResult,
    auditEventsResult,
  ];
  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    throw failedResult.error;
  }

  return {
    users: usersResult.count ?? 0,
    activeUsers: activeUsersResult.count ?? 0,
    comments: commentsResult.count ?? 0,
    openReports: openReportsResult.count ?? 0,
    featureFlags: featureFlagsResult.count ?? 0,
    auditEvents: auditEventsResult.count ?? 0,
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
      return { message: "Revisa los datos enviados.", status: 400 };
    default:
      return {
        message: error.message || "No pudimos procesar la solicitud admin.",
        status: 500,
      };
  }
};
