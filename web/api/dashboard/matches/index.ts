import {
  deleteDashboardMatch,
  getDashboardMatchById,
  getDashboardMatchOptions,
  listDashboardMatches,
  publishDashboardMatch,
  saveDashboardMatchDraft,
} from "../../_lib/matches.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { DASHBOARD_RESOURCE_PERMISSIONS } from "../../../shared/auth/permissions.js";
import {
  validateDashboardMatchDraftMutation,
  validateDashboardMatchMutation,
} from "./_shared.js";

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

const getRequiredPermission = (request: Request) => {
  if (request.method === "POST") {
    return DASHBOARD_RESOURCE_PERMISSIONS.matches.create;
  }

  if (request.method === "PUT") {
    return DASHBOARD_RESOURCE_PERMISSIONS.matches.edit;
  }

  if (request.method === "DELETE") {
    return DASHBOARD_RESOURCE_PERMISSIONS.matches.delete;
  }

  return DASHBOARD_RESOURCE_PERMISSIONS.matches.view;
};

const dashboardMatchesHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(
      request,
      getRequiredPermission(request)
    );

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && shouldLoadOptions(request)) {
      return json(await getDashboardMatchOptions());
    }

    if (request.method === "GET" && id) {
      const match = await getDashboardMatchById(id);
      return match ? json(match) : errorJson("Partido no encontrado.", 404);
    }

    if (request.method === "GET") {
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
