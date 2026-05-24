import { describe, expect, it } from "vitest";

import { adaptGoalEvents } from "./events.adapter";

describe("events.adapter", () => {
  it("preserva eventos de gol aunque no tengan jugador del plantel", () => {
    const events = adaptGoalEvents([
      {
        _id: "event-1",
        type: "goal",
        order: 1,
        scorerKind: null,
        game: { _id: "game-1", date: "2026-05-16T21:30:00.000Z" },
        player: {
          _id: "player-1",
          name: "Tomas",
          lastName: "Garcia",
        },
      },
      {
        _id: "event-2",
        type: "goal",
        order: 2,
        scorerKind: "guest",
        guestName: " Invitado ",
        game: { _id: "game-1", date: "2026-05-16T21:30:00.000Z" },
        player: null,
      },
      {
        _id: "event-3",
        type: "goal",
        order: 3,
        scorerKind: "opponent_own_goal",
        game: { _id: "game-1", date: "2026-05-16T21:30:00.000Z" },
        player: null,
      },
      {
        _id: "event-4",
        type: "goal",
        order: null,
        scorerSource: "guest",
        guestName: "Invitado legado",
        game: null,
        player: null,
      },
    ]);

    expect(events).toHaveLength(4);
    expect(events).toMatchObject([
      {
        id: "event-1",
        scorerKind: "roster",
        player: { id: "player-1" },
      },
      {
        id: "event-2",
        scorerKind: "guest",
        guestName: "Invitado",
        player: null,
      },
      {
        id: "event-3",
        scorerKind: "opponent_own_goal",
        player: null,
      },
      {
        id: "event-4",
        order: undefined,
        scorerKind: "guest",
        game: null,
        player: null,
      },
    ]);
  });
});
