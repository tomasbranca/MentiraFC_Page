import {
  DASHBOARD_NEWS_PAGE_SORT_BY,
  DASHBOARD_NEWS_PAGE_STATUS_FILTERS,
  deleteDashboardNews,
  getDashboardNewsPage,
  getDashboardNewsById,
  listDashboardNews,
  publishDashboardNews,
  saveDashboardNewsDraft,
} from "../../_lib/news.js";
import { authorizeDashboardRequest } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { parseOffsetPaginationParams } from "../../../shared/pagination.js";
import {
  validateDashboardNewsDraftMutation,
  validateDashboardNewsMutation,
} from "./_shared.js";

const PAGINATION_PARAM_NAMES = [
  "page",
  "limit",
  "sortBy",
  "direction",
  "search",
  "status",
  "cursor",
] as const;

type DashboardNewsStatusFilter = (typeof DASHBOARD_NEWS_PAGE_STATUS_FILTERS)[number];

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const shouldUsePaginatedResponse = (searchParams: URLSearchParams): boolean =>
  PAGINATION_PARAM_NAMES.some((paramName) => searchParams.has(paramName));

const parseDashboardNewsStatusFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; status: DashboardNewsStatusFilter | null }
  | { ok: false; message: string } => {
  const status = searchParams.get("status")?.trim();

  if (!status || status === "all") {
    return { ok: true, status: null };
  }

  if (
    DASHBOARD_NEWS_PAGE_STATUS_FILTERS.includes(
      status as DashboardNewsStatusFilter
    )
  ) {
    return { ok: true, status: status as DashboardNewsStatusFilter };
  }

  return {
    ok: false,
    message: "El filtro de estado no esta permitido para este listado.",
  };
};

const dashboardNewsHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "news");

    if (authorization instanceof Response) {
      return authorization;
    }

    const url = new URL(request.url);
    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const news = await getDashboardNewsById(id);
      return news ? json(news) : errorJson("Noticia no encontrada.", 404);
    }

    if (request.method === "GET") {
      if (shouldUsePaginatedResponse(url.searchParams)) {
        const pagination = parseOffsetPaginationParams(url.searchParams, {
          allowedSortBy: DASHBOARD_NEWS_PAGE_SORT_BY,
          defaultSortBy: "date",
        });

        if (!pagination.ok) {
          return errorJson(pagination.issues[0]?.message ?? "Paginacion invalida.", 400);
        }

        const statusFilter = parseDashboardNewsStatusFilter(url.searchParams);

        if (!statusFilter.ok) {
          return errorJson(statusFilter.message, 400);
        }

        return json(
          await getDashboardNewsPage(pagination.params, {
            status: statusFilter.status,
          })
        );
      }

      return json(await listDashboardNews());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardNewsDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardNewsDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardNewsMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardNews(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador de la noticia.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardNewsDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardNewsDraft(id, validation.input));
      }

      const validation = await validateDashboardNewsMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardNews(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador de la noticia.", 400);
      }

      await deleteDashboardNews(id);
      return json(null);
    }

    return errorJson("Método no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar noticias.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar las noticias. Verificá la configuración del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardNewsHandler,
};
