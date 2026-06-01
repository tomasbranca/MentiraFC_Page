import {
  ADMIN_PERMISSION_RESOURCES,
  getDashboardRequestPermission,
  getDashboardResourcePermission,
  getAdminResourcePermission,
  hasPermission,
  isAppRole,
  type AdminPermissionResource,
  type AppPermission,
  type AppRole,
  type DashboardPermissionResource,
  type DashboardResourcePermissionAction,
} from "../../shared/auth/permissions.js";
import { errorJson } from "./responses.js";
import { logSecurityEvent } from "./securityLog.js";
import { createUserSupabaseClient } from "./supabase.js";

type AuthorizedDashboardUser = {
  userId: string;
  role: AppRole;
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
};

export const authorizeDashboardUser = async (
  request: Request,
  requiredPermission: AppPermission
): Promise<AuthorizedDashboardUser | Response> => {
  const token = getBearerToken(request);
  const pathname = new URL(request.url).pathname;

  if (!token) {
    logSecurityEvent("api_missing_auth_token", {
      requiredPermission,
      pathname,
      method: request.method,
    });
    return errorJson("No autorizado.", 401);
  }

  let supabase: ReturnType<typeof createUserSupabaseClient>;

  try {
    supabase = createUserSupabaseClient(token);
  } catch {
    return errorJson("Supabase no está configurado en el servidor.", 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    logSecurityEvent("api_invalid_auth_token", {
      requiredPermission,
      pathname,
      method: request.method,
    });
    return errorJson("La sesión no es válida.", 401);
  }

  const { data: account, error: accountError } = await supabase
    .from("my_account")
    .select("role, is_active")
    .maybeSingle();

  if (accountError || !account) {
    return errorJson("No pudimos validar la cuenta.", 403);
  }

  if (!isAppRole(account.role)) {
    return errorJson("No pudimos validar los permisos de la cuenta.", 403);
  }

  const role = account.role;

  if (!account.is_active) {
    logSecurityEvent("inactive_api_user_blocked", {
      userId: user.id,
      requiredPermission,
      pathname,
      method: request.method,
    });
    return errorJson("Tu usuario ha sido baneado.", 403);
  }

  // UI/API permission checks are defense in depth; Supabase RLS must still enforce data access.
  if (!hasPermission(role, requiredPermission)) {
    logSecurityEvent("api_permission_denied", {
      userId: user.id,
      role,
      requiredPermission,
      pathname,
      method: request.method,
    });
    return errorJson(
      `No tenes permisos para realizar esta accion del dashboard (${requiredPermission}).`,
      403
    );
  }

  return {
    userId: user.id,
    role,
  };
};

export const authorizeDashboardAction = async <
  Resource extends DashboardPermissionResource,
>(
  request: Request,
  resource: Resource,
  action: DashboardResourcePermissionAction<Resource>
): Promise<AuthorizedDashboardUser | Response> =>
  authorizeDashboardUser(
    request,
    getDashboardResourcePermission(resource, action)
  );

export const authorizeDashboardRequest = async (
  request: Request,
  resource: DashboardPermissionResource
): Promise<AuthorizedDashboardUser | Response> =>
  authorizeDashboardUser(
    request,
    getDashboardRequestPermission(resource, request.method)
  );

export const isAdminPermissionResource = (
  resource: unknown
): resource is AdminPermissionResource =>
  typeof resource === "string" &&
  ADMIN_PERMISSION_RESOURCES.includes(resource as AdminPermissionResource);

export const authorizeAdminRequest = async (
  request: Request,
  resource: AdminPermissionResource
): Promise<AuthorizedDashboardUser | Response> =>
  authorizeDashboardUser(request, getAdminResourcePermission(resource));
