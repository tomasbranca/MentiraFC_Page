import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../context/AuthContext";
import Login from "./Login";

vi.mock("../../../data/auth", () => ({
  requestPasswordResetEmail: vi.fn(),
  signInWithEmailPassword: vi.fn(),
  signUpWithEmailPassword: vi.fn(),
  updateAuthPassword: vi.fn(),
}));

const renderLogin = ({
  initialMode,
  authNotice = null,
  user = null,
  isLoading = false,
}: {
  initialMode?: "signIn" | "signUp" | "resetPassword" | "updatePassword";
  authNotice?: "banned" | null;
  user?: User | null;
  isLoading?: boolean;
} = {}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: user ? ({ user } as never) : null,
          user,
          isLoading,
          account: null,
          isAccountLoading: false,
          accountError: null,
          authNotice,
          signOut: async () => undefined,
          clearAuthNotice: () => undefined,
          refreshAccount: async () => undefined,
        }}
      >
        <Login initialMode={initialMode} />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe("Login", () => {
  it("renderiza el estado inicial de ingreso con accesos secundarios", () => {
    const markup = renderLogin();

    expect(markup).toContain("Acceso institucional");
    expect(markup).toContain("Bienvenido de nuevo");
    expect(markup).toContain("Ingresar");
    expect(markup).toContain("Crear cuenta");
    expect(markup).toContain("Recordarme");
    expect(markup).toContain("¿Olvidaste tu contraseña?");
    expect(markup).toContain("Correo electrónico");
    expect(markup).toContain("Contraseña");
    expect(markup).toContain("Volver al sitio");
  });

  it("incluye nombre y apellido al crear una cuenta", () => {
    const markup = renderLogin({ initialMode: "signUp" });

    expect(markup).toContain("Nombre");
    expect(markup).toContain("Apellido");
    expect(markup).toContain('autoComplete="given-name"');
    expect(markup).toContain('autoComplete="family-name"');
  });

  it("muestra el mensaje de usuario baneado", () => {
    const markup = renderLogin({ authNotice: "banned" });

    expect(markup).toContain("Tu usuario ha sido baneado.");
  });

  it("renderiza la pantalla para solicitar recuperación por email", () => {
    const markup = renderLogin({ initialMode: "resetPassword" });

    expect(markup).toContain("Recuperar acceso");
    expect(markup).toContain("Enviar enlace");
    expect(markup).toContain("Correo electrónico");
    expect(markup).not.toContain("Recordarme");
  });

  it("renderiza un estado seguro si falta la sesión de recuperación", () => {
    const markup = renderLogin({ initialMode: "updatePassword" });

    expect(markup).toContain("Nueva contraseña");
    expect(markup).toContain("Establecer contraseña");
    expect(markup).toContain("El enlace de recuperación no es válido o expiró.");
    expect(markup).toContain("Solicitá uno nuevo");
  });
});
