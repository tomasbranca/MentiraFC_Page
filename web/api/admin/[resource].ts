import {
  authorizeAdminRequest,
  isAdminPermissionResource,
} from "../_lib/auth.js";
import {
  getAdminMetrics,
  getAdminRoles,
  getAuditLog,
  getAuthControls,
  getMaintenanceSettings,
  listAdminUsers,
  listFeatureFlags,
  mapAdminErrorToStatus,
  recordAuditLog,
  saveAdminRoleOverride,
  saveFeatureFlag,
  saveMaintenanceSettings,
  updateAdminUser,
  createSupabaseAdminClient,
} from "../_lib/admin.js";
import {
  getFooterSettingsForAdmin,
  saveFooterSettingsForAdmin,
} from "../_lib/footerSettings.js";
import {
  assertRateLimit,
  isRateLimitError,
  RATE_LIMIT_MESSAGE,
} from "../_lib/rateLimit.js";
import { normalizeUuid } from "../_lib/requestValidation.js";
import { errorJson, json } from "../_lib/responses.js";
import { ADMIN_MUTATION_RATE_LIMIT_RULES } from "../_lib/securityLimits.js";
import { logSecurityEvent } from "../_lib/securityLog.js";

const getResourceFromPathname = (pathname: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  const adminIndex = segments.lastIndexOf("admin");

  return adminIndex >= 0 ? segments[adminIndex + 1]?.trim() || null : null;
};

const parseJsonBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const adminHandler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const resource = getResourceFromPathname(url.pathname);

  if (!isAdminPermissionResource(resource)) {
    return errorJson("Recurso admin no encontrado.", 404);
  }

  if (resource === "maintenance" && url.searchParams.get("public") === "1") {
    try {
      return json(await getMaintenanceSettings());
    } catch {
      return json({
        enabled: false,
        message: "",
        updatedAt: null,
      });
    }
  }

  const authorization = await authorizeAdminRequest(request, resource);

  if (authorization instanceof Response) {
    return authorization;
  }

  try {
    if (request.method === "GET") {
      switch (resource) {
        case "users":
          return json(await listAdminUsers());
        case "roles":
          return json(await getAdminRoles());
        case "footer-settings":
          return json(await getFooterSettingsForAdmin());
        case "audit-log":
          return json(await getAuditLog());
        case "metrics":
          return json(await getAdminMetrics());
        case "auth-controls":
          return json(await getAuthControls());
        case "feature-flags":
          return json(await listFeatureFlags());
        case "maintenance":
          return json(await getMaintenanceSettings());
        case "moderation":
        case "reports":
          return json({
            redirectTo: "/admin/reportes-comentarios",
            message: "La moderacion usa la cola de reportes existente.",
          });
      }
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      assertRateLimit({
        action: "admin:mutation",
        identifier: authorization.userId,
        rules: ADMIN_MUTATION_RATE_LIMIT_RULES,
        meta: { userId: authorization.userId, resource },
      });

      const body = await parseJsonBody<Record<string, unknown>>(request);

      if (!body) {
        return errorJson("Payload admin invalido.", 400);
      }

      switch (resource) {
        case "users": {
          const targetUserId = normalizeUuid(body.id);

          if (!targetUserId) {
            return errorJson("Falta el usuario a actualizar.", 400);
          }

          if (typeof body.role === "string" || typeof body.isActive === "boolean") {
            logSecurityEvent(
              "admin_user_sensitive_change_attempt",
              {
                actorUserId: authorization.userId,
                targetUserId,
                role: typeof body.role === "string" ? body.role : null,
                changesActive: typeof body.isActive === "boolean",
              },
              "info"
            );
          }

          return json(
            await updateAdminUser({
              actor: authorization,
              targetUserId,
              firstName: body.firstName,
              lastName: body.lastName,
              role: body.role,
              isActive: body.isActive,
            })
          );
        }
        case "roles":
          return json(
            await saveAdminRoleOverride({
              actor: authorization,
              role: body.role,
              permissions: body.permissions,
            })
          );
        case "footer-settings": {
          const settings = await saveFooterSettingsForAdmin(body);

          try {
            await recordAuditLog(createSupabaseAdminClient(), {
              actor: authorization,
              action: "admin.footer_settings.update",
              resource: "footer-settings",
              targetId: "footerSettings",
              changes: {
                contactEmail: settings.contactEmail,
                socials: settings.socials.length,
                links: settings.links.length,
                sponsors: settings.sponsors.length,
              },
            });
          } catch (auditError) {
            console.warn(
              "Admin footer audit log failed after Sanity save.",
              auditError
            );
          }

          return json(settings);
        }
        case "feature-flags":
          return json(
            await saveFeatureFlag({
              actor: authorization,
              key: body.key,
              label: body.label,
              description: body.description,
              enabled: body.enabled,
            })
          );
        case "maintenance":
          return json(
            await saveMaintenanceSettings({
              actor: authorization,
              enabled: body.enabled,
              message: body.message,
            })
          );
        default:
          return errorJson("Metodo no permitido para este recurso.", 405);
      }
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (isRateLimitError(error)) {
      return errorJson(RATE_LIMIT_MESSAGE, 429);
    }

    const mapped = mapAdminErrorToStatus(error);

    if (mapped.status >= 500) {
      logSecurityEvent(
        "admin_api_sensitive_error",
        { resource, status: mapped.status },
        "error"
      );
    }

    return errorJson(mapped.message, mapped.status);
  }
};

export default {
  fetch: adminHandler,
};
