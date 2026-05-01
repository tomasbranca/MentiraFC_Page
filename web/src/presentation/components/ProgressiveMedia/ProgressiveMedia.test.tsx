import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ProgressiveMedia from "./ProgressiveMedia";
import { getProgressiveMediaWrapperClassName } from "./ProgressiveMedia.utils";

describe("ProgressiveMedia", () => {
  it("renderiza un placeholder inicial y mantiene reservada la imagen", () => {
    const markup = renderToStaticMarkup(
      <ProgressiveMedia
        src="https://example.com/player.jpg"
        alt="Jugador"
        width={420}
        height={560}
        className="media"
        skeletonClassName="media-skeleton"
      />
    );

    expect(markup).toContain('data-loaded="false"');
    expect(markup).toContain("media-skeleton");
    expect(markup).toContain('width="420"');
    expect(markup).toContain('height="560"');
    expect(markup).toContain("opacity-0");
  });

  it("no fuerza relative cuando el wrapper necesita posicion absoluta", () => {
    expect(getProgressiveMediaWrapperClassName("absolute inset-0 z-10")).toBe(
      "overflow-hidden absolute inset-0 z-10"
    );
  });
});
