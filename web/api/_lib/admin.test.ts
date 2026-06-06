import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import {
  getAuditLogPage,
  getAdminUsersPage,
  getAdminRoles,
  listAdminUsers,
  mapAdminErrorToStatus,
  recordAuditLog,
  updateAdminUser,
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

  it("pagina usuarios admin con Auth Admin sin cargar el listado legacy completo", async () => {
    const users = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        email: "uno@mentirafc.com",
        created_at: "2026-06-03T00:00:00.000Z",
        last_sign_in_at: "2026-06-03T01:00:00.000Z",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        email: "dos@mentirafc.com",
        created_at: "2026-06-02T00:00:00.000Z",
        last_sign_in_at: null,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        email: "tres@mentirafc.com",
        created_at: "2026-06-01T00:00:00.000Z",
        last_sign_in_at: null,
      },
    ];

    supabaseMocks.listUsers.mockResolvedValue({
      data: { users },
      error: null,
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: [
        {
          id: users[0].id,
          first_name: "Uno",
          last_name: "Admin",
          role: "admin",
          is_active: true,
        },
        {
          id: users[1].id,
          first_name: "Dos",
          last_name: "Editor",
          role: "editor",
          is_active: false,
        },
      ],
      error: null,
    });

    await expect(
      getAdminUsersPage({
        page: 2,
        limit: 2,
        offset: 2,
        sortBy: "createdAt",
        direction: "desc",
        search: null,
      })
    ).resolves.toEqual({
      items: [
        {
          id: users[0].id,
          email: "uno@mentirafc.com",
          firstName: "Uno",
          lastName: "Admin",
          role: "admin",
          isActive: true,
          createdAt: "2026-06-03T00:00:00.000Z",
          lastSignInAt: "2026-06-03T01:00:00.000Z",
        },
        {
          id: users[1].id,
          email: "dos@mentirafc.com",
          firstName: "Dos",
          lastName: "Editor",
          role: "editor",
          isActive: false,
          createdAt: "2026-06-02T00:00:00.000Z",
          lastSignInAt: null,
        },
      ],
      page: 2,
      limit: 2,
      hasPreviousPage: true,
      hasNextPage: true,
      nextCursor: null,
      previousCursor: null,
    });
    expect(supabaseMocks.listUsers).toHaveBeenCalledWith({
      page: 2,
      perPage: 3,
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith(
      "admin_get_user_profiles_and_accounts",
      { p_user_ids: [users[0].id, users[1].id] }
    );
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

  it("no filtra mensajes internos en errores admin inesperados", () => {
    expect(
      mapAdminErrorToStatus(new Error("permission denied for table private.audit_log"))
    ).toEqual({
      message: "No pudimos procesar la solicitud admin.",
      status: 500,
    });
  });

  it("bloquea auto-elevacion de rol antes de mutar la cuenta", async () => {
    const actorId = "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76";

    supabaseMocks.rpc.mockResolvedValueOnce({
      data: [
        {
          user_id: actorId,
          role: "user",
          is_active: true,
        },
      ],
      error: null,
    });

    await expect(
      updateAdminUser({
        actor: {
          userId: actorId,
          role: "editor",
        },
        targetUserId: actorId,
        role: "admin",
      })
    ).rejects.toThrow("Role assignment is not allowed.");

    expect(supabaseMocks.rpc).toHaveBeenCalledTimes(1);
    expect(supabaseMocks.rpc).not.toHaveBeenCalledWith(
      "admin_update_user",
      expect.anything()
    );
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

  it("pagina audit log con el RPC existente y limite acotado", async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: [
        {
          id: "audit-1",
          actor_user_id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
          actor_role: "admin",
          action: "admin.users.update",
          resource: "users",
          target_id: "target-1",
          changes: { role: "editor" },
          result: "success",
          created_at: "2026-06-04T00:00:00.000Z",
        },
        {
          id: "audit-2",
          actor_user_id: "9c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
          actor_role: "editor",
          action: "admin.flags.update",
          resource: "feature-flags",
          target_id: "flag-1",
          changes: null,
          result: "success",
          created_at: "2026-06-03T00:00:00.000Z",
        },
        {
          id: "audit-3",
          actor_user_id: "7c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
          actor_role: "admin",
          action: "admin.roles.update",
          resource: "roles",
          target_id: "role-1",
          changes: null,
          result: "failure",
          created_at: "2026-06-02T00:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      getAuditLogPage(
        {
          page: 1,
          limit: 2,
          offset: 0,
          sortBy: "createdAt",
          direction: "desc",
          search: null,
        },
        { role: "admin", result: "success" }
      )
    ).resolves.toEqual({
      items: [
        {
          id: "audit-1",
          actorUserId: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
          actorRole: "admin",
          action: "admin.users.update",
          resource: "users",
          targetId: "target-1",
          changes: { role: "editor" },
          result: "success",
          createdAt: "2026-06-04T00:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 2,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      nextCursor: null,
      previousCursor: null,
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("admin_get_audit_log", {
      p_limit: 500,
    });
  });
});
