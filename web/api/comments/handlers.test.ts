import { beforeEach, describe, expect, it, vi } from "vitest";

const commentMocks = vi.hoisted(() => ({
  ensureNewsExists: vi.fn(),
  listNewsComments: vi.fn(),
  createNewsComment: vi.fn(),
  updateOwnNewsComment: vi.fn(),
  deleteOwnNewsComment: vi.fn(),
  deleteNewsCommentAsModerator: vi.fn(),
  createCommentReport: vi.fn(),
  listCommentModeration: vi.fn(),
  updateCommentReportStatus: vi.fn(),
}));

vi.mock("../_lib/comments.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_lib/comments")>();

  return {
    ...actual,
    ensureNewsExists: commentMocks.ensureNewsExists,
    listNewsComments: commentMocks.listNewsComments,
    createNewsComment: commentMocks.createNewsComment,
    updateOwnNewsComment: commentMocks.updateOwnNewsComment,
    deleteOwnNewsComment: commentMocks.deleteOwnNewsComment,
    deleteNewsCommentAsModerator: commentMocks.deleteNewsCommentAsModerator,
    createCommentReport: commentMocks.createCommentReport,
    listCommentModeration: commentMocks.listCommentModeration,
    updateCommentReportStatus: commentMocks.updateCommentReportStatus,
  };
});

const { default: commentsRoute } = await import("./index.js");

const sampleComment = {
  id: "comment-1",
  newsId: "news-1",
  body: "Gran nota",
  createdAt: "2026-05-25T12:00:00.000Z",
  updatedAt: "2026-05-25T12:00:00.000Z",
  editedAt: null,
  author: {
    id: "11111111-1111-1111-1111-111111111111",
    firstName: "Tomas",
    lastName: "Perez",
  },
  canEdit: true,
  canDelete: true,
  canModerateDelete: false,
};

describe("comments api handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    commentMocks.ensureNewsExists.mockResolvedValue(true);
    commentMocks.listNewsComments.mockResolvedValue({
      items: [sampleComment],
      nextCursor: null,
      sort: "newest",
    });
    commentMocks.createNewsComment.mockResolvedValue(sampleComment);
    commentMocks.updateOwnNewsComment.mockResolvedValue({
      ...sampleComment,
      body: "Editado",
    });
    commentMocks.deleteOwnNewsComment.mockResolvedValue(undefined);
    commentMocks.deleteNewsCommentAsModerator.mockResolvedValue(undefined);
    commentMocks.createCommentReport.mockResolvedValue({ id: "report-1" });
    commentMocks.listCommentModeration.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    commentMocks.updateCommentReportStatus.mockResolvedValue(undefined);
  });

  it("lista comentarios de una noticia", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments?newsId=news-1")
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        items: [sampleComment],
        nextCursor: null,
        sort: "newest",
      },
    });
  });

  it("rechaza crear comentario sin token", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: "news-1", body: "Hola" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("crea comentario autenticado", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newsId: "news-1", body: "Hola" }),
      })
    );

    expect(response.status).toBe(201);
    expect(commentMocks.createNewsComment).toHaveBeenCalled();
  });

  it("actualiza comentario propio", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments/comment-1", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: "Editado" }),
      })
    );

    expect(response.status).toBe(200);
    expect(commentMocks.updateOwnNewsComment).toHaveBeenCalled();
  });

  it("borra comentario como moderador", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments/comment-1?as=moderator",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer token" },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.deleteNewsCommentAsModerator).toHaveBeenCalled();
  });

  it("crea reporte de comentario", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments/comment-1/report", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "spam" }),
      })
    );

    expect(response.status).toBe(201);
    expect(commentMocks.createCommentReport).toHaveBeenCalled();
  });

  it("lista cola de moderacion", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments/moderation", {
        headers: { Authorization: "Bearer token" },
      })
    );

    expect(response.status).toBe(200);
    expect(commentMocks.listCommentModeration).toHaveBeenCalled();
  });

  it("actualiza estado de reporte", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments/reports/report-1",
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "dismissed" }),
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.updateCommentReportStatus).toHaveBeenCalled();
  });
});
