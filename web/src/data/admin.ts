import { APP_PERMISSIONS, APP_ROLES } from "../../shared/auth/permissions";
import { FOOTER_SOCIAL_PLATFORMS } from "../../shared/site/footerSettings";
import { getCurrentAccessToken } from "./auth";
import { z, zodParseOptions } from "./zodRuntime";
import type {
  AdminAuditLogItem,
  AdminAuthControlsPayload,
  AdminFeatureFlag,
  AdminFooterSettings,
  AdminMaintenanceSettings,
  AdminMetricsPayload,
  AdminRolesPayload,
  AdminUser,
  AdminUsersPage,
  AdminUsersPageOptions,
} from "../types/admin";
import type { AppPermission, AppRole } from "../../shared/auth/permissions";
import type { PaginatedResult } from "../../shared/pagination";

const appRoleSchema = z.enum(APP_ROLES);
const appPermissionSchema = z.enum(APP_PERMISSIONS);

const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  role: appRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
});

const adminUsersPageSchema = z.object({
  items: z.array(adminUserSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number(),
  totalPages: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  nextCursor: z.string().nullable().optional(),
  previousCursor: z.string().nullable().optional(),
});

const footerSocialSchema = z.object({
  id: z.string(),
  label: z.string(),
  platform: z.enum(FOOTER_SOCIAL_PLATFORMS),
  url: z.string(),
});

const footerLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

const footerSponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  logoUrl: z.string(),
  logoAlt: z.string(),
});

const adminFooterSettingsSchema = z.object({
  id: z.string(),
  contactEmail: z.string(),
  socials: z.array(footerSocialSchema),
  links: z.array(footerLinkSchema),
  sponsors: z.array(footerSponsorSchema),
  updatedAt: z.string().nullable().optional(),
});

const adminRolesPayloadSchema = z.object({
  roles: z.array(appRoleSchema),
  permissions: z.array(appPermissionSchema),
  defaults: z.record(appRoleSchema, z.array(appPermissionSchema)),
  overrides: z.array(
    z.object({
      role: appRoleSchema,
      permissions: z.array(appPermissionSchema),
      updatedAt: z.string().nullable(),
    })
  ),
});

const adminAuditLogSchema = z.object({
  id: z.string(),
  actorUserId: z.string(),
  actorRole: appRoleSchema,
  action: z.string(),
  resource: z.string(),
  targetId: z.string().nullable(),
  changes: z.record(z.string(), z.unknown()).nullable(),
  result: z.string(),
  createdAt: z.string(),
});

const adminMetricsSchema = z.object({
  users: z.number(),
  activeUsers: z.number(),
  comments: z.number(),
  openReports: z.number(),
  featureFlags: z.number(),
  auditEvents: z.number(),
  external: z.object({
    vercelAnalyticsUrl: z.string(),
    vercelSpeedInsightsUrl: z.string(),
  }),
});

const adminAuthControlsSchema = z.object({
  provider: z.string(),
  controls: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string(),
    })
  ),
});

const adminFeatureFlagSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  enabled: z.boolean(),
  updatedAt: z.string().nullable(),
});

const adminMaintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string(),
  updatedAt: z.string().nullable(),
});

const ADMIN_API_PATH = "/api/admin";

const buildAdminApiPath = (resource: string, params?: Record<string, string>) => {
  const query = new URLSearchParams(params).toString();

  return query ? `${ADMIN_API_PATH}/${resource}?${query}` : `${ADMIN_API_PATH}/${resource}`;
};

const fetchAdminApi = async <T>(
  resource: string,
  init?: RequestInit,
  params?: Record<string, string>
): Promise<T> => {
  const accessToken = await getCurrentAccessToken();
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildAdminApiPath(resource, params), {
    ...init,
    headers,
  });
  const payload = await response.json() as { data?: T; error?: string };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Admin request failed.");
  }

  return payload.data as T;
};

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const data = await fetchAdminApi<unknown[]>("users");
  return z.array(adminUserSchema).parse(data, zodParseOptions) as AdminUser[];
};

const buildAdminUsersPageParams = (
  options: AdminUsersPageOptions
): Record<string, string> => {
  const params: Record<string, string> = {
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
    sortBy: options.sortBy ?? "createdAt",
    direction: options.direction ?? "desc",
  };

  if (options.search) params.search = options.search;
  if (options.role) params.role = options.role;
  if (options.status) params.status = options.status;

  return params;
};

export const buildAdminUsersPageApiPath = (
  options: AdminUsersPageOptions = {}
): string => buildAdminApiPath("users", buildAdminUsersPageParams(options));

export const fetchAdminUsersPage = async (
  options: AdminUsersPageOptions = {}
): Promise<AdminUsersPage> => {
  const data = await fetchAdminApi<unknown>(
    "users",
    undefined,
    buildAdminUsersPageParams(options)
  );

  return adminUsersPageSchema.parse(
    data,
    zodParseOptions
  ) as PaginatedResult<AdminUser>;
};

export const updateAdminUser = async (
  input: Partial<AdminUser> & { id: string }
): Promise<AdminUser> => {
  const data = await fetchAdminApi<unknown>("users", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return adminUserSchema.parse(data, zodParseOptions) as AdminUser;
};

export const fetchAdminRoles = async (): Promise<AdminRolesPayload> => {
  const data = await fetchAdminApi<unknown>("roles");
  return adminRolesPayloadSchema.parse(data, zodParseOptions) as AdminRolesPayload;
};

export const saveAdminRoleOverride = async (
  role: AppRole,
  permissions: AppPermission[]
): Promise<AdminRolesPayload> => {
  const data = await fetchAdminApi<unknown>("roles", {
    method: "PUT",
    body: JSON.stringify({ role, permissions }),
  });

  return adminRolesPayloadSchema.parse(data, zodParseOptions) as AdminRolesPayload;
};

export const fetchAdminFooterSettings = async (): Promise<AdminFooterSettings> => {
  const data = await fetchAdminApi<unknown>("footer-settings");
  return adminFooterSettingsSchema.parse(data, zodParseOptions) as AdminFooterSettings;
};

export const saveAdminFooterSettings = async (
  settings: AdminFooterSettings
): Promise<AdminFooterSettings> => {
  const data = await fetchAdminApi<unknown>("footer-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

  return adminFooterSettingsSchema.parse(data, zodParseOptions) as AdminFooterSettings;
};

export const fetchAdminAuditLog = async (): Promise<AdminAuditLogItem[]> => {
  const data = await fetchAdminApi<unknown[]>("audit-log");
  return z.array(adminAuditLogSchema).parse(data, zodParseOptions) as AdminAuditLogItem[];
};

export const fetchAdminMetrics = async (): Promise<AdminMetricsPayload> => {
  const data = await fetchAdminApi<unknown>("metrics");
  return adminMetricsSchema.parse(data, zodParseOptions) as AdminMetricsPayload;
};

export const fetchAdminAuthControls =
  async (): Promise<AdminAuthControlsPayload> => {
    const data = await fetchAdminApi<unknown>("auth-controls");
    return adminAuthControlsSchema.parse(
      data,
      zodParseOptions
    ) as AdminAuthControlsPayload;
  };

export const fetchFeatureFlags = async (): Promise<AdminFeatureFlag[]> => {
  const data = await fetchAdminApi<unknown[]>("feature-flags");
  return z.array(adminFeatureFlagSchema).parse(data, zodParseOptions) as AdminFeatureFlag[];
};

export const saveFeatureFlag = async (
  flag: Pick<AdminFeatureFlag, "key" | "label" | "description" | "enabled">
): Promise<AdminFeatureFlag[]> => {
  const data = await fetchAdminApi<unknown[]>("feature-flags", {
    method: "PUT",
    body: JSON.stringify(flag),
  });

  return z.array(adminFeatureFlagSchema).parse(data, zodParseOptions) as AdminFeatureFlag[];
};

export const fetchMaintenanceSettings =
  async (): Promise<AdminMaintenanceSettings> => {
    const data = await fetchAdminApi<unknown>("maintenance");
    return adminMaintenanceSchema.parse(
      data,
      zodParseOptions
    ) as AdminMaintenanceSettings;
  };

export const fetchPublicMaintenanceSettings =
  async (): Promise<AdminMaintenanceSettings> => {
    const response = await fetch(buildAdminApiPath("maintenance", { public: "1" }));
    const payload = await response.json() as { data?: unknown };

    return adminMaintenanceSchema.parse(
      payload.data,
      zodParseOptions
    ) as AdminMaintenanceSettings;
  };

export const saveMaintenanceSettings = async (
  settings: Pick<AdminMaintenanceSettings, "enabled" | "message">
): Promise<AdminMaintenanceSettings> => {
  const data = await fetchAdminApi<unknown>("maintenance", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

  return adminMaintenanceSchema.parse(data, zodParseOptions) as AdminMaintenanceSettings;
};
