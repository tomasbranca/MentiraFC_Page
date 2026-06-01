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
  id: "22222222-2222-2222-2222-222222222222",
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
    commentMocks.createCommentReport.mockResolvedValue({
      id: "44444444-4444-4444-4444-444444444444",
    });
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
      new Request("https://mentirafc.vercel.app/api/comments/22222222-2222-2222-2222-222222222222", {
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

  it("rechaza ids de comentario invalidos antes de consultar", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments/'%20OR%201=1%20--", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: "Editado" }),
      })
    );

    await expect(response.json()).resolves.toEqual({
      error: "Falta un comentario valido.",
    });
    expect(response.status).toBe(400);
    expect(commentMocks.updateOwnNewsComment).not.toHaveBeenCalled();
  });

  it("actualiza comentario propio desde la ruta base con query params", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments?commentId=22222222-2222-2222-2222-222222222222",
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: "Editado" }),
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.updateOwnNewsComment).toHaveBeenCalledWith({
      commentId: "22222222-2222-2222-2222-222222222222",
      body: "Editado",
      token: "token",
    });
  });

  it("borra comentario como moderador", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments/22222222-2222-2222-2222-222222222222?as=moderator",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer token" },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.deleteNewsCommentAsModerator).toHaveBeenCalled();
  });

  it("borra comentario como moderador desde la ruta base con query params", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments?commentId=22222222-2222-2222-2222-222222222222&as=moderator",
        {
          method: "DELETE",
          headers: { Authorization: "Bearer token" },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.deleteNewsCommentAsModerator).toHaveBeenCalledWith({
      commentId: "22222222-2222-2222-2222-222222222222",
      token: "token",
    });
  });

  it("crea reporte de comentario", async () => {
    const response = await commentsRoute.fetch(
      new Request("https://mentirafc.vercel.app/api/comments/22222222-2222-2222-2222-222222222222/report", {
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

  it("crea reporte de comentario desde la ruta base con query params", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments?commentId=22222222-2222-2222-2222-222222222222&action=report",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "spam" }),
        }
      )
    );

    expect(response.status).toBe(201);
    expect(commentMocks.createCommentReport).toHaveBeenCalledWith({
      commentId: "22222222-2222-2222-2222-222222222222",
      reason: "spam",
      details: null,
      token: "token",
    });
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

  it("lista cola de moderacion desde la ruta base con query params", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments?view=moderation&limit=10",
        {
          headers: { Authorization: "Bearer token" },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(commentMocks.listCommentModeration).toHaveBeenCalledWith({
      limit: 10,
      cursor: null,
      token: "token",
    });
  });

  it("actualiza estado de reporte", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments/reports/44444444-4444-4444-4444-444444444444",
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

  it("rechaza ids de reporte invalidos antes de consultar", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments/reports/44444444-4444-4444-4444-444444444444%27%20OR%201=1%20--",
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

    await expect(response.json()).resolves.toEqual({
      error: "Falta un reporte valido.",
    });
    expect(response.status).toBe(400);
    expect(commentMocks.updateCommentReportStatus).not.toHaveBeenCalled();
  });

  it("actualiza estado de reporte desde la ruta base con query params", async () => {
    const response = await commentsRoute.fetch(
      new Request(
        "https://mentirafc.vercel.app/api/comments?reportId=44444444-4444-4444-4444-444444444444",
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
    expect(commentMocks.updateCommentReportStatus).toHaveBeenCalledWith({
      reportId: "44444444-4444-4444-4444-444444444444",
      status: "dismissed",
      token: "token",
    });
  });
});
