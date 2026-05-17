import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext } from "../../context/AuthContext";
import Login from "./Login";

vi.mock("../../../data/auth", () => ({
  signInWithEmailPassword: vi.fn(),
  signUpWithEmailPassword: vi.fn(),
}));

const renderLogin = ({
  initialMode,
  authNotice = null,
}: {
  initialMode?: "signIn" | "signUp" | "resetPassword";
  authNotice?: "banned" | null;
} = {}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: null,
          user: null,
          isLoading: false,
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
});
