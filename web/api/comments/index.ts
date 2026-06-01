import { errorJson, json } from "../_lib/responses.js";
import {
  createCommentReport,
  createNewsComment,
  decodeCommentCursor,
  deleteNewsCommentAsModerator,
  deleteOwnNewsComment,
  ensureNewsExists,
  getBearerToken,
  isCommentReportReason,
  isCommentReportStatus,
  listCommentModeration,
  listNewsComments,
  mapCommentsErrorToStatus,
  normalizeCommentEntityId,
  normalizeCommentBody,
  normalizeCommentLimit,
  normalizeCommentSort,
  normalizeNewsId,
  normalizeReportDetails,
  updateCommentReportStatus,
  updateOwnNewsComment,
} from "../_lib/comments.js";
import {
  assertRateLimit,
  getClientIp,
  isRateLimitError,
  RATE_LIMIT_MESSAGE,
} from "../_lib/rateLimit.js";
import { AUTHENTICATED_WRITE_IP_RATE_LIMIT_RULES } from "../_lib/securityLimits.js";
import { logSecurityEvent } from "../_lib/securityLog.js";
import { hasExcessiveContentLength } from "../_lib/requestValidation.js";

const MAX_COMMENT_MUTATION_PAYLOAD_BYTES = 10_000;

const parseJsonBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const getTrimmedSearchParam = (url: URL, key: string): string | null => {
  const value = url.searchParams.get(key)?.trim();
  return value || null;
};

const getCommentIdFromPath = (pathname: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  const commentsIndex = segments.lastIndexOf("comments");

  if (commentsIndex === -1) {
    return null;
  }

  const nextSegment = segments[commentsIndex + 1]?.trim();

  if (!nextSegment || nextSegment === "moderation" || nextSegment === "reports") {
    return null;
  }

  return nextSegment;
};

const getCommentIdFromRequest = (url: URL, pathname: string): string | null =>
  normalizeCommentEntityId(
    getTrimmedSearchParam(url, "commentId") ?? getCommentIdFromPath(pathname)
  );

const hasCommentIdInput = (url: URL, pathname: string): boolean =>
  Boolean(getTrimmedSearchParam(url, "commentId") ?? getCommentIdFromPath(pathname));

const getReportIdFromPath = (pathname: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  const reportsIndex = segments.lastIndexOf("reports");

  if (reportsIndex === -1) {
    return null;
  }

  return segments[reportsIndex + 1]?.trim() || null;
};

const getReportIdFromRequest = (url: URL, pathname: string): string | null =>
  normalizeCommentEntityId(
    getTrimmedSearchParam(url, "reportId") ?? getReportIdFromPath(pathname)
  );

const hasReportIdInput = (url: URL, pathname: string): boolean =>
  Boolean(getTrimmedSearchParam(url, "reportId") ?? getReportIdFromPath(pathname));

const isModerationRequest = (url: URL, pathname: string): boolean =>
  pathname.endsWith("/comments/moderation") ||
  url.searchParams.get("view") === "moderation";

const isCommentReportRequest = (url: URL, pathname: string): boolean =>
  pathname.endsWith("/report") || url.searchParams.get("action") === "report";

const assertCommentIpRateLimit = (request: Request): void => {
  const clientIp = getClientIp(request);

  if (!clientIp) {
    return;
  }

  assertRateLimit({
    action: "comments:write:ip",
    identifier: clientIp,
    rules: AUTHENTICATED_WRITE_IP_RATE_LIMIT_RULES,
    meta: { route: "comments" },
  });
};

const commentsHandler = async (request: Request): Promise<Response> => {
  try {
    const token = getBearerToken(request);
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (isModerationRequest(url, pathname)) {
      if (request.method !== "GET") {
        return errorJson("Metodo no permitido.", 405);
      }

      if (!token) {
        logSecurityEvent("comments_moderation_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      const limit = normalizeCommentLimit(url.searchParams.get("limit"));
      const cursor = decodeCommentCursor(url.searchParams.get("cursor"))
        ? url.searchParams.get("cursor")
        : null;

      return json(
        await listCommentModeration({
          limit,
          cursor,
          token,
        })
      );
    }

    const reportId = getReportIdFromRequest(url, pathname);

    if (reportId) {
      if (request.method !== "PATCH") {
        return errorJson("Metodo no permitido.", 405);
      }

      if (!token) {
        logSecurityEvent("comment_report_status_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      assertCommentIpRateLimit(request);

      if (hasExcessiveContentLength(request, MAX_COMMENT_MUTATION_PAYLOAD_BYTES)) {
        return errorJson("El payload es demasiado grande.", 413);
      }

      const body = await parseJsonBody<{ status?: unknown }>(request);

      if (
        !body ||
        !isCommentReportStatus(body.status) ||
        (body.status !== "dismissed" && body.status !== "actioned")
      ) {
        return errorJson("El estado del reporte no es valido.", 400);
      }

      await updateCommentReportStatus({
        reportId,
        status: body.status,
        token,
      });

      return json({ ok: true });
    }

    if (hasReportIdInput(url, pathname)) {
      return errorJson("Falta un reporte valido.", 400);
    }

    const commentId = getCommentIdFromRequest(url, pathname);

    if (isCommentReportRequest(url, pathname)) {
      if (!commentId) {
        return errorJson("Falta un comentario valido.", 400);
      }

      if (request.method !== "POST") {
        return errorJson("Metodo no permitido.", 405);
      }

      if (!token) {
        logSecurityEvent("comment_report_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      assertCommentIpRateLimit(request);

      if (hasExcessiveContentLength(request, MAX_COMMENT_MUTATION_PAYLOAD_BYTES)) {
        return errorJson("El payload del reporte es demasiado grande.", 413);
      }

      const body = await parseJsonBody<{
        reason?: unknown;
        details?: unknown;
      }>(request);

      if (!body) {
        return errorJson("El payload del reporte no es valido.", 400);
      }

      if (!isCommentReportReason(body.reason)) {
        return errorJson("La razon del reporte no es valida.", 400);
      }

      const details = normalizeReportDetails(body.details);

      if (
        body.details != null &&
        details === null &&
        typeof body.details === "string" &&
        body.details.trim()
      ) {
        return errorJson(
          "Los detalles del reporte superan el limite permitido.",
          400
        );
      }

      const report = await createCommentReport({
        commentId,
        reason: body.reason,
        details,
        token,
      });

      return json(report, { status: 201 });
    }

    if (commentId) {
      if (!token) {
        logSecurityEvent("comment_mutation_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      if (request.method === "PATCH") {
        assertCommentIpRateLimit(request);
        if (hasExcessiveContentLength(request, MAX_COMMENT_MUTATION_PAYLOAD_BYTES)) {
          return errorJson("El payload del comentario es demasiado grande.", 413);
        }

        const body = await parseJsonBody<{ body?: unknown }>(request);

        if (!body) {
          return errorJson("El payload del comentario no es valido.", 400);
        }

        const normalizedBody = normalizeCommentBody(body.body);

        if (!normalizedBody) {
          return errorJson(
            "El comentario debe tener entre 1 y 2000 caracteres.",
            400
          );
        }

        return json(
          await updateOwnNewsComment({
            commentId,
            body: normalizedBody,
            token,
          })
        );
      }

      if (request.method === "DELETE") {
        assertCommentIpRateLimit(request);
        const asModerator = url.searchParams.get("as") === "moderator";

        if (asModerator) {
          await deleteNewsCommentAsModerator({ commentId, token });
        } else {
          await deleteOwnNewsComment({ commentId, token });
        }

        return json({ ok: true });
      }

      return errorJson("Metodo no permitido.", 405);
    }

    if (hasCommentIdInput(url, pathname)) {
      return errorJson("Falta un comentario valido.", 400);
    }

    if (request.method === "GET") {
      const newsId = normalizeNewsId(url.searchParams.get("newsId"));
      const sort = normalizeCommentSort(url.searchParams.get("sort"));
      const limit = normalizeCommentLimit(url.searchParams.get("limit"));
      const cursor = decodeCommentCursor(url.searchParams.get("cursor"))
        ? url.searchParams.get("cursor")
        : null;

      if (!newsId) {
        return errorJson("Falta una noticia valida.", 400);
      }

      const exists = await ensureNewsExists(newsId);

      if (!exists) {
        return errorJson("La noticia no existe o no esta publicada.", 404);
      }

      return json(
        await listNewsComments({
          newsId,
          sort,
          limit,
          cursor,
          token,
        })
      );
    }

    if (request.method === "POST") {
      if (!token) {
        logSecurityEvent("comment_create_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      assertCommentIpRateLimit(request);

      if (hasExcessiveContentLength(request, MAX_COMMENT_MUTATION_PAYLOAD_BYTES)) {
        return errorJson("El payload del comentario es demasiado grande.", 413);
      }

      const body = await parseJsonBody<{
        newsId?: unknown;
        body?: unknown;
      }>(request);

      if (!body) {
        return errorJson("El payload del comentario no es valido.", 400);
      }

      const newsId = normalizeNewsId(body.newsId);
      const normalizedBody = normalizeCommentBody(body.body);

      if (!newsId) {
        return errorJson("Falta una noticia valida.", 400);
      }

      if (!normalizedBody) {
        return errorJson(
          "El comentario debe tener entre 1 y 2000 caracteres.",
          400
        );
      }

      return json(
        await createNewsComment({
          newsId,
          body: normalizedBody,
          token,
        }),
        { status: 201 }
      );
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    const mapped = mapCommentsErrorToStatus(error);

    if (isRateLimitError(error)) {
      return errorJson(RATE_LIMIT_MESSAGE, 429);
    }

    if (mapped.status >= 500) {
      logSecurityEvent(
        "comments_api_sensitive_error",
        { status: mapped.status },
        "error"
      );
    }

    return errorJson(mapped.message, mapped.status);
  }
};

export default {
  fetch: commentsHandler,
};
