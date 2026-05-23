import { describe, expect, it } from "vitest";

import {
  buildDashboardTournamentDraftInput,
  buildDashboardTournamentMutationInput,
  getTournamentReferenceCount,
  validateDashboardTournamentInput,
} from "./dashboardTournaments.utils";

describe("dashboard tournaments utils", () => {
  it("valida campos requeridos y participantes publicables", () => {
    expect(
      validateDashboardTournamentInput({
        name: "",
        organizationId: "",
        active: false,
        primaryPrizeSlots: "",
        secondaryPrizeSlots: "-1",
        participants: [],
      })
    ).toMatchObject({
      name: "Escribi el nombre del torneo.",
      organizationId: "Elegi el organizador.",
      primaryPrizeSlots: "Carga un numero valido.",
      secondaryPrizeSlots: "Carga un numero valido.",
      participants: "Carga al menos un participante.",
    });
  });

  it("normaliza payloads para publicar y guardar borrador", () => {
    const values = {
      name: " Apertura ",
      organizationId: " organization-1 ",
      active: true,
      primaryPrizeSlots: "1",
      secondaryPrizeSlots: "4",
      participants: [
        {
          key: "row-1",
          teamId: " team-1 ",
          status: "active" as const,
          activeFromMatchday: "",
          activeUntilMatchday: "8",
          notes: " Invitado ",
        },
      ],
    };

    expect(buildDashboardTournamentMutationInput(values)).toEqual({
      name: "Apertura",
      organizationId: "organization-1",
      active: true,
      primaryPrizeSlots: 1,
      secondaryPrizeSlots: 4,
      participants: [
        {
          key: "row-1",
          teamId: "team-1",
          status: "active",
          activeFromMatchday: undefined,
          activeUntilMatchday: 8,
          notes: "Invitado",
        },
      ],
    });
    expect(
      buildDashboardTournamentDraftInput({
        ...values,
        primaryPrizeSlots: "",
        participants: [{ ...values.participants[0], teamId: "" }],
      })
    ).toMatchObject({
      name: "Apertura",
      organizationId: "organization-1",
      primaryPrizeSlots: undefined,
      participants: [
        {
          key: "row-1",
          teamId: undefined,
        },
      ],
    });
  });

  it("cuenta referencias vinculadas para bloquear borrado inseguro", () => {
    expect(
      getTournamentReferenceCount({
        matches: 2,
        tables: 1,
        snapshots: 3,
      })
    ).toBe(6);
  });
});
