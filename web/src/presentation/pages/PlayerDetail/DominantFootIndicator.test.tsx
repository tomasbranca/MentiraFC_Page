import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DominantFootIndicator } from "./DominantFootIndicator";

describe("DominantFootIndicator", () => {
  it("marca como mas solido el pie habil", () => {
    const markup = renderToStaticMarkup(
      <DominantFootIndicator dominantFoot="right" />
    );

    expect(markup).toContain("Pierna habil: derecha");
    expect(markup).toContain("opacity-100");
    expect(markup).toContain("opacity-35");
    expect(markup).toContain("scale-x-[-1]");
    expect(markup).not.toContain("rounded-full");
    expect(markup).not.toContain("border");
  });

  it("no muestra indicador cuando la pierna habil todavia no fue cargada", () => {
    expect(renderToStaticMarkup(<DominantFootIndicator />)).toBe("");
  });
});
