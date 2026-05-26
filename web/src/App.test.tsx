import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import App from "./App";
import { createBootstrapErrorPayload } from "./data/getInitialData";
import { AuthContext } from "./presentation/context/AuthContext";

describe("App", () => {
  it("renderiza un fallback usable cuando falla el bootstrap inicial", () => {
    const queryClient = new QueryClient();
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider
            value={{
              session: null,
              user: null,
              isLoading: false,
              account: null,
              isAccountLoading: false,
              accountError: null,
              authNotice: null,
              signOut: async () => undefined,
              clearAuthNotice: () => undefined,
              refreshAccount: async () => undefined,
            }}
          >
            <App initialData={createBootstrapErrorPayload()} />
          </AuthContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(markup).toContain("No pudimos cargar la pagina");
    expect(markup).toContain("Volver a intentar");
  });
});
