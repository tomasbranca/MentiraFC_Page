import { describe, expect, it } from "vitest";

import {
  buildDashboardGalleryDraftMutationInput,
  buildDashboardGalleryItemApiPath,
  buildDashboardGalleryMutationInput,
  buildDashboardGalleryOptionsApiPath,
} from "./dashboardGalleries";

describe("dashboardGalleries client", () => {
  it("usa rutas query-param compatibles con Vercel", () => {
    expect(buildDashboardGalleryItemApiPath("galleries-1")).toBe(
      "/api/dashboard/galleries?id=galleries-1"
    );
    expect(buildDashboardGalleryItemApiPath("drafts.galleries/1")).toBe(
      "/api/dashboard/galleries?id=drafts.galleries%2F1"
    );
    expect(buildDashboardGalleryOptionsApiPath()).toBe(
      "/api/dashboard/galleries?options=1"
    );
  });

  it("normaliza fotos para FormData sin filtrar las nuevas subidas", () => {
    const file = new File(["image"], "foto.webp", { type: "image/webp" });
    const values = {
      gameId: "games-1",
      slug: "galeria-rival",
      photos: [
        {
          key: "photo-1",
          imageAssetId: "",
          imageUrl: "",
          uploadKey: "upload-1",
          alt: "Foto",
          caption: "",
          isHero: true,
          file,
        },
      ],
    };

    expect(buildDashboardGalleryMutationInput(values)).toMatchObject({
      gameId: "games-1",
      slug: "galeria-rival",
      photos: [
        {
          key: "photo-1",
          uploadKey: "upload-1",
          alt: "Foto",
          isHero: true,
        },
      ],
      photoImageFiles: {
        "upload-1": file,
      },
    });
    expect(buildDashboardGalleryDraftMutationInput(values)).toMatchObject({
      gameId: "games-1",
      slug: "galeria-rival",
    });
  });
});
