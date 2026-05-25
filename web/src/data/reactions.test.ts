import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getCurrentAccessToken: vi.fn(),
  getCurrentAuthSession: vi.fn(),
}));

vi.mock("./auth", () => ({
  getCurrentAccessToken: authMocks.getCurrentAccessToken,
  getCurrentAuthSession: authMocks.getCurrentAuthSession,
}));

import {
  fetchReactionState,
  removeReaction,
  setReaction,
} from "./reactions";

describe("reactions data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getCurrentAccessToken.mockResolvedValue("access-token");
    authMocks.getCurrentAuthSession.mockResolvedValue({
      session: {
        access_token: "optional-token",
      },
      error: null,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              targetType: "news",
              targetId: "news-1",
              counts: [{ emoji: "💜", count: 2 }],
              currentUserReaction: "💜",
            },
          }),
          {
            headers: {
              "content-type": "application/json",
            },
          }
        )
      )
    );
  });

  it("parsea el estado de reacciones", async () => {
    await expect(
      fetchReactionState({
        targetType: "news",
        targetId: "news-1",
      })
    ).resolves.toEqual({
      targetType: "news",
      targetId: "news-1",
      counts: [{ emoji: "💜", count: 2 }],
      currentUserReaction: "💜",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/reactions?targetType=news&targetId=news-1",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it("envia el emoji con sesion requerida", async () => {
    await setReaction(
      {
        targetType: "news",
        targetId: "news-1",
      },
      "🔥"
    );

    expect(authMocks.getCurrentAccessToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "/api/reactions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          targetType: "news",
          targetId: "news-1",
          emoji: "🔥",
        }),
      })
    );
  });

  it("quita la reaccion con sesion requerida", async () => {
    await removeReaction({
      targetType: "news",
      targetId: "news-1",
    });

    expect(authMocks.getCurrentAccessToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "/api/reactions?targetType=news&targetId=news-1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("propaga errores de la API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "No autorizado.",
        }),
        {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    await expect(
      fetchReactionState({
        targetType: "news",
        targetId: "news-1",
      })
    ).rejects.toThrow("No autorizado.");
  });
});
