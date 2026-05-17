import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";

import { AuthContext } from "../../context/AuthContext";
import Account from "./Account";

const renderAccount = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          session: null,
          user: {
            email: "tomas@mentirafc.com",
          } as User,
          isLoading: false,
          account: {
            id: "8c2c2e11-31dc-4af2-86b0-ec8ad56a2c76",
            firstName: "Tomas",
            lastName: "Brancatisano",
            role: "editor",
            isActive: true,
          },
          isAccountLoading: false,
          accountError: null,
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
    expect(markup).toContain("tomas@mentirafc.com");
    expect(markup).toContain("Editor");
    expect(markup).toContain("Activo");
    expect(markup).toContain('value="Tomas"');
    expect(markup).toContain('value="Brancatisano"');
  });
});
