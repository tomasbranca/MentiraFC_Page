import { describe, expect, it } from "vitest";

import type { GalleryImage, GalleryItem, Game } from "../../types/models";
import {
  buildGalleryMatchTitle,
  getGalleryImageDownloadFilename,
  getGalleryImageDownloadUrl,
  getGalleryImageLayout,
  sortGalleriesByDate,
} from "./gallery.utils";

const game: Game = {
  id: "game-1",
  date: "2026-04-18T20:00:00Z",
  state: "finalizado",
  competition: "Torneo",
  tournament: "Apertura 2026",
  rival: {
    id: "team-1",
    name: "Rival FC",
  },
  result: {
    goalsFor: 2,
    goalsAgainst: 0,
  },
  events: [],
  playedPlayers: [],
};

const image: GalleryImage = {
  id: "image-1",
  imageUrl: "https://cdn.sanity.io/images/project/dataset/image-1.jpg",
  alt: "Mentira FC festejando",
  originalFilename: "Festejo Mentira FC.JPG",
};

const gallery: GalleryItem = {
  id: "gallery-1",
  slug: "apertura-mentira-rival",
  date: game.date,
  game,
  heroImage: image,
  images: [image],
  photoCount: 1,
};

describe("gallery.utils", () => {
  it("arma el titulo desde torneo, Mentira FC, goles y rival", () => {
    expect(buildGalleryMatchTitle(game)).toBe(
      "Apertura 2026 - Mentira FC 2 - Rival FC 0"
    );
  });

  it("no inventa resultado si el partido no tiene marcador", () => {
    expect(buildGalleryMatchTitle({ ...game, result: null })).toBe(
      "Apertura 2026 - Mentira FC vs Rival FC"
    );
  });

  it("ordena galerias de mas reciente a mas vieja", () => {
    const older = {
      ...gallery,
      id: "older",
      date: "2026-01-01T20:00:00Z",
    };
    const newer = {
      ...gallery,
      id: "newer",
      date: "2026-05-01T20:00:00Z",
    };

    expect(sortGalleriesByDate([older, newer]).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("elige layouts segun la proporcion de cada imagen", () => {
    expect(
      getGalleryImageLayout(
        { ...image, dimensions: { width: 1800, height: 700 } },
        1
      )
    ).toBe("panorama");
    expect(
      getGalleryImageLayout(
        { ...image, dimensions: { width: 700, height: 1200 } },
        1
      )
    ).toBe("portrait");
  });

  it("construye URLs y nombres de descarga", () => {
    expect(getGalleryImageDownloadFilename(gallery, image, 0)).toBe(
      "festejo-mentira-fc.jpg"
    );
    expect(getGalleryImageDownloadUrl(gallery, image, 0)).toContain(
      "dl=festejo-mentira-fc.jpg"
    );
  });
});
