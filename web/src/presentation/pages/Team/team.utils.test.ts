import { describe, expect, it } from "vitest";

import type { Player, StaffMember } from "../../../types/models";
import { getFilteredSections, groupTeamMembers } from "./team.utils";

const createPlayer = (overrides: Partial<Player>): Player => ({
  id: overrides.id ?? "player-1",
  name: "Tomas",
  lastName: "Garcia",
  fullName: "Tomas Garcia",
  ...overrides,
});

const createStaffMember = (
  overrides: Partial<StaffMember>
): StaffMember => ({
  id: overrides.id ?? "staff-1",
  name: "Juan",
  lastName: "Perez",
  fullName: "Juan Perez",
  role: "Director tecnico",
  ...overrides,
});

describe("team.utils", () => {
  it("agrupa jugadores por posicion y deja staff en su propia seccion final", () => {
    const grouped = groupTeamMembers(
      [
        createPlayer({ id: "del-9", position: "del", number: 9 }),
        createPlayer({ id: "del-7", position: "del", number: 7 }),
        createPlayer({ id: "arq-1", position: "arq", number: 1 }),
      ],
      [
        createStaffMember({ id: "staff-b", lastName: "Zarate" }),
        createStaffMember({ id: "staff-a", lastName: "Alvarez" }),
      ]
    );

    expect(Object.keys(grouped)).toEqual(["arq", "def", "med", "del", "staff"]);
    expect(grouped.del.map((player) => player.id)).toEqual(["del-7", "del-9"]);
    expect(grouped.staff.map((staffMember) => staffMember.id)).toEqual([
      "staff-a",
      "staff-b",
    ]);
  });

  it("filtra la seccion de staff sin mezclarla con jugadores", () => {
    const grouped = groupTeamMembers([], [createStaffMember({ id: "staff-1" })]);

    expect(getFilteredSections(grouped, "staff")).toEqual({
      staff: grouped.staff,
    });
  });
});
