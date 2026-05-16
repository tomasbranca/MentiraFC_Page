import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

import { AuthContext } from "../../context/AuthContext";
import { GameContext } from "../../context/GameContext";
import NavBar from "./NavBar";

vi.mock("../../../utils/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

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
}: {
  user: User | null;
  isLoading?: boolean;
}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: null,
          user,
          isLoading,
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
    const markup = renderNavBar({ user: createUser() });

    expect(markup).toContain("Tomas");
    expect(markup).toContain("Cerrar sesión");
    expect(markup).not.toContain("INGRESAR");
  });
});
