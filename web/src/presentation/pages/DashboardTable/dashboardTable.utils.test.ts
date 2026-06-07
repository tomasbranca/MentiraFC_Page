import { describe, expect, it } from "vitest";

import {
  buildDashboardTableDraftInput,
  buildDashboardTableMutationInput,
  getActiveTournamentParticipants,
  validateDashboardTableInput,
} from "./dashboardTable.utils";

describe("dashboard table utils", () => {
  it("valida campos requeridos y filas publicables", () => {
    expect(
      validateDashboardTableInput({
        tournamentId: "",
        matchdayNumber: "0",
        label: "",
        snapshotDate: "",
        rows: [],
      })
    ).toMatchObject({
      tournamentId: "Elegi el torneo.",
      matchdayNumber: "Carga un numero de fecha valido.",
      snapshotDate: "Elegi una fecha de actualizacion valida.",
      rows: "Carga al menos un equipo.",
    });
  });

  it("normaliza payloads para publicar y guardar borrador", () => {
    const values = {
      tournamentId: " tournament-1 ",
      matchdayNumber: "3",
      label: " Fecha 3 ",
      snapshotDate: "2026-05-20T20:00:00.000Z",
      rows: [
        {
          key: "row-1",
          teamId: " team-1 ",
          wins: "2",
          draws: "1",
          losses: "0",
          goalsFor: "6",
          goalsAgainst: "2",
        },
      ],
    };

    expect(buildDashboardTableMutationInput(values)).toEqual({
      tournamentId: "tournament-1",
      matchdayNumber: 3,
      label: "Fecha 3",
      snapshotDate: "2026-05-20T20:00:00.000Z",
      rows: [
        {
          key: "row-1",
          teamId: "team-1",
          wins: 2,
          draws: 1,
          losses: 0,
          goalsFor: 6,
          goalsAgainst: 2,
        },
      ],
    });
    expect(
      buildDashboardTableDraftInput({
        ...values,
        matchdayNumber: "",
        rows: [{ ...values.rows[0], wins: "" }],
      })
    ).toMatchObject({
      tournamentId: "tournament-1",
      matchdayNumber: undefined,
      rows: [
        {
          key: "row-1",
          teamId: "team-1",
          wins: undefined,
        },
      ],
    });
  });

  it("no permite publicar una fecha menor que la tabla actual", () => {
    expect(
      validateDashboardTableInput(
        {
          tournamentId: "tournament-1",
          matchdayNumber: "12",
          label: "Fecha 12",
          snapshotDate: "2026-05-20T20:00:00.000Z",
          rows: [
            {
              key: "row-1",
              teamId: "team-1",
              wins: "1",
              draws: "0",
              losses: "0",
              goalsFor: "2",
              goalsAgainst: "0",
            },
          ],
        },
        { minimumMatchdayNumber: 13 }
      ).matchdayNumber
    ).toBe("La fecha no puede ser menor que 13.");
  });

  it("filtra participantes activos por fecha", () => {
    expect(
      getActiveTournamentParticipants(
        {
          id: "tournament-1",
          name: "Apertura",
          participants: [
            {
              id: "team-1",
              name: "Activo",
              status: "active",
              activeFromMatchday: null,
              activeUntilMatchday: null,
            },
            {
              id: "team-2",
              name: "Futuro",
              status: "active",
              activeFromMatchday: 4,
              activeUntilMatchday: null,
            },
            {
              id: "main",
              name: "Mentira FC",
              isMain: true,
            },
          ],
        },
        "3"
      ).map((participant) => participant.id)
    ).toEqual(["team-1"]);
  });
});
