import { getCurrentAccessToken, getCurrentAuthSession } from "./auth";
import { z, zodParseOptions } from "./zodRuntime";
import type {
  CommentModerationPage,
  CommentReportReason,
  CommentReportStatus,
  CommentSort,
  CreateCommentReportInput,
  CreateNewsCommentInput,
  NewsComment,
  NewsCommentsPage,
  UpdateNewsCommentInput,
} from "../types/comments";
import {
  COMMENT_REPORT_REASONS,
  COMMENT_SORT_OPTIONS,
} from "../types/comments";

const commentAuthorSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
});

const newsCommentSchema = z.object({
  id: z.string().uuid(),
  newsId: z.string().trim().min(1),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  editedAt: z.string().nullable(),
  author: commentAuthorSchema,
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canModerateDelete: z.boolean(),
  hasReported: z.boolean().optional(),
});

const newsCommentsPageSchema = z.object({
  items: z.array(newsCommentSchema),
  nextCursor: z.string().nullable(),
  sort: z.enum(COMMENT_SORT_OPTIONS),
});

const commentModerationPageSchema = z.object({
  items: z.array(
    z.object({
      comment: newsCommentSchema,
      openReportCount: z.number(),
      reports: z.array(
        z.object({
          id: z.string().uuid(),
          reason: z.enum(COMMENT_REPORT_REASONS),
          details: z.string().nullable(),
          createdAt: z.string(),
          status: z.enum(["open", "dismissed", "actioned"]),
        })
      ),
    })
  ),
  nextCursor: z.string().nullable(),
});

const COMMENTS_API_PATH = "/api/comments";

const parseNewsComment = (data: unknown): NewsComment =>
  newsCommentSchema.parse(data, zodParseOptions) as NewsComment;

const parseNewsCommentsPage = (data: unknown): NewsCommentsPage =>
  newsCommentsPageSchema.parse(data, zodParseOptions) as NewsCommentsPage;

const parseCommentModerationPage = (data: unknown): CommentModerationPage =>
  commentModerationPageSchema.parse(
    data,
    zodParseOptions
  ) as CommentModerationPage;

const fetchCommentsApi = async <T>(
  path: string,
  init?: RequestInit & { auth?: "optional" | "required" }
): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (init?.auth === "required") {
    const accessToken = await getCurrentAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    const { session } = await getCurrentAuthSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as {
        data?: T;
        error?: string;
      })
    : {
        error:
          (await response.text()) ||
          `Comments request failed with status ${response.status}.`,
      };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Comments request failed.");
  }

  return payload.data as T;
};

export const fetchNewsCommentsPage = async ({
  newsId,
  sort = "newest",
  cursor,
  limit = 20,
}: {
  newsId: string;
  sort?: CommentSort;
  cursor?: string | null;
  limit?: number;
}): Promise<NewsCommentsPage> => {
  const params = new URLSearchParams({
    newsId,
    sort,
    limit: String(limit),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const data = await fetchCommentsApi<unknown>(
    `${COMMENTS_API_PATH}?${params.toString()}`,
    { auth: "optional" }
  );

  return parseNewsCommentsPage(data);
};

export const createNewsComment = async (
  input: CreateNewsCommentInput
): Promise<NewsComment> => {
  const data = await fetchCommentsApi<unknown>(COMMENTS_API_PATH, {
    method: "POST",
    auth: "required",
    body: JSON.stringify(input),
  });

  return parseNewsComment(data);
};

export const updateNewsComment = async (
  commentId: string,
  input: UpdateNewsCommentInput
): Promise<NewsComment> => {
  const data = await fetchCommentsApi<unknown>(
    `${COMMENTS_API_PATH}/${commentId}`,
    {
      method: "PATCH",
      auth: "required",
      body: JSON.stringify(input),
    }
  );

  return parseNewsComment(data);
};

export const deleteNewsComment = async (commentId: string): Promise<void> => {
  await fetchCommentsApi<{ ok: boolean }>(`${COMMENTS_API_PATH}/${commentId}`, {
    method: "DELETE",
    auth: "required",
  });
};

export const deleteNewsCommentAsModerator = async (
  commentId: string
): Promise<void> => {
  await fetchCommentsApi<{ ok: boolean }>(
    `${COMMENTS_API_PATH}/${commentId}?as=moderator`,
    {
      method: "DELETE",
      auth: "required",
    }
  );
};

export const reportNewsComment = async (
  commentId: string,
  input: CreateCommentReportInput
): Promise<{ id: string }> => {
  return fetchCommentsApi<{ id: string }>(
    `${COMMENTS_API_PATH}/${commentId}/report`,
    {
      method: "POST",
      auth: "required",
      body: JSON.stringify(input),
    }
  );
};

export const fetchCommentModerationPage = async ({
  cursor,
  limit = 20,
}: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<CommentModerationPage> => {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const data = await fetchCommentsApi<unknown>(
    `${COMMENTS_API_PATH}/moderation?${params.toString()}`,
    { auth: "required" }
  );

  return parseCommentModerationPage(data);
};

export const updateCommentReportStatus = async (
  reportId: string,
  status: Exclude<CommentReportStatus, "open">
): Promise<void> => {
  await fetchCommentsApi<{ ok: boolean }>(
    `${COMMENTS_API_PATH}/reports/${reportId}`,
    {
      method: "PATCH",
      auth: "required",
      body: JSON.stringify({ status }),
    }
  );
};

export const getCommentReportReasonLabel = (
  reason: CommentReportReason
): string => {
  switch (reason) {
    case "spam":
      return "Spam";
    case "harassment":
      return "Acoso o insultos";
    case "off_topic":
      return "Fuera de tema";
    default:
      return "Otro";
  }
};
