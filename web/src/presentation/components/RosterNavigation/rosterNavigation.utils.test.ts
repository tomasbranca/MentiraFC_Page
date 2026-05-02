import { describe, expect, it } from "vitest";

import type { Player, StaffMember } from "../../../types/models";
import {
  buildPlayerRosterNavigationItems,
  buildRosterNavigationItems,
  buildStaffRosterNavigationItems,
} from "./rosterNavigation.utils";

const createPlayer = (overrides: Partial<Player>): Player => ({
  id: overrides.id ?? "player-1",
  name: overrides.name ?? "Tomas",
  lastName: overrides.lastName ?? "Garcia",
  fullName:
    overrides.fullName ??
    `${overrides.name ?? "Tomas"} ${overrides.lastName ?? "Garcia"}`,
  ...overrides,
});

const createStaffMember = (
  overrides: Partial<StaffMember>
): StaffMember => ({
  id: overrides.id ?? "staff-1",
  name: overrides.name ?? "Juan",
  lastName: overrides.lastName ?? "Perez",
  fullName:
    overrides.fullName ??
    `${overrides.name ?? "Juan"} ${overrides.lastName ?? "Perez"}`,
  role: overrides.role ?? "Director tecnico",
  ...overrides,
});

describe("rosterNavigation.utils", () => {
  it("ordena jugadores por posicion y numero, y marca el jugador activo", () => {
    const activePlayer = createPlayer({
      id: "arq-1",
      name: "Mateo",
      lastName: "Clemente",
      position: "arq",
      number: 1,
      slug: "mateo-clemente",
    });
    const items = buildPlayerRosterNavigationItems(
      [
        createPlayer({ id: "del-9", position: "del", number: 9 }),
        createPlayer({ id: "med-8", position: "med", number: 8 }),
        createPlayer({ id: "def-4", position: "def", number: 4 }),
        activePlayer,
      ],
      activePlayer
    );

    expect(items.map((item) => item.id)).toEqual([
      "player:arq-1",
      "player:def-4",
      "player:med-8",
      "player:del-9",
    ]);
    expect(items[0]).toMatchObject({
      href: "/plantel/mateo-clemente",
      eyebrow: "ARQ",
      kind: "player",
      label: "Mateo Clemente",
      isActive: true,
    });
  });

  it("manda las posiciones desconocidas al final", () => {
    const items = buildPlayerRosterNavigationItems(
      [
        createPlayer({ id: "utility", position: "utility", number: 2 }),
        createPlayer({ id: "arq-1", position: "arq", number: 1 }),
      ],
      null
    );

    expect(items.map((item) => item.id)).toEqual([
      "player:arq-1",
      "player:utility",
    ]);
    expect(items[1].eyebrow).toBe("INT");
  });

  it("ordena staff por apellido y genera rutas de staff", () => {
    const activeStaffMember = createStaffMember({
      id: "staff-a",
      name: "Martin",
      lastName: "Alvarez",
      slug: "martin-alvarez",
      role: "Preparador fisico",
    });
    const items = buildStaffRosterNavigationItems(
      [
        createStaffMember({ id: "staff-z", lastName: "Zarate" }),
        activeStaffMember,
      ],
      activeStaffMember
    );

    expect(items.map((item) => item.id)).toEqual([
      "staff:staff-a",
      "staff:staff-z",
    ]);
    expect(items[0]).toMatchObject({
      href: "/plantel/staff/martin-alvarez",
      eyebrow: "PREPARADOR FISICO",
      kind: "staff",
      label: "Martin Alvarez",
      isActive: true,
    });
  });

  it("combina jugadores y staff para navegar todo el plantel", () => {
    const player = createPlayer({ id: "arq-1", position: "arq", number: 1 });
    const staffMember = createStaffMember({
      id: "staff-1",
      lastName: "Lopez",
      role: "Kinesiologo",
    });
    const items = buildRosterNavigationItems({
      activePlayer: player,
      players: [player],
      staffMembers: [staffMember],
    });

    expect(items.map((item) => item.kind)).toEqual(["player", "staff"]);
    expect(items.map((item) => item.id)).toEqual([
      "player:arq-1",
      "staff:staff-1",
    ]);
  });
});
