import { describe, expect, it } from "vitest";

import {
  adaptSingleGallery,
  adaptSingleGalleryListItem,
} from "./galleries.adapter";

const createSanityGallery = (overrides: Record<string, unknown> = {}) => ({
  _id: "gallery-1",
  slug: { current: "mentira-rival-2026" },
  game: {
    _id: "game-1",
    date: "2026-04-18T20:00:00Z",
    state: "finalizado",
    competition: "Torneo",
    tournament: {
      _id: "tournament-1",
      name: "Apertura 2026",
      organization: {
        name: "Liga Castrol",
      },
    },
    result: {
      goalsFor: 3,
      goalsAgainst: 1,
    },
    rival: {
      _id: "team-1",
      name: "Rival FC",
    },
    events: [],
    playedPlayers: [],
  },
  photos: [
    {
      _key: "photo-1",
      alt: "Primera foto",
      isHero: false,
      imageUrl: "https://cdn.sanity.io/images/project/dataset/photo-1.jpg",
      dimensions: {
        width: 1200,
        height: 800,
        aspectRatio: 1.5,
      },
    },
    {
      _key: "photo-2",
      alt: "Foto hero",
      isHero: true,
      imageUrl: "https://cdn.sanity.io/images/project/dataset/photo-2.jpg",
    },
  ],
  ...overrides,
});

describe("galleries.adapter", () => {
  it("adapta una galeria con partido, fotos y hero marcada", () => {
    const gallery = adaptSingleGallery(createSanityGallery());

    expect(gallery?.slug).toBe("mentira-rival-2026");
    expect(gallery?.date).toBe("2026-04-18T20:00:00Z");
    expect(gallery?.photoCount).toBe(2);
    expect(gallery?.heroImage.id).toBe("photo-2");
    expect(gallery?.game.rival.name).toBe("Rival FC");
  });

  it("usa la primera foto como hero si no hay una marcada", () => {
    const gallery = adaptSingleGallery(
      createSanityGallery({
        photos: [
          {
            _key: "photo-1",
            alt: "Primera foto",
            imageUrl: "https://cdn.sanity.io/images/project/dataset/photo-1.jpg",
          },
        ],
      })
    );

    expect(gallery?.heroImage.id).toBe("photo-1");
  });

  it("adapta el modelo resumido sin fotos completas ni arrays pesados del partido", () => {
    const listItem = adaptSingleGalleryListItem(
      createSanityGallery({
        game: {
          _id: "game-1",
          date: "2026-04-18T20:00:00Z",
          state: "finalizado",
          competition: "Torneo",
          result: {
            goalsFor: 3,
            goalsAgainst: 1,
          },
          rival: {
            _id: "team-1",
            name: "Rival FC",
          },
        },
        photoCount: 12,
        photos: [
          {
            _key: "photo-1",
            alt: "Portada",
            imageUrl: "https://cdn.sanity.io/images/project/dataset/photo-1.jpg",
          },
        ],
      })
    );

    expect(listItem).toMatchObject({
      id: "gallery-1",
      photoCount: 12,
      game: {
        id: "game-1",
        rival: {
          name: "Rival FC",
        },
      },
    });
    expect("images" in (listItem ?? {})).toBe(false);
    expect("events" in (listItem?.game ?? {})).toBe(false);
    expect("playedPlayers" in (listItem?.game ?? {})).toBe(false);
  });

  it("no descarta galerias cuando el partido tiene goles sin jugador del plantel", () => {
    const gallery = adaptSingleGallery(
      createSanityGallery({
        game: {
          ...createSanityGallery().game,
          events: [
            {
              _id: "event-guest",
              type: "goal",
              scorerKind: "guest",
              guestName: "Invitado",
              player: null,
            },
            {
              _id: "event-own-goal",
              type: "goal",
              scorerKind: "opponent_own_goal",
              player: null,
            },
          ],
        },
      })
    );

    expect(gallery?.game.events).toMatchObject([
      {
        id: "event-guest",
        scorerKind: "guest",
        guestName: "Invitado",
        player: null,
      },
      {
        id: "event-own-goal",
        scorerKind: "opponent_own_goal",
        player: null,
      },
    ]);
  });

  it("descarta galerias sin fotos validas", () => {
    expect(adaptSingleGallery(createSanityGallery({ photos: [] }))).toBeNull();
  });
});
