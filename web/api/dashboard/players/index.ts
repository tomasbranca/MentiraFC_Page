import {
  deleteDashboardPlayer,
  getDashboardPlayerById,
  listDashboardPlayers,
  publishDashboardPlayer,
  saveDashboardPlayerDraft,
  setDashboardPlayerActiveStatus,
  parseDashboardPlayerActiveStatusInput,
} from "../../_lib/players.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardPlayerDraftMutation,
  validateDashboardPlayerMutation,
} from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const dashboardPlayersHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const player = await getDashboardPlayerById(id);
      return player ? json(player) : errorJson("Jugador no encontrado.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardPlayers());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardPlayerDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardPlayerDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardPlayerMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardPlayer(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del jugador.", 400);
      }

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

    if (request.method === "PATCH") {
      if (!id) {
        return errorJson("Falta el identificador del jugador.", 400);
      }

      const isActive = parseDashboardPlayerActiveStatusInput(
        await request.json().catch(() => null)
      );

      if (isActive === null) {
        return errorJson("El estado activo del jugador no es valido.", 400);
      }

      try {
        return json(await setDashboardPlayerActiveStatus(id, isActive));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            "Player must be published before changing active status."
        ) {
          return errorJson(
            "Solo podes cambiar el estado de jugadores publicados.",
            409
          );
        }

        throw error;
      }
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador del jugador.", 400);
      }

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
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar jugadores.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar los jugadores. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardPlayersHandler,
};
