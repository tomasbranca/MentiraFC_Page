import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";

import type { CurrentAccount } from "../../../types/auth";
import { AuthContext } from "../../context/AuthContext";
import Account from "./Account";

const baseAccount: CurrentAccount = {
  id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
  firstName: "Tomas",
  lastName: "Brancatisano",
  role: "editor",
  isActive: true,
};

type RenderAccountOptions = {
  account?: CurrentAccount | null;
  isAccountLoading?: boolean;
  accountError?: string | null;
  user?: User | null;
};

const renderAccount = ({
  account = baseAccount,
  isAccountLoading = false,
  accountError = null,
  user = {
    email: "tomas@mentirafc.com",
  } as User,
}: RenderAccountOptions = {}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: null,
          user,
          isLoading: false,
          account,
          isAccountLoading,
          accountError,
          authNotice: null,
          signOut: async () => undefined,
          clearAuthNotice: () => undefined,
          refreshAccount: async () => undefined,
        }}
      >
        <Account />
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe("Account", () => {
  it("muestra los datos principales de la cuenta", () => {
    const markup = renderAccount();

    expect(markup).toContain("Mi cuenta");
    expect(markup).toContain("Datos personales");
    expect(markup).toContain("Estado");
    expect(markup).toContain("Acciones disponibles");
    expect(markup).toContain("tomas@mentirafc.com");
    expect(markup).toContain("Editor");
    expect(markup).toContain("Activa");
    expect(markup).toContain("Entrar al dashboard");
    expect(markup).toContain("Cerrar sesión");
    expect(markup).not.toContain("Editar datos personales");
    expect(markup).toContain('value="Tomas"');
    expect(markup).toContain('value="Brancatisano"');
  });

  it("muestra un loading propio mientras carga la cuenta", () => {
    const markup = renderAccount({
      account: null,
      isAccountLoading: true,
    });

    expect(markup).toContain("Estamos cargando tus datos");
    expect(markup).toContain("Cargando datos de tu cuenta.");
  });

  it("muestra un error propio con accion de reintento", () => {
    const markup = renderAccount({
      account: null,
      accountError: "No pudimos cargar los datos de tu cuenta.",
    });

    expect(markup).toContain("No pudimos cargar tu cuenta");
    expect(markup).toContain("No pudimos cargar los datos de tu cuenta.");
    expect(markup).toContain("Reintentar");
  });

  it("no ofrece el dashboard para un usuario sin ese permiso", () => {
    const markup = renderAccount({
      account: {
        ...baseAccount,
        role: "user",
      },
    });

    expect(markup).toContain("Usuario");
    expect(markup).not.toContain("Entrar al dashboard");
    expect(markup).toContain("Cerrar sesión");
  });
});
