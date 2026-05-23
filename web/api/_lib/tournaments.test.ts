import { describe, expect, it } from "vitest";

import {
  dashboardTournamentActiveSiblingsQuery,
  dashboardTournamentListQuery,
  dashboardTournamentOptionsQuery,
  dashboardTournamentReferenceUsageQuery,
  parseDashboardTournamentDraftInput,
  parseDashboardTournamentInput,
} from "./tournaments.js";

describe("dashboard tournaments api input", () => {
  it("acepta datos validos para publicar un torneo", () => {
    expect(
      parseDashboardTournamentInput({
        name: "Apertura",
        organizationId: "organization-1",
        active: true,
        primaryPrizeSlots: "1",
        secondaryPrizeSlots: 4,
        participants: [
          {
            key: "team-1",
            teamId: "team-1",
            status: "active",
            activeFromMatchday: "",
            activeUntilMatchday: "",
            notes: "Invitado",
          },
        ],
      })
    ).toEqual({
      name: "Apertura",
      organizationId: "organization-1",
      active: true,
      primaryPrizeSlots: 1,
      secondaryPrizeSlots: 4,
      participants: [
        {
          key: "team-1",
          teamId: "team-1",
          status: "active",
          activeFromMatchday: undefined,
          activeUntilMatchday: undefined,
          notes: "Invitado",
        },
      ],
    });
  });

  it("acepta borradores incompletos sin exigir participantes publicables", () => {
    expect(
      parseDashboardTournamentDraftInput({
        name: "",
        organizationId: "",
        active: false,
        primaryPrizeSlots: "",
        secondaryPrizeSlots: "",
        participants: [
          {
            key: "empty",
            teamId: "",
            status: "",
            activeFromMatchday: "",
            activeUntilMatchday: "",
          },
        ],
      })
    ).toEqual({
      name: "",
      organizationId: "",
      active: false,
      primaryPrizeSlots: undefined,
      secondaryPrizeSlots: undefined,
      participants: [
        {
          key: "empty",
          teamId: "",
          status: undefined,
          activeFromMatchday: undefined,
          activeUntilMatchday: undefined,
        },
      ],
    });
  });

  it("rechaza publicaciones con participantes repetidos o inactivos sin cierre", () => {
    expect(
      parseDashboardTournamentInput({
        name: "Apertura",
        organizationId: "organization-1",
        active: true,
        primaryPrizeSlots: 1,
        secondaryPrizeSlots: 4,
        participants: [
          {
            teamId: "team-1",
            status: "active",
          },
          {
            teamId: "team-1",
            status: "active",
          },
        ],
      })
    ).toBeNull();

    expect(
      parseDashboardTournamentInput({
        name: "Apertura",
        organizationId: "organization-1",
        active: true,
        primaryPrizeSlots: 1,
        secondaryPrizeSlots: 4,
        participants: [
          {
            teamId: "team-1",
            status: "withdrawn",
          },
        ],
      })
    ).toBeNull();
  });

  it("consulta tournaments con drafts y protege opciones y borrado", () => {
    expect(dashboardTournamentListQuery).toContain('*[_type == "tournaments"]');
    expect(dashboardTournamentOptionsQuery).toContain(
      '!(_id in path("drafts.**"))'
    );
    expect(dashboardTournamentReferenceUsageQuery).toContain(
      '_type == "standingsSnapshots"'
    );
    expect(dashboardTournamentActiveSiblingsQuery).toContain("active == true");
  });
});
