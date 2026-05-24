import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DashboardContentLoader from "./DashboardContentLoader";

describe("DashboardContentLoader", () => {
  it("renderiza un estado de carga interno accesible", () => {
    const markup = renderToStaticMarkup(<DashboardContentLoader />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Cargando contenido");
  });
});
