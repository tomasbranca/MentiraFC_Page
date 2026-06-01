import { beforeEach, describe, expect, it, vi } from "vitest";

import adminRoute from "./[resource].js";

const adminMocks = vi.hoisted(() => ({
  authorizeAdminRequest: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  getAdminMetrics: vi.fn(),
  getAdminRoles: vi.fn(),
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
  createSupabaseAdminClient: adminMocks.createSupabaseAdminClient,
  getAdminMetrics: adminMocks.getAdminMetrics,
  getAdminRoles: adminMocks.getAdminRoles,
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
    vi.resetAllMocks();
    adminMocks.isAdminPermissionResource.mockImplementation((resource) =>
      adminResources.has(String(resource))
    );
    adminMocks.authorizeAdminRequest.mockResolvedValue({
      userId: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
      role: "admin",
    });
    adminMocks.mapAdminErrorToStatus.mockImplementation((error) => {
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
