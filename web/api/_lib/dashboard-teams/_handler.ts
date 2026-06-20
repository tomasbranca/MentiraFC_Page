import {
  DASHBOARD_TEAMS_PAGE_KIND_FILTERS,
  DASHBOARD_TEAMS_PAGE_SORT_BY,
  DASHBOARD_TEAMS_PAGE_STATUS_FILTERS,
  DASHBOARD_TEAMS_PAGE_USAGE_FILTERS,
  DashboardTeamValidationError,
  deleteDashboardTeam,
  getDashboardTeamById,
  getDashboardTeamsPage,
  listDashboardTeams,
  publishDashboardTeam,
  saveDashboardTeamDraft,
} from "../teams.js";
import { authorizeDashboardRequest } from "../auth.js";
import { errorJson, json } from "../responses.js";
import { parseOffsetPaginationParams } from "../../../shared/pagination.js";
import {
  validateDashboardTeamDraftMutation,
  validateDashboardTeamMutation,
} from "./_shared.js";

const PAGINATION_PARAM_NAMES = [
  "page",
  "limit",
  "sortBy",
  "direction",
  "search",
  "status",
  "kind",
  "usage",
  "cursor",
] as const;

type DashboardTeamsStatusFilter =
  (typeof DASHBOARD_TEAMS_PAGE_STATUS_FILTERS)[number];
type DashboardTeamsKindFilter =
  (typeof DASHBOARD_TEAMS_PAGE_KIND_FILTERS)[number];
type DashboardTeamsUsageFilter =
  (typeof DASHBOARD_TEAMS_PAGE_USAGE_FILTERS)[number];

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

const parseDashboardTeamsStatusFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; status: DashboardTeamsStatusFilter | null }
  | { ok: false; message: string } => {
  const status = searchParams.get("status")?.trim();

  if (!status || status === "all") {
    return { ok: true, status: null };
  }

  if (
    DASHBOARD_TEAMS_PAGE_STATUS_FILTERS.includes(
      status as DashboardTeamsStatusFilter
    )
  ) {
    return { ok: true, status: status as DashboardTeamsStatusFilter };
  }

  return {
    ok: false,
    message: "El filtro de publicacion no esta permitido para este listado.",
  };
};

const parseDashboardTeamsKindFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; kind: DashboardTeamsKindFilter | null }
  | { ok: false; message: string } => {
  const kind = searchParams.get("kind")?.trim();

  if (!kind || kind === "all") {
    return { ok: true, kind: null };
  }

  if (DASHBOARD_TEAMS_PAGE_KIND_FILTERS.includes(kind as DashboardTeamsKindFilter)) {
    return { ok: true, kind: kind as DashboardTeamsKindFilter };
  }

  return {
    ok: false,
    message: "El filtro de tipo de club no esta permitido para este listado.",
  };
};

const parseDashboardTeamsUsageFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; usage: DashboardTeamsUsageFilter | null }
  | { ok: false; message: string } => {
  const usage = searchParams.get("usage")?.trim();

  if (!usage || usage === "all") {
    return { ok: true, usage: null };
  }

  if (
    DASHBOARD_TEAMS_PAGE_USAGE_FILTERS.includes(
      usage as DashboardTeamsUsageFilter
    )
  ) {
    return { ok: true, usage: usage as DashboardTeamsUsageFilter };
  }

  return {
    ok: false,
    message: "El filtro de uso no esta permitido para este listado.",
  };
};

const dashboardTeamsHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "teams");

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);
    const url = new URL(request.url);

    if (request.method === "GET" && id) {
      const team = await getDashboardTeamById(id);
      return team ? json(team) : errorJson("Club no encontrado.", 404);
    }

    if (request.method === "GET") {
      if (shouldUsePaginatedResponse(url.searchParams)) {
        const pagination = parseOffsetPaginationParams(url.searchParams, {
          allowedSortBy: DASHBOARD_TEAMS_PAGE_SORT_BY,
          defaultSortBy: "name",
          defaultDirection: "asc",
        });

        if (!pagination.ok) {
          return errorJson(
            pagination.issues[0]?.message ?? "Paginacion invalida.",
            400
          );
        }

        const statusFilter = parseDashboardTeamsStatusFilter(url.searchParams);

        if (!statusFilter.ok) {
          return errorJson(statusFilter.message, 400);
        }

        const kindFilter = parseDashboardTeamsKindFilter(url.searchParams);

        if (!kindFilter.ok) {
          return errorJson(kindFilter.message, 400);
        }

        const usageFilter = parseDashboardTeamsUsageFilter(url.searchParams);

        if (!usageFilter.ok) {
          return errorJson(usageFilter.message, 400);
        }

        return json(
          await getDashboardTeamsPage(pagination.params, {
            status: statusFilter.status,
            kind: kindFilter.kind,
            usage: usageFilter.usage,
          })
        );
      }

      return json(await listDashboardTeams());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTeamDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardTeamDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardTeamMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTeam(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del club.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTeamDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardTeamDraft(id, validation.input));
      }

      const validation = await validateDashboardTeamMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTeam(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador del club.", 400);
      }

      await deleteDashboardTeam(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar clubes.",
        500
      );
    }

    if (error instanceof DashboardTeamValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar los clubes. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardTeamsHandler,
};
