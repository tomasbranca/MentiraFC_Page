import { describe, expect, it } from "vitest";

import {
  DEFERRED_HOME_STALE_TIME,
  getDeferredHomeQueryBehavior,
  hasCompleteDeferredHomeData,
  resolveHomeData,
} from "./useHomeData.utils";
import type { InitialDataPayload } from "../../../../data/getInitialData";

const createInitialData = (
  overrides: Partial<InitialDataPayload> = {}
): InitialDataPayload => ({
  bootstrapScope: "home-critical",
  news: [
    { id: "news-old", title: "Vieja", date: "2025-01-01", slug: "vieja" },
    { id: "news-new", title: "Nueva", date: "2025-02-01", slug: "nueva" },
  ],
  players: [{ id: "p-1", fullName: "Ana Gomez", name: "Ana", lastName: "Gomez" }],
  staff: [],
  games: [
    {
      id: "g-1",
      date: "2025-02-15",
      state: "finalizado",
      tournamentId: "t-1",
      rival: { id: "r-1", name: "Rival 1" },
      result: { goalsFor: 1, goalsAgainst: 0 },
      playedPlayers: [],
      events: [
        {
          id: "e-1",
          type: "goal",
          player: { id: "p-1", name: "Ana", lastName: "Gomez" },
        },
      ],
    },
  ],
  goalEvents: [
    {
      id: "e-1",
      type: "goal",
      game: { id: "g-1", date: "2025-02-15" },
      player: { id: "p-1", name: "Ana", lastName: "Gomez" },
    },
  ],
  tournament: {
    id: "t-1",
    name: "Torneo 1",
    mainTeam: { id: "main", name: "Mentira FC", isMain: true },
    standings: [
      {
        team: { id: "r-1", name: "Rival 1" },
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      },
    ],
  },
  teams: [{ id: "main", name: "Mentira FC", isMain: true }],
  tournamentGames: [
    {
      id: "tg-1",
      date: "2025-02-15",
      state: "finalizado",
      tournamentId: "t-1",
      rival: { id: "r-1", name: "Rival 1" },
      result: { goalsFor: 1, goalsAgainst: 0 },
      playedPlayers: [],
      events: [
        {
          id: "te-1",
          type: "goal",
          player: { id: "p-1", name: "Ana", lastName: "Gomez" },
        },
      ],
    },
  ],
  latestGame: null,
  ...overrides,
} as InitialDataPayload);

describe("useHomeData.utils", () => {
  it("detecta cuando la cache diferida de Home esta incompleta", () => {
    const partialCache = {
      players: [],
      goalEvents: [],
    };

    expect(hasCompleteDeferredHomeData(partialCache)).toBe(false);
    expect(getDeferredHomeQueryBehavior(partialCache)).toEqual({
      hasCompleteData: false,
      staleTime: 0,
      refetchOnMount: "always",
    });
  });

  it("mantiene la cache completa como reutilizable sin refetch forzado", () => {
    const completeCache = {
      players: [],
      goalEvents: [],
      tournament: null,
      tournamentGames: [],
    };

    expect(hasCompleteDeferredHomeData(completeCache)).toBe(true);
    expect(getDeferredHomeQueryBehavior(completeCache)).toEqual({
      hasCompleteData: true,
      staleTime: DEFERRED_HOME_STALE_TIME,
      refetchOnMount: true,
    });
  });

  it("ignora datos diferidos parciales y usa el payload actual hasta tener el bloque completo", () => {
    const initialData = createInitialData();
    const partialDeferredData = {
      players: [{ id: "p-2", fullName: "Belen Ruiz", name: "Belen", lastName: "Ruiz" }],
      goalEvents: [],
    };

    const resolvedData = resolveHomeData(initialData, null, 2025);

    expect(partialDeferredData.players[0].id).toBe("p-2");
    expect(resolvedData.news.map((item) => item.id)).toEqual([
      "news-new",
      "news-old",
    ]);
    expect(resolvedData.topScorers[0]).toMatchObject({
      id: "p-1",
      goals: 1,
    });
    expect(resolvedData.tournament?.id).toBe("t-1");
  });

  it("usa el bloque diferido completo cuando ya esta disponible", () => {
    const initialData = createInitialData();
    const deferredData = {
      players: [{ id: "p-2", fullName: "Belen Ruiz", name: "Belen", lastName: "Ruiz" }],
      goalEvents: [
        {
          id: "e-2",
          type: "goal",
          game: { id: "g-2", date: "2025-03-20" },
          player: { id: "p-2", name: "Belen", lastName: "Ruiz" },
        },
      ],
      games: [
        {
          id: "g-2",
          date: "2025-03-20",
          state: "finalizado",
          tournamentId: "t-2",
          rival: { id: "r-2", name: "Rival 2" },
          result: { goalsFor: 2, goalsAgainst: 0 },
          playedPlayers: [],
          events: [
            {
              id: "e-2",
              type: "goal",
              player: { id: "p-2", name: "Belen", lastName: "Ruiz" },
            },
          ],
        },
      ],
      tournament: {
        id: "t-2",
        name: "Torneo 2",
        mainTeam: { id: "main", name: "Mentira FC", isMain: true },
        standings: [
          {
            team: { id: "r-2", name: "Rival 2" },
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
          },
        ],
      },
      tournamentGames: [
        {
          id: "tg-2",
          date: "2025-03-20",
          state: "finalizado",
          tournamentId: "t-2",
          rival: { id: "r-2", name: "Rival 2" },
          result: { goalsFor: 2, goalsAgainst: 0 },
          playedPlayers: [],
          events: [
            {
              id: "te-2",
              type: "goal",
              player: { id: "p-2", name: "Belen", lastName: "Ruiz" },
            },
          ],
        },
      ],
    };

    const resolvedData = resolveHomeData(initialData, deferredData, 2025);

    expect(resolvedData.topScorers[0]).toMatchObject({
      id: "p-2",
      goals: 1,
    });
    expect(resolvedData.tournament?.id).toBe("t-2");
  });
});
