import { describe, expect, it, vi, beforeEach } from "vitest";

const reactionMocks = vi.hoisted(() => ({
  ensureReactionTargetExists: vi.fn(),
  getReactionState: vi.fn(),
  removeReaction: vi.fn(),
  setReaction: vi.fn(),
}));

vi.mock("../_lib/reactions.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_lib/reactions")>();

  return {
    ...actual,
    ensureReactionTargetExists: reactionMocks.ensureReactionTargetExists,
    getReactionState: reactionMocks.getReactionState,
    removeReaction: reactionMocks.removeReaction,
    setReaction: reactionMocks.setReaction,
  };
});

const { default: reactionsRoute } = await import("./index.js");

describe("reactions api handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactionMocks.ensureReactionTargetExists.mockResolvedValue(true);
    reactionMocks.getReactionState.mockResolvedValue({
      targetType: "news",
      targetId: "news-1",
      counts: [{ emoji: "💜", count: 2 }],
      currentUserReaction: null,
    });
    reactionMocks.setReaction.mockResolvedValue({
      targetType: "news",
      targetId: "news-1",
      counts: [{ emoji: "🔥", count: 1 }],
      currentUserReaction: "🔥",
    });
    reactionMocks.removeReaction.mockResolvedValue({
      targetType: "news",
      targetId: "news-1",
      counts: [],
      currentUserReaction: null,
    });
  });

  it("devuelve conteos sin sesion", async () => {
    const response = await reactionsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/reactions?targetType=news&targetId=news-1"
      )
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        targetType: "news",
        targetId: "news-1",
        counts: [{ emoji: "💜", count: 2 }],
        currentUserReaction: null,
      },
    });
    expect(response.status).toBe(200);
    expect(reactionMocks.getReactionState).toHaveBeenCalledWith(
      {
        targetType: "news",
        targetId: "news-1",
      },
      null
    );
  });

  it("bloquea escrituras sin sesion", async () => {
    const response = await reactionsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/reactions", {
        method: "POST",
        body: JSON.stringify({
          targetType: "news",
          targetId: "news-1",
          emoji: "🔥",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "No autorizado.",
    });
    expect(response.status).toBe(401);
  });

  it("rechaza emojis invalidos", async () => {
    const response = await reactionsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/reactions", {
        method: "POST",
        headers: {
          authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          targetType: "news",
          targetId: "news-1",
          emoji: "vamos",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "La reaccion debe ser un unico emoji valido.",
    });
    expect(response.status).toBe(400);
  });

  it("devuelve 404 cuando la entidad no existe o no esta publicada", async () => {
    reactionMocks.ensureReactionTargetExists.mockResolvedValue(false);

    const response = await reactionsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/reactions", {
        method: "POST",
        headers: {
          authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          targetType: "news",
          targetId: "news-missing",
          emoji: "🔥",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "La entidad no existe o no esta publicada.",
    });
    expect(response.status).toBe(404);
  });

  it("cambia o crea la reaccion del usuario", async () => {
    const response = await reactionsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/reactions", {
        method: "POST",
        headers: {
          authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          targetType: "news",
          targetId: "news-1",
          emoji: "🔥",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        targetType: "news",
        targetId: "news-1",
        counts: [{ emoji: "🔥", count: 1 }],
        currentUserReaction: "🔥",
      },
    });
    expect(reactionMocks.setReaction).toHaveBeenCalledWith(
      {
        targetType: "news",
        targetId: "news-1",
      },
      "🔥",
      "access-token"
    );
  });

  it("usa la misma API para reacciones de jugadores", async () => {
    reactionMocks.setReaction.mockResolvedValueOnce({
      targetType: "player",
      targetId: "players-1",
      counts: [{ emoji: "💜", count: 1 }],
      currentUserReaction: "💜",
    });

    const response = await reactionsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/reactions", {
        method: "POST",
        headers: {
          authorization: "Bearer access-token",
        },
        body: JSON.stringify({
          targetType: "player",
          targetId: "players-1",
          emoji: "💜",
        }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        targetType: "player",
        targetId: "players-1",
        counts: [{ emoji: "💜", count: 1 }],
        currentUserReaction: "💜",
      },
    });
    expect(reactionMocks.setReaction).toHaveBeenCalledWith(
      {
        targetType: "player",
        targetId: "players-1",
      },
      "💜",
      "access-token"
    );
  });

  it("quita la reaccion del usuario", async () => {
    const response = await reactionsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/reactions?targetType=news&targetId=news-1",
        {
          method: "DELETE",
          headers: {
            authorization: "Bearer access-token",
          },
        }
      )
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        targetType: "news",
        targetId: "news-1",
        counts: [],
        currentUserReaction: null,
      },
    });
    expect(reactionMocks.removeReaction).toHaveBeenCalledWith(
      {
        targetType: "news",
        targetId: "news-1",
      },
      "access-token"
    );
  });
});
