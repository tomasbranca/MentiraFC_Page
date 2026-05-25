import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const reactionHookMocks = vi.hoisted(() => ({
  useReactionState: vi.fn(),
  useRemoveReaction: vi.fn(),
  useSetReaction: vi.fn(),
}));

vi.mock("../../context/useAuth", () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock("../../hooks/queries/useReactionState", () => ({
  useReactionState: reactionHookMocks.useReactionState,
  useRemoveReaction: reactionHookMocks.useRemoveReaction,
  useSetReaction: reactionHookMocks.useSetReaction,
}));

import EmojiReactionBar from "./EmojiReactionBar";

const renderReactionBar = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <EmojiReactionBar
        source="EmojiReactionBarTest"
        target={{
          targetType: "news",
          targetId: "news-1",
        }}
      />
    </MemoryRouter>
  );

describe("EmojiReactionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      user: {
        id: "user-1",
      },
      isLoading: false,
    });
    reactionHookMocks.useReactionState.mockReturnValue({
      data: {
        targetType: "news",
        targetId: "news-1",
        counts: [
          { emoji: "💜", count: 3 },
          { emoji: "🔥", count: 1 },
        ],
        currentUserReaction: "💜",
      },
      isLoading: false,
      isError: false,
    });
    reactionHookMocks.useSetReaction.mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: vi.fn(),
    });
    reactionHookMocks.useRemoveReaction.mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: vi.fn(),
    });
  });

  it("renderiza conteos y marca la reaccion activa", () => {
    const markup = renderReactionBar();

    expect(markup).toContain("💜");
    expect(markup).toContain("🔥");
    expect(markup).toContain(">3</button>");
    expect(markup).toContain(">1</button>");
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-label="Cambiar reaccion"');
  });

  it("mantiene sobria la vista deslogueada sin CTA permanente", () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });
    reactionHookMocks.useReactionState.mockReturnValue({
      data: {
        targetType: "news",
        targetId: "news-1",
        counts: [
          { emoji: "💜", count: 3 },
          { emoji: "🔥", count: 1 },
        ],
        currentUserReaction: null,
      },
      isLoading: false,
      isError: false,
    });

    const markup = renderReactionBar();

    expect(markup).not.toContain("Ingresa");
    expect(markup).toContain('aria-label="Agregar reaccion"');
  });
});
