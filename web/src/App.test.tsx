import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import App from "./App";
import { createBootstrapErrorPayload } from "./data/getInitialData";
import { AuthContext } from "./presentation/context/AuthContext";

describe("App", () => {
  it("renderiza un fallback usable cuando falla el bootstrap inicial", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            session: null,
            user: null,
            isLoading: false,
          }}
        >
          <App initialData={createBootstrapErrorPayload()} />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(markup).toContain("No pudimos cargar la pagina");
    expect(markup).toContain("Volver a intentar");
  });
});
