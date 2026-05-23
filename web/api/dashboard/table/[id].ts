import {
  DashboardTableValidationError,
  deleteDashboardTable,
  getDashboardTableById,
  publishDashboardTable,
  saveDashboardTableDraft,
} from "../../_lib/table.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardTableDraftMutation,
  validateDashboardTableMutation,
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

const dashboardTableByIdHandler = async (
  request: Request
): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (!id) {
      return errorJson("Falta el identificador de la tabla.", 400);
    }

    if (request.method === "GET") {
      const table = await getDashboardTableById(id);
      return table ? json(table) : errorJson("Tabla no encontrada.", 404);
    }

    if (request.method === "PUT") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTableDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardTableDraft(id, validation.input));
      }

      const validation = await validateDashboardTableMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTable(id, validation.input));
    }

    if (request.method === "DELETE") {
      await deleteDashboardTable(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para modificar tablas.",
        500
      );
    }

    if (error instanceof DashboardTableValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar la tabla. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardTableByIdHandler,
};
