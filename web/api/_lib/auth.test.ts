import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import { getDashboardResourcePermission } from "../../shared/auth/permissions";
import {
  authorizeDashboardAction,
  authorizeDashboardRequest,
  authorizeDashboardUser,
} from "./auth";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: supabaseMocks.getUser,
    },
    from: supabaseMocks.from,
  })),
}));

const createAuthorizedRequest = () =>
  new Request("https://mentirafc.vercel.app/api/dashboard/news", {
    headers: {
      authorization: "Bearer access-token",
    },
  });

describe("dashboard API authorization", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    supabaseMocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
        },
      },
      error: null,
    });
    supabaseMocks.select.mockReturnValue({
      maybeSingle: supabaseMocks.maybeSingle,
    });
    supabaseMocks.from.mockReturnValue({
      select: supabaseMocks.select,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  it("autoriza una accion cuando la cuenta tiene el permiso especifico", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: "editor",
        is_active: true,
      },
      error: null,
    });

    const result = await authorizeDashboardAction(
      createAuthorizedRequest(),
      "news",
      "delete"
    );

    expect(result).toEqual({
      userId: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
      role: "editor",
    });
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    );
  });

  it("niega una accion aunque el usuario este autenticado si falta el permiso", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: "team_member",
        is_active: true,
      },
      error: null,
    });

    const result = await authorizeDashboardRequest(
      new Request("https://mentirafc.vercel.app/api/dashboard/news", {
        headers: {
          authorization: "Bearer access-token",
        },
        method: "DELETE",
      }),
      "news"
    );

    expect(result).toBeInstanceOf(Response);

    const response = result as Response;

    await expect(response.json()).resolves.toEqual({
      error: `No tenes permisos para realizar esta accion del dashboard (${getDashboardResourcePermission(
        "news",
        "delete"
      )}).`,
    });
    expect(response.status).toBe(403);
  });

  it("niega cuentas con roles desconocidos antes de autorizar permisos", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: "owner",
        is_active: true,
      },
      error: null,
    });

    const result = await authorizeDashboardUser(
      createAuthorizedRequest(),
      getDashboardResourcePermission("news", "view")
    );

    expect(result).toBeInstanceOf(Response);

    const response = result as Response;

    await expect(response.json()).resolves.toEqual({
      error: "No pudimos validar los permisos de la cuenta.",
    });
    expect(response.status).toBe(403);
  });

  it("niega cuentas inactivas aunque tengan permisos", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        role: "admin",
        is_active: false,
      },
      error: null,
    });

    const result = await authorizeDashboardUser(
      createAuthorizedRequest(),
      getDashboardResourcePermission("news", "view")
    );

    expect(result).toBeInstanceOf(Response);

    const response = result as Response;

    await expect(response.json()).resolves.toEqual({
      error: "Tu usuario ha sido baneado.",
    });
    expect(response.status).toBe(403);
  });
});
