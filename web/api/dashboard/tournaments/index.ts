import {
  DashboardTournamentValidationError,
  deleteDashboardTournament,
  getDashboardTournamentById,
  getDashboardTournamentOptions,
  listDashboardTournaments,
  publishDashboardTournament,
  saveDashboardTournamentDraft,
} from "../../_lib/tournaments.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardTournamentDraftMutation,
  validateDashboardTournamentMutation,
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

const dashboardTournamentHandler = async (
  request: Request
): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && shouldLoadOptions(request)) {
      return json(await getDashboardTournamentOptions());
    }

    if (request.method === "GET" && id) {
      const tournament = await getDashboardTournamentById(id);
      return tournament ? json(tournament) : errorJson("Torneo no encontrado.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardTournaments());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTournamentDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(
          await saveDashboardTournamentDraft(null, validation.input),
          {
            status: 201,
          }
        );
      }

      const validation = await validateDashboardTournamentMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTournament(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del torneo.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTournamentDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardTournamentDraft(id, validation.input));
      }

      const validation = await validateDashboardTournamentMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTournament(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador del torneo.", 400);
      }

      await deleteDashboardTournament(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar torneos.",
        500
      );
    }

    if (error instanceof DashboardTournamentValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar el torneo. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardTournamentHandler,
};
