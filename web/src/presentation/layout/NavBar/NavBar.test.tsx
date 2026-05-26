import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";

import { AuthContext } from "../../context/AuthContext";
import { GameContext } from "../../context/GameContext";
import NavBar from "./NavBar";

const createUser = (): User =>
  ({
    id: "user-1",
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-05-16T00:00:00.000Z",
    user_metadata: {
      first_name: "Tomas",
    },
  }) as User;

const renderNavBar = ({
  user,
  isLoading = false,
  account = null,
  isAccountLoading = false,
}: {
  user: User | null;
  isLoading?: boolean;
  account?: {
    id: string;
    firstName: string;
    lastName: string;
    role: "user" | "editor" | "admin";
    isActive: true;
  } | null;
  isAccountLoading?: boolean;
}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: null,
          user,
          isLoading,
          account,
          isAccountLoading,
          accountError: null,
          authNotice: null,
          signOut: async () => undefined,
          clearAuthNotice: () => undefined,
          refreshAccount: async () => undefined,
        }}
      >
        <GameContext.Provider
          value={{
            game: null,
            loading: false,
            error: null,
            refetch: async () => undefined,
          }}
        >
          <NavBar />
        </GameContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe("NavBar", () => {
  it("muestra ingresar cuando no hay sesion", () => {
    const markup = renderNavBar({ user: null });

    expect(markup).toContain("INGRESAR");
  });

  it("muestra placeholder mientras auth esta cargando", () => {
    const markup = renderNavBar({ user: null, isLoading: true });

    expect(markup).toContain("account-placeholder");
    expect(markup).toContain("mobile-account-placeholder");
  });

  it("muestra el nombre de la cuenta autenticada", () => {
    const markup = renderNavBar({
      user: createUser(),
      account: {
        id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
        firstName: "Tomas",
        lastName: "Brancatisano",
        role: "user",
        isActive: true,
      },
    });

    expect(markup).toContain("Tomas");
    expect(markup).toContain("Mi cuenta");
    expect(markup).toContain("Cerrar sesión");
    expect(markup).toContain("mobile-account-name");
    expect(markup).not.toContain("INGRESAR");
  });

  it("muestra accesos futuros solo para los roles correspondientes", () => {
    const editorMarkup = renderNavBar({
      user: createUser(),
      account: {
        id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
        firstName: "Tomas",
        lastName: "Brancatisano",
        role: "editor",
        isActive: true,
      },
    });
    const adminMarkup = renderNavBar({
      user: createUser(),
      account: {
        id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
        firstName: "Tomas",
        lastName: "Brancatisano",
        role: "admin",
        isActive: true,
      },
    });

    expect(editorMarkup).toContain("Dashboard");
    expect(editorMarkup).not.toContain("Panel admin");
    expect(adminMarkup).toContain("Dashboard");
    expect(adminMarkup).toContain("Panel admin");
    expect(adminMarkup).toContain('href="/admin"');
  });
});
