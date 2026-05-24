import { describe, expect, it } from "vitest";

import {
  dashboardPlayerByIdQuery,
  dashboardPlayerListQuery,
  dashboardPlayerReferenceUsageQuery,
  parseDashboardPlayerDraftFormData,
  parseDashboardPlayerDraftInput,
  parseDashboardPlayerActiveStatusInput,
  parseDashboardPlayerFormData,
  parseDashboardPlayerInput,
  validateDashboardPlayerImageFile,
} from "./players.js";
import {
  DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES as DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES_FOR_API,
  DASHBOARD_PLAYER_IMAGE_MAX_BYTES as DASHBOARD_PLAYER_IMAGE_MAX_BYTES_FOR_API,
} from "./playerImage.js";
import {
  DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES as DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES_FOR_UI,
  DASHBOARD_PLAYER_IMAGE_MAX_BYTES as DASHBOARD_PLAYER_IMAGE_MAX_BYTES_FOR_UI,
} from "../../src/types/dashboard";
import {
  buildDashboardPlayerReferenceCleanupMutations,
  buildDashboardPlayerSlug,
  filterDashboardPlayerReferences,
} from "./players/repository.js";

describe("dashboard players api input", () => {
  it("acepta datos validos y valoraciones para publicar un jugador", () => {
    expect(
      parseDashboardPlayerInput({
        name: "Tomas",
        lastName: "Mentira",
        number: "10",
        position: "del",
        dominantFoot: "right",
        birthDate: "2003-06-12",
        fieldRatings: {
          speed: "8",
          shooting: 9,
        },
      })
    ).toEqual({
      name: "Tomas",
      lastName: "Mentira",
      number: 10,
      position: "del",
      dominantFoot: "right",
      birthDate: "2003-06-12",
      fieldRatings: {
        speed: 8,
        shooting: 9,
      },
      goalkeeperRatings: undefined,
    });
  });

  it("parsea FormData con foto y genera slug desde nombre completo", () => {
    const formData = new FormData();
    const file = new File(["image"], "jugador.webp", { type: "image/webp" });

    formData.set("name", "Tomas");
    formData.set("lastName", "Nunez");
    formData.set("number", "7");
    formData.set("position", "med");
    formData.set("dominantFoot", "left");
    formData.set("birthDate", "2004-01-09");
    formData.set("fieldRatings", JSON.stringify({ passing: 9 }));
    formData.set("goalkeeperRatings", JSON.stringify({}));
    formData.set("photoImage", file, file.name);

    expect(parseDashboardPlayerFormData(formData)).toMatchObject({
      name: "Tomas",
      lastName: "Nunez",
      number: 7,
      photoImage: file,
      fieldRatings: { passing: 9 },
    });
    expect(
      buildDashboardPlayerSlug({
        id: "players-1",
        name: "Tomas",
        lastName: "Nunez",
      })
    ).toBe("tomas-nunez");
  });

  it("acepta borradores incompletos y foto removida", () => {
    expect(
      parseDashboardPlayerDraftInput({
        name: "",
        lastName: "",
        number: "",
        position: "",
        dominantFoot: "",
      })
    ).toEqual({
      name: "",
      lastName: "",
      number: undefined,
      position: undefined,
      dominantFoot: undefined,
      birthDate: undefined,
      fieldRatings: undefined,
      goalkeeperRatings: undefined,
    });

    const formData = new FormData();
    formData.set("removePhoto", "true");

    expect(parseDashboardPlayerDraftFormData(formData)).toMatchObject({
      name: "",
      lastName: "",
      removePhoto: true,
    });
  });

  it("mantiene alineadas las restricciones de foto entre API y dashboard", () => {
    expect(DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES_FOR_API).toEqual(
      DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES_FOR_UI
    );
    expect(DASHBOARD_PLAYER_IMAGE_MAX_BYTES_FOR_API).toBe(
      DASHBOARD_PLAYER_IMAGE_MAX_BYTES_FOR_UI
    );
    expect(
      validateDashboardPlayerImageFile(
        new File(["image"], "jugador.gif", { type: "image/gif" })
      )
    ).toBe("La foto debe ser JPG, PNG o WebP.");
  });

  it("consulta publicados, borradores y referencias relacionadas", () => {
    expect(dashboardPlayerListQuery).toContain('*[_type == "players"]');
    expect(dashboardPlayerByIdQuery).toContain("_id == $draftId");
    expect(dashboardPlayerReferenceUsageQuery).toContain('"games"');
    expect(dashboardPlayerReferenceUsageQuery).toContain("playedPlayers");
    expect(dashboardPlayerReferenceUsageQuery).toContain('"events"');
    expect(dashboardPlayerReferenceUsageQuery).toContain("player._ref");
  });

  it("quita referencias de partidos y eventos antes del borrado", () => {
    const idsToRemove = new Set(["player-1", "drafts.player-1"]);

    expect(
      filterDashboardPlayerReferences(
        [
          { _key: "one", _type: "reference", _ref: "player-1" },
          { _key: "two", _type: "reference", _ref: "player-2" },
        ],
        idsToRemove
      )
    ).toEqual([{ _key: "two", _type: "reference", _ref: "player-2" }]);
    expect(
      buildDashboardPlayerReferenceCleanupMutations(
        {
          games: [
            {
              id: "game-1",
              playedPlayers: [
                { _key: "one", _type: "reference", _ref: "player-1" },
              ],
            },
          ],
          events: [{ id: "event-1" }],
        },
        idsToRemove
      )
    ).toEqual([
      {
        patch: {
          id: "game-1",
          set: {
            playedPlayers: [],
          },
        },
      },
      {
        patch: {
          id: "event-1",
          unset: ["player"],
        },
      },
    ]);
  });
});

describe("dashboard player active status input", () => {
  it("parsea el estado activo desde JSON", () => {
    expect(parseDashboardPlayerActiveStatusInput({ isActive: false })).toBe(
      false
    );
    expect(parseDashboardPlayerActiveStatusInput({ isActive: true })).toBe(
      true
    );
    expect(parseDashboardPlayerActiveStatusInput({ isActive: "true" })).toBe(
      null
    );
  });

  it("incluye isActive en las queries del dashboard", () => {
    expect(dashboardPlayerListQuery).toContain("isActive");
    expect(dashboardPlayerByIdQuery).toContain("isActive");
  });
});
