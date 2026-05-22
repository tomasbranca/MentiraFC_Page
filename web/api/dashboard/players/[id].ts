import {
  deleteDashboardPlayer,
  getDashboardPlayerById,
  publishDashboardPlayer,
  saveDashboardPlayerDraft,
} from "../../_lib/players.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardPlayerDraftMutation,
  validateDashboardPlayerMutation,
} from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const pathname = new URL(request.url).pathname;
  const id = pathname.split("/").filter(Boolean).at(-1);

  return id ?? null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const dashboardPlayerByIdHandler = async (
  request: Request
): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (!id) {
      return errorJson("Falta el identificador del jugador.", 400);
    }

    if (request.method === "GET") {
      const player = await getDashboardPlayerById(id);
      return player ? json(player) : errorJson("Jugador no encontrado.", 404);
    }

    if (request.method === "PUT") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardPlayerDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardPlayerDraft(id, validation.input));
      }

      const validation = await validateDashboardPlayerMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardPlayer(id, validation.input));
    }

    if (request.method === "DELETE") {
      await deleteDashboardPlayer(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para modificar jugadores.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar el jugador. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardPlayerByIdHandler,
};
