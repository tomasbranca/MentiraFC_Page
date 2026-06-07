import { describe, expect, it } from "vitest";

import {
  createCanonicalTableId,
  dashboardTableByIdQuery,
  dashboardTableDuplicatesByTournamentQuery,
  dashboardTableListQuery,
  dashboardTableOptionsQuery,
  isParticipantActiveForMatchday,
  parseDashboardTableDraftInput,
  parseDashboardTableInput,
} from "./table.js";

describe("dashboard table api input", () => {
  it("acepta datos validos para publicar tabla actual", () => {
    expect(
      parseDashboardTableInput({
        tournamentId: "tournament-1",
        matchdayNumber: "4",
        label: "Fecha 4",
        snapshotDate: "2026-05-20T20:00:00.000Z",
        rows: [
          {
            key: "team-1",
            teamId: "team-1",
            wins: "2",
            draws: 1,
            losses: 0,
            goalsFor: "8",
            goalsAgainst: 3,
          },
        ],
      })
    ).toEqual({
      tournamentId: "tournament-1",
      matchdayNumber: 4,
      label: "Fecha 4",
      snapshotDate: "2026-05-20T20:00:00.000Z",
      rows: [
        {
          key: "team-1",
          teamId: "team-1",
          wins: 2,
          draws: 1,
          losses: 0,
          goalsFor: 8,
          goalsAgainst: 3,
        },
      ],
    });
  });

  it("acepta borradores incompletos sin exigir filas publicables", () => {
    expect(
      parseDashboardTableDraftInput({
        tournamentId: "",
        matchdayNumber: "",
        label: "Pendiente",
        snapshotDate: "",
        rows: [
          {
            key: "empty-row",
            teamId: "",
            wins: "",
          },
        ],
      })
    ).toEqual({
      tournamentId: "",
      matchdayNumber: undefined,
      label: "Pendiente",
      snapshotDate: undefined,
      rows: [
        {
          key: "empty-row",
          teamId: "",
          wins: undefined,
          draws: undefined,
          losses: undefined,
          goalsFor: undefined,
          goalsAgainst: undefined,
        },
      ],
    });
  });

  it("rechaza publicaciones con equipos repetidos", () => {
    expect(
      parseDashboardTableInput({
        tournamentId: "tournament-1",
        matchdayNumber: 1,
        snapshotDate: "2026-05-20T20:00:00.000Z",
        rows: [
          {
            teamId: "team-1",
            wins: 1,
            draws: 0,
            losses: 0,
            goalsFor: 2,
            goalsAgainst: 0,
          },
          {
            teamId: "team-1",
            wins: 0,
            draws: 1,
            losses: 0,
            goalsFor: 1,
            goalsAgainst: 1,
          },
        ],
      })
    ).toBeNull();
  });

  it("calcula participantes activos con la misma ventana que la funcion interna", () => {
    expect(
      isParticipantActiveForMatchday(
        {
          status: "active",
          activeFromMatchday: 2,
          activeUntilMatchday: null,
        },
        1
      )
    ).toBe(false);
    expect(
      isParticipantActiveForMatchday(
        {
          status: "withdrawn",
          activeFromMatchday: null,
          activeUntilMatchday: 4,
        },
        4
      )
    ).toBe(true);
  });

  it("usa un id deterministico para la tabla editable por torneo", () => {
    expect(createCanonicalTableId("tournament-1")).toBe(
      "standings-state-tournament-1"
    );
    expect(createCanonicalTableId(" torneo con espacios ")).toBe(
      "standings-state-torneo-con-espacios"
    );
  });

  it("consulta standingsState y deja snapshots fuera del CRUD", () => {
    expect(dashboardTableListQuery).toContain('*[_type == "standingsState"]');
    expect(dashboardTableByIdQuery).toContain("_id == $draftId");
    expect(dashboardTableOptionsQuery).toContain('"participants"');
    expect(dashboardTableOptionsQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
    expect(dashboardTableDuplicatesByTournamentQuery).toContain(
      'tournament._ref == $tournamentId'
    );
    expect(dashboardTableDuplicatesByTournamentQuery).toContain(
      '!(_id in [$id, $draftId])'
    );
    expect(dashboardTableListQuery).not.toContain("standingsSnapshots");
  });
});
