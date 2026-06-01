import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import {
  getAdminRoles,
  listAdminUsers,
  mapAdminErrorToStatus,
  recordAuditLog,
} from "./admin";

const supabaseMocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  rpc: vi.fn(),
  schema: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: supabaseMocks.listUsers,
      },
    },
    rpc: supabaseMocks.rpc,
    schema: supabaseMocks.schema,
  })),
}));

describe("admin api data helpers", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("lista usuarios via RPC publica sin consultar el schema private por PostgREST", async () => {
    const userId = "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76";

    supabaseMocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: userId,
            email: "admin@mentirafc.com",
            created_at: "2026-05-31T00:00:00.000Z",
            last_sign_in_at: "2026-05-31T01:00:00.000Z",
          },
        ],
      },
      error: null,
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: [
        {
          id: userId,
          first_name: "Tomas",
          last_name: "Brancatisano",
          role: "admin",
          is_active: true,
        },
      ],
      error: null,
    });

    await expect(listAdminUsers()).resolves.toEqual([
      {
        id: userId,
        email: "admin@mentirafc.com",
        firstName: "Tomas",
        lastName: "Brancatisano",
        role: "admin",
        isActive: true,
        createdAt: "2026-05-31T00:00:00.000Z",
        lastSignInAt: "2026-05-31T01:00:00.000Z",
      },
    ]);
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );
    expect(supabaseMocks.rpc).toHaveBeenCalledWith(
      "admin_get_user_profiles_and_accounts",
      { p_user_ids: [userId] }
    );
    expect(supabaseMocks.schema).not.toHaveBeenCalled();
  });

  it("propaga errores RPC PGRST106 para que el router los traduzca", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST106",
        message: "Invalid schema: private",
      },
    });

    await expect(getAdminRoles()).rejects.toMatchObject({
      code: "PGRST106",
    });
  });

  it("mapea errores de schema/grants a un 500 accionable", () => {
    expect(
      mapAdminErrorToStatus({
        code: "PGRST106",
        message: "Invalid schema: private",
      })
    ).toEqual({
      message: "La configuracion admin de Supabase no esta lista.",
      status: 500,
    });
    expect(
      mapAdminErrorToStatus({
        code: "42501",
        message: "permission denied for table profiles",
      })
    ).toEqual({
      message: "La configuracion admin de Supabase no esta lista.",
      status: 500,
    });
  });

  it("registra audit log mediante RPC service-role-only", async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: null, error: null });

    await recordAuditLog(
      { rpc: supabaseMocks.rpc } as never,
      {
        actor: {
          userId: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
          role: "admin",
        },
        action: "admin.test",
        resource: "tests",
        targetId: "target-1",
        changes: { ok: true },
      }
    );

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("admin_record_audit_log", {
      p_actor_user_id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
      p_actor_role: "admin",
      p_action: "admin.test",
      p_resource: "tests",
      p_target_id: "target-1",
      p_changes: { ok: true },
      p_result: "success",
    });
  });
});
