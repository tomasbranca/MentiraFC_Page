import {
  DASHBOARD_MATCHES_PAGE_COMPETITION_FILTERS,
  DASHBOARD_MATCHES_PAGE_SORT_BY,
  DASHBOARD_MATCHES_PAGE_STATE_FILTERS,
  DASHBOARD_MATCHES_PAGE_STATUS_FILTERS,
  deleteDashboardMatch,
  getDashboardMatchById,
  getDashboardMatchOptions,
  getDashboardMatchesPage,
  listDashboardMatches,
  publishDashboardMatch,
  saveDashboardMatchDraft,
} from "../../_lib/matches.js";
import { authorizeDashboardRequest } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { parseOffsetPaginationParams } from "../../../shared/pagination.js";
import {
  validateDashboardMatchDraftMutation,
  validateDashboardMatchMutation,
} from "./_shared.js";

const PAGINATION_PARAM_NAMES = [
  "page",
  "limit",
  "sortBy",
  "direction",
  "search",
  "status",
  "state",
  "competition",
  "cursor",
] as const;

type DashboardMatchesStatusFilter =
  (typeof DASHBOARD_MATCHES_PAGE_STATUS_FILTERS)[number];
type DashboardMatchesStateFilter =
  (typeof DASHBOARD_MATCHES_PAGE_STATE_FILTERS)[number];
type DashboardMatchesCompetitionFilter =
  (typeof DASHBOARD_MATCHES_PAGE_COMPETITION_FILTERS)[number];

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const shouldLoadOptions = (request: Request): boolean =>
  new URL(request.url).searchParams.get("options") === "1";

const shouldUsePaginatedResponse = (searchParams: URLSearchParams): boolean =>
  PAGINATION_PARAM_NAMES.some((paramName) => searchParams.has(paramName));

const parseDashboardMatchesStatusFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; status: DashboardMatchesStatusFilter | null }
  | { ok: false; message: string } => {
  const status = searchParams.get("status")?.trim();

  if (!status || status === "all") {
    return { ok: true, status: null };
  }

  if (
    DASHBOARD_MATCHES_PAGE_STATUS_FILTERS.includes(
      status as DashboardMatchesStatusFilter
    )
  ) {
    return { ok: true, status: status as DashboardMatchesStatusFilter };
  }

  return {
    ok: false,
    message: "El filtro de publicacion no esta permitido para este listado.",
  };
};

const parseDashboardMatchesStateFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; state: DashboardMatchesStateFilter | null }
  | { ok: false; message: string } => {
  const state = searchParams.get("state")?.trim();

  if (!state || state === "all") {
    return { ok: true, state: null };
  }

  if (
    DASHBOARD_MATCHES_PAGE_STATE_FILTERS.includes(
      state as DashboardMatchesStateFilter
    )
  ) {
    return { ok: true, state: state as DashboardMatchesStateFilter };
  }

  return {
    ok: false,
    message: "El filtro de estado de partido no esta permitido para este listado.",
  };
};

const parseDashboardMatchesCompetitionFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; competition: DashboardMatchesCompetitionFilter | null }
  | { ok: false; message: string } => {
  const competition = searchParams.get("competition")?.trim();

  if (!competition || competition === "all") {
    return { ok: true, competition: null };
  }

  if (
    DASHBOARD_MATCHES_PAGE_COMPETITION_FILTERS.includes(
      competition as DashboardMatchesCompetitionFilter
    )
  ) {
    return {
      ok: true,
      competition: competition as DashboardMatchesCompetitionFilter,
    };
  }

  return {
    ok: false,
    message: "El filtro de competencia no esta permitido para este listado.",
  };
};

const dashboardMatchesHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "matches");

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);
    const url = new URL(request.url);

    if (request.method === "GET" && shouldLoadOptions(request)) {
      return json(await getDashboardMatchOptions());
    }

    if (request.method === "GET" && id) {
      const match = await getDashboardMatchById(id);
      return match ? json(match) : errorJson("Partido no encontrado.", 404);
    }

    if (request.method === "GET") {
      if (shouldUsePaginatedResponse(url.searchParams)) {
        const pagination = parseOffsetPaginationParams(url.searchParams, {
          allowedSortBy: DASHBOARD_MATCHES_PAGE_SORT_BY,
          defaultSortBy: "date",
        });

        if (!pagination.ok) {
          return errorJson(
            pagination.issues[0]?.message ?? "Paginacion invalida.",
            400
          );
        }

        const statusFilter = parseDashboardMatchesStatusFilter(
          url.searchParams
        );

        if (!statusFilter.ok) {
          return errorJson(statusFilter.message, 400);
        }

        const stateFilter = parseDashboardMatchesStateFilter(url.searchParams);

        if (!stateFilter.ok) {
          return errorJson(stateFilter.message, 400);
        }

        const competitionFilter = parseDashboardMatchesCompetitionFilter(
          url.searchParams
        );

        if (!competitionFilter.ok) {
          return errorJson(competitionFilter.message, 400);
        }

        return json(
          await getDashboardMatchesPage(pagination.params, {
            status: statusFilter.status,
            state: stateFilter.state,
            competition: competitionFilter.competition,
          })
        );
      }

      return json(await listDashboardMatches());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardMatchDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardMatchDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardMatchMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardMatch(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del partido.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardMatchDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardMatchDraft(id, validation.input));
      }

      const validation = await validateDashboardMatchMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardMatch(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador del partido.", 400);
      }

      await deleteDashboardMatch(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar partidos.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar los partidos. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardMatchesHandler,
};
