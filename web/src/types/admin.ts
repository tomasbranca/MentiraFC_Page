import type { AppPermission, AppRole } from "../../shared/auth/permissions";
import type { PaginatedResult, SortDirection } from "../../shared/pagination";
import type { FooterSettings } from "./models";

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

export type AdminUsersPageSortBy =
  | "createdAt"
  | "email"
  | "lastSignInAt"
  | "role";

export type AdminUsersPageStatusFilter = "active" | "inactive";

export type AdminUsersPageOptions = {
  page?: number;
  limit?: number;
  sortBy?: AdminUsersPageSortBy;
  direction?: SortDirection;
  search?: string | null;
  role?: AppRole | null;
  status?: AdminUsersPageStatusFilter | null;
};

export type AdminUsersPage = PaginatedResult<AdminUser>;

export type AdminRolesPayload = {
  roles: AppRole[];
  permissions: AppPermission[];
  defaults: Record<AppRole, AppPermission[]>;
  overrides: Array<{
    role: AppRole;
    permissions: AppPermission[];
    updatedAt: string | null;
  }>;
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

export type AdminMetricsPayload = {
  users: number;
  activeUsers: number;
  comments: number;
  openReports: number;
  featureFlags: number;
  auditEvents: number;
  external: {
    vercelAnalyticsUrl: string;
    vercelSpeedInsightsUrl: string;
  };
};

export type AdminAuthControlsPayload = {
  provider: string;
  controls: Array<{
    id: string;
    label: string;
    description: string;
  }>;
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

export type AdminFooterSettings = FooterSettings;
