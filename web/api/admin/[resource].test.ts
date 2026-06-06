import { beforeEach, describe, expect, it, vi } from "vitest";

import adminRoute from "./[resource].js";
import { __resetRateLimitsForTests } from "../_lib/rateLimit";

const adminMocks = vi.hoisted(() => ({
  ADMIN_AUDIT_LOG_PAGE_SORT_BY: [
    "createdAt",
    "resource",
    "action",
    "actorRole",
    "result",
  ],
  ADMIN_AUDIT_LOG_RESULT_FILTERS: ["success", "failure"],
  ADMIN_USERS_PAGE_SORT_BY: ["createdAt", "email", "lastSignInAt", "role"],
  ADMIN_USERS_PAGE_STATUS_FILTERS: ["active", "inactive"],
  authorizeAdminRequest: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getAdminMetrics: vi.fn(),
  getAdminRoles: vi.fn(),
  getAuditLogPage: vi.fn(),
  getAdminUsersPage: vi.fn(),
  getAuditLog: vi.fn(),
  getAuthControls: vi.fn(),
  getFooterSettingsForAdmin: vi.fn(),
  getMaintenanceSettings: vi.fn(),
  isAdminPermissionResource: vi.fn(),
  listAdminUsers: vi.fn(),
  listFeatureFlags: vi.fn(),
  mapAdminErrorToStatus: vi.fn(),
  recordAuditLog: vi.fn(),
  saveAdminRoleOverride: vi.fn(),
  saveFeatureFlag: vi.fn(),
  saveFooterSettingsForAdmin: vi.fn(),
  saveMaintenanceSettings: vi.fn(),
  updateAdminUser: vi.fn(),
}));

vi.mock("../_lib/auth.js", () => ({
  authorizeAdminRequest: adminMocks.authorizeAdminRequest,
  isAdminPermissionResource: adminMocks.isAdminPermissionResource,
}));

vi.mock("../_lib/admin.js", () => ({
  ADMIN_AUDIT_LOG_PAGE_SORT_BY: adminMocks.ADMIN_AUDIT_LOG_PAGE_SORT_BY,
  ADMIN_AUDIT_LOG_RESULT_FILTERS: adminMocks.ADMIN_AUDIT_LOG_RESULT_FILTERS,
  ADMIN_USERS_PAGE_SORT_BY: adminMocks.ADMIN_USERS_PAGE_SORT_BY,
  ADMIN_USERS_PAGE_STATUS_FILTERS: adminMocks.ADMIN_USERS_PAGE_STATUS_FILTERS,
  createSupabaseAdminClient: adminMocks.createSupabaseAdminClient,
  getAdminMetrics: adminMocks.getAdminMetrics,
  getAdminRoles: adminMocks.getAdminRoles,
  getAuditLogPage: adminMocks.getAuditLogPage,
  getAdminUsersPage: adminMocks.getAdminUsersPage,
  getAuditLog: adminMocks.getAuditLog,
  getAuthControls: adminMocks.getAuthControls,
  getMaintenanceSettings: adminMocks.getMaintenanceSettings,
  listAdminUsers: adminMocks.listAdminUsers,
  listFeatureFlags: adminMocks.listFeatureFlags,
  mapAdminErrorToStatus: adminMocks.mapAdminErrorToStatus,
  recordAuditLog: adminMocks.recordAuditLog,
  saveAdminRoleOverride: adminMocks.saveAdminRoleOverride,
  saveFeatureFlag: adminMocks.saveFeatureFlag,
  saveMaintenanceSettings: adminMocks.saveMaintenanceSettings,
  updateAdminUser: adminMocks.updateAdminUser,
}));

vi.mock("../_lib/footerSettings.js", () => ({
  getFooterSettingsForAdmin: adminMocks.getFooterSettingsForAdmin,
  saveFooterSettingsForAdmin: adminMocks.saveFooterSettingsForAdmin,
}));

const adminResources = new Set([
  "users",
  "roles",
  "footer-settings",
  "audit-log",
  "metrics",
  "auth-controls",
  "feature-flags",
  "maintenance",
  "moderation",
  "reports",
]);

describe("admin api router", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_STORE", "");
    vi.resetAllMocks();
    __resetRateLimitsForTests();
    adminMocks.isAdminPermissionResource.mockImplementation((resource: unknown) =>
      adminResources.has(String(resource))
    );
    adminMocks.authorizeAdminRequest.mockResolvedValue({
      userId: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
      role: "admin",
    });
    adminMocks.mapAdminErrorToStatus.mockImplementation((error: unknown) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;

      if (code === "PGRST106" || code === "42501") {
        return {
          message: "La configuracion admin de Supabase no esta lista.",
          status: 500,
        };
      }

      return {
        message: "No pudimos procesar la solicitud admin.",
        status: 500,
      };
    });
  });

  it("expone una Function admin centralizada", () => {
    expect(adminRoute.fetch).toBeTypeOf("function");
  });

  it("devuelve 404 para recursos admin desconocidos", async () => {
    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/desconocido")
    );

    await expect(response.json()).resolves.toEqual({
      error: "Recurso admin no encontrado.",
    });
    expect(response.status).toBe(404);
  });

  it("traduce fallos de configuracion Supabase admin", async () => {
    adminMocks.getAdminRoles.mockRejectedValue({
      code: "PGRST106",
      message: "Invalid schema: private",
    });

    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/roles")
    );

    await expect(response.json()).resolves.toEqual({
      error: "La configuracion admin de Supabase no esta lista.",
    });
    expect(response.status).toBe(500);
  });

  it("no ejecuta handlers admin si la autorizacion falla", async () => {
    adminMocks.authorizeAdminRequest.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "No autorizado." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/users")
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(403);
    expect(adminMocks.listAdminUsers).not.toHaveBeenCalled();
  });

  it("mantiene el array legacy de usuarios si no hay parametros de pagina", async () => {
    adminMocks.listAdminUsers.mockResolvedValue([]);

    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/users")
    );

    await expect(response.json()).resolves.toEqual({ data: [] });
    expect(response.status).toBe(200);
    expect(adminMocks.listAdminUsers).toHaveBeenCalledTimes(1);
    expect(adminMocks.getAdminUsersPage).not.toHaveBeenCalled();
  });

  it("pagina usuarios admin con params validados", async () => {
    const page = {
      items: [],
      page: 1,
      limit: 20,
      hasPreviousPage: false,
      hasNextPage: false,
      nextCursor: null,
      previousCursor: null,
    };

    adminMocks.getAdminUsersPage.mockResolvedValue(page);

    const response = await adminRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/admin/users?page=1&limit=20&sortBy=email&direction=asc&search=tomas&role=admin&status=active"
      )
    );

    await expect(response.json()).resolves.toEqual({ data: page });
    expect(response.status).toBe(200);
    expect(adminMocks.getAdminUsersPage).toHaveBeenCalledWith(
      {
        page: 1,
        limit: 20,
        offset: 0,
        sortBy: "email",
        direction: "asc",
        search: "tomas",
      },
      {
        role: "admin",
        status: "active",
      }
    );
    expect(adminMocks.listAdminUsers).not.toHaveBeenCalled();
  });

  it("rechaza filtros de usuarios admin fuera de whitelist", async () => {
    const response = await adminRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/admin/users?page=1&role=admin%27%20OR%201%3D1"
      )
    );

    await expect(response.json()).resolves.toEqual({
      error: "El rol elegido no esta permitido para este listado.",
    });
    expect(response.status).toBe(400);
    expect(adminMocks.getAdminUsersPage).not.toHaveBeenCalled();
  });

  it("mantiene el array legacy del audit log si no hay parametros de pagina", async () => {
    adminMocks.getAuditLog.mockResolvedValue([]);

    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/audit-log")
    );

    await expect(response.json()).resolves.toEqual({ data: [] });
    expect(response.status).toBe(200);
    expect(adminMocks.getAuditLog).toHaveBeenCalledTimes(1);
    expect(adminMocks.getAuditLogPage).not.toHaveBeenCalled();
  });

  it("pagina audit log con params validados", async () => {
    const page = {
      items: [],
      page: 2,
      limit: 20,
      hasPreviousPage: true,
      hasNextPage: false,
      nextCursor: null,
      previousCursor: null,
    };

    adminMocks.getAuditLogPage.mockResolvedValue(page);

    const response = await adminRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/admin/audit-log?page=2&limit=20&sortBy=resource&direction=asc&search=usuario&role=admin&result=success&resource=users"
      )
    );

    await expect(response.json()).resolves.toEqual({ data: page });
    expect(response.status).toBe(200);
    expect(adminMocks.getAuditLogPage).toHaveBeenCalledWith(
      {
        page: 2,
        limit: 20,
        offset: 20,
        sortBy: "resource",
        direction: "asc",
        search: "usuario",
      },
      {
        role: "admin",
        result: "success",
        resource: "users",
      }
    );
    expect(adminMocks.getAuditLog).not.toHaveBeenCalled();
  });

  it("rechaza filtros del audit log fuera de whitelist", async () => {
    const response = await adminRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/admin/audit-log?page=1&result=success%27%20OR%201%3D1"
      )
    );

    await expect(response.json()).resolves.toEqual({
      error: "El resultado elegido no esta permitido para este listado.",
    });
    expect(response.status).toBe(400);
    expect(adminMocks.getAuditLogPage).not.toHaveBeenCalled();
  });

  it("rechaza ids de usuario invalidos antes del RPC admin", async () => {
    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({
          id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76' OR 1=1 --",
          role: "admin",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "Falta el usuario a actualizar.",
    });
    expect(response.status).toBe(400);
    expect(adminMocks.updateAdminUser).not.toHaveBeenCalled();
  });

  it("limita mutaciones admin abusivas", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    adminMocks.updateAdminUser.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      email: "user@example.com",
      firstName: "User",
      lastName: "Test",
      role: "user",
      isActive: true,
      createdAt: null,
      lastSignInAt: null,
    });

    let lastResponse: Response | null = null;

    for (let index = 0; index < 21; index += 1) {
      lastResponse = await adminRoute.fetch(
        new Request("https://mentirafc.vercel.app/api/admin/users", {
          method: "PUT",
          body: JSON.stringify({
            id: "11111111-1111-1111-1111-111111111111",
            role: "user",
          }),
        })
      );
    }

    expect(lastResponse?.status).toBe(429);
    await expect(lastResponse?.json()).resolves.toEqual({
      error: "Demasiadas acciones en poco tiempo. Intenta nuevamente mas tarde.",
    });

    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("mantiene exitoso footer-settings si falla solo el audit log posterior", async () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const savedSettings = {
      id: "footerSettings",
      contactEmail: "prensa@mentirafc.com",
      socials: [],
      links: [],
      sponsors: [],
      updatedAt: "2026-06-01T00:00:00.000Z",
    };

    adminMocks.saveFooterSettingsForAdmin.mockResolvedValue(savedSettings);
    adminMocks.recordAuditLog.mockRejectedValue({
      code: "42501",
      message: "permission denied for table audit_log",
    });

    const response = await adminRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/admin/footer-settings", {
        method: "PUT",
        body: JSON.stringify(savedSettings),
      })
    );

    await expect(response.json()).resolves.toEqual({ data: savedSettings });
    expect(response.status).toBe(200);
    expect(adminMocks.recordAuditLog).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "Admin footer audit log failed after Sanity save.",
      expect.objectContaining({ code: "42501" })
    );

    warnSpy.mockRestore();
  });
});
