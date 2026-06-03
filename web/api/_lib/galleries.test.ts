import { describe, expect, it } from "vitest";

import {
  dashboardGalleryByIdQuery,
  dashboardGalleryListQuery,
  dashboardGalleryOptionsQuery,
  getDashboardGalleriesPageQuery,
  parseDashboardGalleryDraftFormData,
  parseDashboardGalleryDraftInput,
  parseDashboardGalleryFormData,
  parseDashboardGalleryInput,
  validateDashboardGalleryImageFile,
} from "./galleries.js";
import {
  DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES as DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_GALLERY_IMAGE_MAX_BYTES as DASHBOARD_GALLERY_IMAGE_MAX_BYTES_FOR_API,
} from "./galleryImage.js";
import {
  DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES as DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_GALLERY_IMAGE_MAX_BYTES as DASHBOARD_GALLERY_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";

const validPhoto = {
  key: "photo-1",
  imageAssetId: "image-asset-1",
  alt: "Mentira FC atacando",
  caption: "",
  isHero: true,
};

describe("dashboard galleries api input", () => {
  it("acepta datos validos para publicar una galeria", () => {
    expect(
      parseDashboardGalleryInput({
        gameId: "games-1",
        slug: "galeria-rival-fc",
        photos: [validPhoto],
      })
    ).toEqual({
      gameId: "games-1",
      slug: "galeria-rival-fc",
      photos: [validPhoto],
    });
  });

  it("rechaza publicaciones sin hero unico", () => {
    expect(
      parseDashboardGalleryInput({
        gameId: "games-1",
        slug: "galeria-rival-fc",
        photos: [
          { ...validPhoto, key: "photo-1", isHero: true },
          { ...validPhoto, key: "photo-2", isHero: true },
        ],
      })
    ).toBeNull();
  });

  it("parsea FormData con fotos nuevas", () => {
    const formData = new FormData();
    const file = new File(["image"], "foto.webp", { type: "image/webp" });

    formData.set("gameId", "games-1");
    formData.set("slug", "galeria-rival-fc");
    formData.set(
      "photos",
      JSON.stringify([{ ...validPhoto, imageAssetId: "", uploadKey: "new-1" }])
    );
    formData.set("photoImage:new-1", file, file.name);

    expect(parseDashboardGalleryFormData(formData)).toMatchObject({
      gameId: "games-1",
      slug: "galeria-rival-fc",
      photoImageFiles: {
        "new-1": file,
      },
    });
  });

  it("acepta borradores incompletos", () => {
    expect(
      parseDashboardGalleryDraftInput({
        gameId: "",
        slug: "",
        photos: [],
      })
    ).toEqual({
      gameId: "",
      slug: "",
      photos: [],
    });

    const formData = new FormData();
    formData.set("photos", JSON.stringify([]));

    expect(parseDashboardGalleryDraftFormData(formData)).toMatchObject({
      gameId: "",
      slug: "",
      photos: [],
    });
  });

  it("mantiene alineadas las restricciones de fotos entre API y dashboard", () => {
    expect(DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_GALLERY_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_GALLERY_IMAGE_MAX_BYTES_FOR_UI
    );
    expect(
      validateDashboardGalleryImageFile(
        new File(["image"], "foto.gif", { type: "image/gif" })
      )
    ).toBe("La foto debe ser JPG, PNG o WebP.");
  });

  it("consulta publicados, borradores y partidos finalizados", () => {
    expect(dashboardGalleryListQuery).toContain('*[_type == "galleries"]');
    expect(dashboardGalleryByIdQuery).toContain("_id == $draftId");
    expect(dashboardGalleryOptionsQuery).toContain('state == "finalizado"');
    expect(dashboardGalleryOptionsQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
  });

  it("consulta paginas de galerias con filtros parametrizados y resumen liviano", () => {
    const pageQuery = getDashboardGalleriesPageQuery("date", "desc");

    expect(pageQuery).toContain("$offset...$end");
    expect(pageQuery).toContain("$hasSearch");
    expect(pageQuery).toContain("$hasStatus");
    expect(pageQuery).toContain("$hasPhotos");
    expect(pageQuery).toContain('"photoCount": count(photos[defined(image.asset)])');
    expect(pageQuery).toContain("photos[isHero == true");
    expect(pageQuery).not.toContain('"photos": photos[]');
  });
});
