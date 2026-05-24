import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const resetPasswordForEmail = vi.fn();
  const updateUser = vi.fn();
  const client = {
    auth: {
      resetPasswordForEmail,
      updateUser,
    },
  };

  return {
    client,
    getSupabaseClient: vi.fn(),
    resetPasswordForEmail,
    updateUser,
  };
});

vi.mock("../lib/supabase", () => ({
  buildPasswordResetRedirectUrl: () =>
    "https://preview.mentira.vercel.app/nueva-contrasena",
  getSupabaseClient: mocks.getSupabaseClient,
}));

import {
  requestPasswordResetEmail,
  updateAuthPassword,
} from "./auth";

describe("auth data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseClient.mockReturnValue(mocks.client);
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
  });

  it("envía el reset de contraseña con redirect absoluto", async () => {
    const result = await requestPasswordResetEmail("socio@mentirafc.com");

    expect(result.error).toBeNull();
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "socio@mentirafc.com",
      {
        redirectTo: "https://preview.mentira.vercel.app/nueva-contrasena",
      }
    );
  });

  it("actualiza la contraseña del usuario autenticado por el enlace", async () => {
    const result = await updateAuthPassword("Mentira123");

    expect(result.error).toBeNull();
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password: "Mentira123",
    });
  });

  it("no intenta llamar a Supabase si el cliente no está configurado", async () => {
    mocks.getSupabaseClient.mockReturnValue(null);

    const result = await requestPasswordResetEmail("socio@mentirafc.com");

    expect(result.error).toBeInstanceOf(Error);
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
