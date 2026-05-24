import {
  DashboardTeamValidationError,
  deleteDashboardTeam,
  getDashboardTeamById,
  listDashboardTeams,
  publishDashboardTeam,
  saveDashboardTeamDraft,
} from "../../_lib/teams.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { DASHBOARD_RESOURCE_PERMISSIONS } from "../../../shared/auth/permissions.js";
import {
  validateDashboardTeamDraftMutation,
  validateDashboardTeamMutation,
} from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const getRequiredPermission = (request: Request) => {
  if (request.method === "POST") {
    return DASHBOARD_RESOURCE_PERMISSIONS.teams.create;
  }

  if (request.method === "PUT") {
    return DASHBOARD_RESOURCE_PERMISSIONS.teams.edit;
  }

  if (request.method === "DELETE") {
    return DASHBOARD_RESOURCE_PERMISSIONS.teams.delete;
  }

  return DASHBOARD_RESOURCE_PERMISSIONS.teams.view;
};

const dashboardTeamsHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(
      request,
      getRequiredPermission(request)
    );

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const team = await getDashboardTeamById(id);
      return team ? json(team) : errorJson("Club no encontrado.", 404);
    }

    if (request.method === "GET") {
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
