import process from "node:process";
import { createClient } from "@supabase/supabase-js";

import {
  getDashboardRequestPermission,
  getDashboardResourcePermission,
  hasPermission,
  isAppRole,
  type AppPermission,
  type AppRole,
  type DashboardPermissionResource,
  type DashboardResourcePermissionAction,
} from "../../shared/auth/permissions.js";
import { errorJson } from "./responses.js";

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
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!token) {
    return errorJson("No autorizado.", 401);
  }

  if (!supabaseUrl || !publishableKey) {
    return errorJson("Supabase no está configurado en el servidor.", 500);
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
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
    return errorJson("Tu usuario ha sido baneado.", 403);
  }

  // UI/API permission checks are defense in depth; Supabase RLS must still enforce data access.
  if (!hasPermission(role, requiredPermission)) {
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
