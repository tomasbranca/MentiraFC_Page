import type { SupabaseClient } from "@supabase/supabase-js";

import {
  hasPermission,
  isAppRole,
  PERMISSIONS,
  type AppPermission,
  type AppRole,
} from "../../shared/auth/permissions.js";
import { ensureReactionTargetExists } from "./reactions.js";
import {
  normalizeSanityDocumentId,
  normalizeUuid,
} from "./requestValidation.js";
import { assertRateLimit, isRateLimitError, RATE_LIMIT_MESSAGE } from "./rateLimit.js";
import {
  COMMENT_CREATE_RATE_LIMIT_RULES,
  COMMENT_DELETE_RATE_LIMIT_RULES,
  COMMENT_EDIT_RATE_LIMIT_RULES,
  COMMENT_MODERATION_RATE_LIMIT_RULES,
  COMMENT_REPORT_RATE_LIMIT_RULES,
} from "./securityLimits.js";
import { hashSecurityIdentifier, logSecurityEvent } from "./securityLog.js";
import {
  createAdminSupabaseClient,
  createPublicSupabaseClient,
  createUserSupabaseClient,
} from "./supabase.js";

export const COMMENT_SORT_OPTIONS = ["newest", "oldest"] as const;

export type CommentSort = (typeof COMMENT_SORT_OPTIONS)[number];

export const COMMENT_REPORT_REASONS = [
  "spam",
  "harassment",
  "off_topic",
  "other",
] as const;

export type CommentReportReason = (typeof COMMENT_REPORT_REASONS)[number];

export const COMMENT_REPORT_STATUSES = [
  "open",
  "dismissed",
  "actioned",
] as const;

export type CommentReportStatus = (typeof COMMENT_REPORT_STATUSES)[number];

export const COMMENT_BODY_MIN_LENGTH = 1;
export const COMMENT_BODY_MAX_LENGTH = 2000;
export const COMMENT_DETAILS_MAX_LENGTH = 500;
export const DEFAULT_COMMENTS_LIMIT = 20;
export const MAX_COMMENTS_LIMIT = 50;
const COMMENT_HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const COMMENT_CURSOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMMENT_CURSOR_CREATED_AT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

export type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
};

export type NewsComment = {
  id: string;
  newsId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: CommentAuthor;
  canEdit: boolean;
  canDelete: boolean;
  canModerateDelete: boolean;
  hasReported?: boolean;
};

export type NewsCommentsPage = {
  items: NewsComment[];
  nextCursor: string | null;
  sort: CommentSort;
};

export type CommentModerationItem = {
  comment: NewsComment;
  openReportCount: number;
  reports: Array<{
    id: string;
    reason: CommentReportReason;
    details: string | null;
    createdAt: string;
    status: CommentReportStatus;
  }>;
};

export type CommentModerationPage = {
  items: CommentModerationItem[];
  nextCursor: string | null;
};

export type AuthorizedCommentUser = {
  userId: string;
  role: AppRole;
  supabase: SupabaseClient;
};

type CommentRow = {
  id: string;
  news_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
};

type ReportRow = {
  id: string;
  comment_id: string;
  reporter_user_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  status: string;
};

export const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
};

export const createCommentsSupabaseClient = (token?: string | null) => {
  return token ? createUserSupabaseClient(token) : createPublicSupabaseClient();
};

export const normalizeNewsId = (input: unknown): string | null =>
  normalizeSanityDocumentId(input);

export const normalizeCommentEntityId = (input: unknown): string | null =>
  normalizeUuid(input);

export const normalizeCommentBody = (input: unknown): string | null => {
  if (typeof input !== "string") {
    return null;
  }

  const body = input.replace(/\r\n/g, "\n").trim().replace(/\n{3,}/g, "\n\n");

  if (
    body.length < COMMENT_BODY_MIN_LENGTH ||
    body.length > COMMENT_BODY_MAX_LENGTH ||
    COMMENT_HTML_TAG_PATTERN.test(body)
  ) {
    return null;
  }

  return body;
};

export const normalizeCommentSort = (input: unknown): CommentSort => {
  if (input === "oldest") {
    return "oldest";
  }

  return "newest";
};

export const normalizeCommentLimit = (input: unknown): number => {
  const parsed =
    typeof input === "string" ? Number.parseInt(input, 10) : Number(input);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_COMMENTS_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_COMMENTS_LIMIT);
};

export const encodeCommentCursor = (
  createdAt: string,
  id: string
): string => Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");

const isValidCommentCursor = ({
  createdAt,
  id,
}: {
  createdAt: string;
  id: string;
}): boolean =>
  COMMENT_CURSOR_CREATED_AT_PATTERN.test(createdAt) &&
  Number.isFinite(Date.parse(createdAt)) &&
  COMMENT_CURSOR_ID_PATTERN.test(id);

export const decodeCommentCursor = (
  cursor: string | null | undefined
): { createdAt: string; id: string } | null => {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const separatorIndex = decoded.lastIndexOf("|");

    if (separatorIndex <= 0) {
      return null;
    }

    const createdAt = decoded.slice(0, separatorIndex);
    const id = decoded.slice(separatorIndex + 1);

    if (!createdAt || !id) {
      return null;
    }

    if (!isValidCommentCursor({ createdAt, id })) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
};

export const isCommentReportReason = (
  input: unknown
): input is CommentReportReason =>
  typeof input === "string" &&
  COMMENT_REPORT_REASONS.includes(input as CommentReportReason);

export const isCommentReportStatus = (
  input: unknown
): input is CommentReportStatus =>
  typeof input === "string" &&
  COMMENT_REPORT_STATUSES.includes(input as CommentReportStatus);

export const normalizeReportDetails = (input: unknown): string | null => {
  if (input == null) {
    return null;
  }

  if (typeof input !== "string") {
    return null;
  }

  const details = input.trim();

  if (!details) {
    return null;
  }

  if (details.length > COMMENT_DETAILS_MAX_LENGTH) {
    return null;
  }

  return details;
};

export const ensureNewsExists = async (newsId: string): Promise<boolean> =>
  ensureReactionTargetExists({
    targetType: "news",
    targetId: newsId,
  });

const getOptionalViewer = async (
  token: string | null
): Promise<{ userId: string; role: AppRole } | null> => {
  if (!token) {
    return null;
  }

  const supabase = createCommentsSupabaseClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  const { data: account } = await supabase
    .from("my_account")
    .select("role, is_active")
    .maybeSingle();

  if (!account?.is_active || !isAppRole(account.role)) {
    return null;
  }

  return {
    userId: user.id,
    role: account.role,
  };
};

export const authorizeActiveCommentUser = async (
  token: string | null,
  options?: { requiredPermission?: AppPermission }
): Promise<AuthorizedCommentUser> => {
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const supabase = createCommentsSupabaseClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    throw new Error("Invalid auth token.");
  }

  const { data: account, error: accountError } = await supabase
    .from("my_account")
    .select("role, is_active")
    .maybeSingle();

  if (accountError || !account) {
    throw new Error("Account validation failed.");
  }

  if (!isAppRole(account.role)) {
    throw new Error("Invalid account role.");
  }

  if (!account.is_active) {
    logSecurityEvent("inactive_comment_user_blocked", {
      userId: user.id,
      requiredPermission:
        options?.requiredPermission ?? PERMISSIONS.commentNews,
    });
    throw new Error("Banned user.");
  }

  const requiredPermission =
    options?.requiredPermission ?? PERMISSIONS.commentNews;

  if (!hasPermission(account.role, requiredPermission)) {
    logSecurityEvent("comment_permission_denied", {
      userId: user.id,
      role: account.role,
      requiredPermission,
    });
    throw new Error("Missing permission.");
  }

  return {
    userId: user.id,
    role: account.role,
    supabase,
  };
};

export const authorizeModerator = async (
  token: string | null
): Promise<AuthorizedCommentUser> =>
  authorizeActiveCommentUser(token, {
    requiredPermission: PERMISSIONS.deleteOthersComments,
  });

const fetchProfilesByUserIds = async (
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, ProfileRow>> => {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", uniqueIds);

  if (error) {
    console.error("[comments] profiles lookup failed:", error.message);
    return new Map();
  }

  return new Map(
    ((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );
};

const fetchReportedCommentIds = async (
  supabase: SupabaseClient,
  userId: string,
  commentIds: string[]
): Promise<Set<string>> => {
  if (commentIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("comment_reports")
    .select("comment_id")
    .eq("reporter_user_id", userId)
    .in("comment_id", commentIds);

  if (error) {
    throw error;
  }

  return new Set(
    ((data ?? []) as Array<{ comment_id: string }>).map((row) => row.comment_id)
  );
};

const adaptCommentAuthor = (
  userId: string,
  profiles: Map<string, ProfileRow>
): CommentAuthor => {
  const profile = profiles.get(userId);

  return {
    id: userId,
    firstName: profile?.first_name?.trim() || "Usuario",
    lastName: profile?.last_name?.trim() || "",
  };
};

const buildCommentDto = ({
  row,
  profiles,
  viewer,
  reportedCommentIds,
}: {
  row: CommentRow;
  profiles: Map<string, ProfileRow>;
  viewer: { userId: string; role: AppRole } | null;
  reportedCommentIds?: Set<string>;
}): NewsComment => {
  const isOwner = viewer?.userId === row.user_id;
  const canModerateDelete = viewer
    ? hasPermission(viewer.role, PERMISSIONS.deleteOthersComments)
    : false;

  return {
    id: row.id,
    newsId: row.news_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editedAt: row.edited_at,
    author: adaptCommentAuthor(row.user_id, profiles),
    canEdit: Boolean(isOwner),
    canDelete: Boolean(isOwner),
    canModerateDelete,
    ...(viewer && reportedCommentIds
      ? { hasReported: reportedCommentIds.has(row.id) }
      : {}),
  };
};

const applyKeysetFilter = <T extends { or: (filters: string) => T }>(
  query: T,
  sort: CommentSort,
  cursor: { createdAt: string; id: string } | null
): T => {
  if (!cursor) {
    return query;
  }

  if (sort === "newest") {
    return query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  return query.or(
    `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
  );
};

export const listNewsComments = async ({
  newsId,
  sort,
  limit,
  cursor,
  token,
}: {
  newsId: string;
  sort: CommentSort;
  limit: number;
  cursor: string | null;
  token: string | null;
}): Promise<NewsCommentsPage> => {
  const supabase = createCommentsSupabaseClient(token);
  const decodedCursor = decodeCommentCursor(cursor);
  const ascending = sort === "oldest";

  let query = supabase
    .from("news_comments")
    .select("id, news_id, user_id, body, created_at, updated_at, edited_at")
    .eq("news_id", newsId)
    .is("deleted_at", null)
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit + 1);

  query = applyKeysetFilter(query, sort, decodedCursor);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CommentRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const viewer = await getOptionalViewer(token);
  const profiles = await fetchProfilesByUserIds(
    supabase,
    pageRows.map((row) => row.user_id)
  );
  const reportedCommentIds = viewer
    ? await fetchReportedCommentIds(
        supabase,
        viewer.userId,
        pageRows.map((row) => row.id)
      )
    : undefined;

  const lastRow = pageRows.at(-1);

  return {
    items: pageRows.map((row) =>
      buildCommentDto({
        row,
        profiles,
        viewer,
        reportedCommentIds,
      })
    ),
    nextCursor:
      hasMore && lastRow
        ? encodeCommentCursor(lastRow.created_at, lastRow.id)
        : null,
    sort,
  };
};

export const createNewsComment = async ({
  newsId,
  body,
  token,
}: {
  newsId: string;
  body: string;
  token: string;
}): Promise<NewsComment> => {
  const user = await authorizeActiveCommentUser(token);
  assertRateLimit({
    action: "comment:create",
    identifier: user.userId,
    rules: COMMENT_CREATE_RATE_LIMIT_RULES,
    meta: { userId: user.userId },
  });
  const exists = await ensureNewsExists(newsId);

  if (!exists) {
    throw new Error("News not found.");
  }

  assertRateLimit({
    action: "comment:duplicate",
    identifier: `${user.userId}:${newsId}:${hashSecurityIdentifier(body)}`,
    rules: [{ windowMs: 60_000, max: 1 }],
    meta: { userId: user.userId, newsId },
  });

  const { data, error } = await user.supabase
    .from("news_comments")
    .insert({
      news_id: newsId,
      user_id: user.userId,
      body,
    })
    .select("id, news_id, user_id, body, created_at, updated_at, edited_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create comment.");
  }

  const profiles = await fetchProfilesByUserIds(user.supabase, [user.userId]);

  return buildCommentDto({
    row: data as CommentRow,
    profiles,
    viewer: {
      userId: user.userId,
      role: user.role,
    },
    reportedCommentIds: new Set(),
  });
};

export const updateOwnNewsComment = async ({
  commentId,
  body,
  token,
}: {
  commentId: string;
  body: string;
  token: string;
}): Promise<NewsComment> => {
  const user = await authorizeActiveCommentUser(token);
  assertRateLimit({
    action: "comment:edit",
    identifier: user.userId,
    rules: COMMENT_EDIT_RATE_LIMIT_RULES,
    meta: { userId: user.userId },
  });
  const { data: existing, error: existingError } = await user.supabase
    .from("news_comments")
    .select("id, news_id, user_id, body, created_at, updated_at, edited_at")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing || existing.user_id !== user.userId) {
    throw new Error("Comment not found.");
  }

  const { data, error } = await user.supabase
    .from("news_comments")
    .update({
      body,
      edited_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", user.userId)
    .is("deleted_at", null)
    .select("id, news_id, user_id, body, created_at, updated_at, edited_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update comment.");
  }

  const profiles = await fetchProfilesByUserIds(user.supabase, [user.userId]);

  return buildCommentDto({
    row: data as CommentRow,
    profiles,
    viewer: {
      userId: user.userId,
      role: user.role,
    },
    reportedCommentIds: new Set(),
  });
};

export const deleteOwnNewsComment = async ({
  commentId,
  token,
}: {
  commentId: string;
  token: string;
}): Promise<void> => {
  const user = await authorizeActiveCommentUser(token);
  assertRateLimit({
    action: "comment:delete",
    identifier: user.userId,
    rules: COMMENT_DELETE_RATE_LIMIT_RULES,
    meta: { userId: user.userId },
  });
  const { data: existing, error: existingError } = await user.supabase
    .from("news_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing || existing.user_id !== user.userId) {
    throw new Error("Comment not found.");
  }

  const { error } = await user.supabase
    .from("news_comments")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.userId,
      deletion_kind: "self",
    })
    .eq("id", commentId)
    .eq("user_id", user.userId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
};

export const deleteNewsCommentAsModerator = async ({
  commentId,
  token,
}: {
  commentId: string;
  token: string;
}): Promise<void> => {
  const moderator = await authorizeModerator(token);
  assertRateLimit({
    action: "comment:moderator_delete",
    identifier: moderator.userId,
    rules: COMMENT_MODERATION_RATE_LIMIT_RULES,
    meta: { userId: moderator.userId },
  });
  const { data: existing, error: existingError } = await moderator.supabase
    .from("news_comments")
    .select("id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    throw new Error("Comment not found.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("news_comments")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: moderator.userId,
      deletion_kind: "moderator",
    })
    .eq("id", commentId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  logSecurityEvent(
    "comment_moderation_delete",
    {
      moderatorUserId: moderator.userId,
      commentId,
    },
    "info"
  );
};

export const createCommentReport = async ({
  commentId,
  reason,
  details,
  token,
}: {
  commentId: string;
  reason: CommentReportReason;
  details: string | null;
  token: string;
}): Promise<{ id: string }> => {
  const user = await authorizeActiveCommentUser(token);
  assertRateLimit({
    action: "comment:report",
    identifier: user.userId,
    rules: COMMENT_REPORT_RATE_LIMIT_RULES,
    meta: { userId: user.userId },
  });
  const { data: comment, error: commentError } = await user.supabase
    .from("news_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (commentError) {
    throw commentError;
  }

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.user_id === user.userId) {
    logSecurityEvent("own_comment_report_blocked", {
      userId: user.userId,
      commentId,
    });
    throw new Error("Cannot report own comment.");
  }

  const { data, error } = await user.supabase
    .from("comment_reports")
    .insert({
      comment_id: commentId,
      reporter_user_id: user.userId,
      reason,
      details,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Duplicate report.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Failed to create report.");
  }

  return { id: data.id as string };
};

export const listCommentModeration = async ({
  limit,
  cursor,
  token,
}: {
  limit: number;
  cursor: string | null;
  token: string;
}): Promise<CommentModerationPage> => {
  const moderator = await authorizeModerator(token);
  const decodedCursor = decodeCommentCursor(cursor);

  let reportsQuery = moderator.supabase
    .from("comment_reports")
    .select(
      "id, comment_id, reporter_user_id, reason, details, created_at, status"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);

  if (decodedCursor) {
    reportsQuery = reportsQuery.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`
    );
  }

  const { data: reportRows, error: reportsError } = await reportsQuery;

  if (reportsError) {
    throw reportsError;
  }

  const reports = (reportRows ?? []) as ReportRow[];
  const commentIds: string[] = [];
  const seenCommentIds = new Set<string>();

  for (const report of reports) {
    if (!seenCommentIds.has(report.comment_id)) {
      seenCommentIds.add(report.comment_id);
      commentIds.push(report.comment_id);
    }

    if (commentIds.length >= limit + 1) {
      break;
    }
  }

  const pageCommentIds = commentIds.slice(0, limit);
  const hasMore = commentIds.length > limit;

  if (pageCommentIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const { data: commentRows, error: commentsError } = await moderator.supabase
    .from("news_comments")
    .select("id, news_id, user_id, body, created_at, updated_at, edited_at")
    .in("id", pageCommentIds)
    .is("deleted_at", null);

  if (commentsError) {
    throw commentsError;
  }

  const comments = (commentRows ?? []) as CommentRow[];
  const profiles = await fetchProfilesByUserIds(
    moderator.supabase,
    comments.map((row) => row.user_id)
  );
  const viewer = {
    userId: moderator.userId,
    role: moderator.role,
  };
  const commentsById = new Map(comments.map((row) => [row.id, row]));

  const items: CommentModerationItem[] = pageCommentIds
    .map((commentId) => {
      const row = commentsById.get(commentId);

      if (!row) {
        return null;
      }

      const commentReports = reports.filter(
        (report) => report.comment_id === commentId
      );

      return {
        comment: buildCommentDto({
          row,
          profiles,
          viewer,
        }),
        openReportCount: commentReports.length,
        reports: commentReports.map((report) => ({
          id: report.id,
          reason: report.reason as CommentReportReason,
          details: report.details,
          createdAt: report.created_at,
          status: report.status as CommentReportStatus,
        })),
      };
    })
    .filter((item): item is CommentModerationItem => item !== null);

  const lastReport = reports.find((report) =>
    pageCommentIds.includes(report.comment_id)
  );

  return {
    items,
    nextCursor:
      hasMore && lastReport
        ? encodeCommentCursor(lastReport.created_at, lastReport.id)
        : null,
  };
};

export const updateCommentReportStatus = async ({
  reportId,
  status,
  token,
}: {
  reportId: string;
  status: Exclude<CommentReportStatus, "open">;
  token: string;
}): Promise<void> => {
  const moderator = await authorizeModerator(token);
  assertRateLimit({
    action: "comment:moderation_status",
    identifier: moderator.userId,
    rules: COMMENT_MODERATION_RATE_LIMIT_RULES,
    meta: { userId: moderator.userId },
  });
  const { error } = await moderator.supabase
    .from("comment_reports")
    .update({
      status,
      reviewed_by: moderator.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("status", "open");

  if (error) {
    throw error;
  }

  logSecurityEvent(
    "comment_report_moderation",
    {
      moderatorUserId: moderator.userId,
      reportId,
      status,
    },
    "info"
  );
};

export const mapCommentsErrorToStatus = (
  error: unknown
): { message: string; status: number } => {
  if (!(error instanceof Error)) {
    return {
      message: "No pudimos procesar los comentarios.",
      status: 500,
    };
  }

  if (isRateLimitError(error)) {
    return {
      message: RATE_LIMIT_MESSAGE,
      status: 429,
    };
  }

  switch (error.message) {
    case "Missing auth token.":
    case "Invalid auth token.":
      return { message: "No autorizado.", status: 401 };
    case "Banned user.":
      return { message: "Tu usuario ha sido baneado.", status: 403 };
    case "Missing permission.":
    case "Account validation failed.":
    case "Invalid account role.":
      return { message: "No tenes permisos para realizar esta accion.", status: 403 };
    case "News not found.":
    case "Comment not found.":
      return { message: "El recurso no existe o no esta disponible.", status: 404 };
    case "Cannot report own comment.":
      return {
        message: "No podes reportar tu propio comentario.",
        status: 403,
      };
    case "Duplicate report.":
      return {
        message: "Ya reportaste este comentario.",
        status: 409,
      };
    case "Supabase public server environment variables are not configured.":
      return {
        message: "Supabase no esta configurado en el servidor.",
        status: 500,
      };
    case "Supabase admin environment variables are not configured.":
      return {
        message: "Supabase admin no esta configurado en el servidor.",
        status: 500,
      };
    default:
      return {
        message: "No pudimos procesar los comentarios.",
        status: 500,
      };
  }
};
