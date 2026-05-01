import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import App from "./App";
import { createBootstrapErrorPayload } from "./data/getInitialData";

describe("App", () => {
  it("renderiza un fallback usable cuando falla el bootstrap inicial", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <App initialData={createBootstrapErrorPayload()} />
      </MemoryRouter>
    );

    expect(markup).toContain("No pudimos cargar la pagina");
    expect(markup).toContain("Volver a intentar");
  });
});
