import {
  DashboardTableValidationError,
  deleteDashboardTable,
  getDashboardTableById,
  getDashboardTableOptions,
  listDashboardTables,
  publishDashboardTable,
  saveDashboardTableDraft,
} from "../../_lib/table.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { DASHBOARD_RESOURCE_PERMISSIONS } from "../../../src/domain/auth/permissions";
import {
  validateDashboardTableDraftMutation,
  validateDashboardTableMutation,
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
    return DASHBOARD_RESOURCE_PERMISSIONS.table.create;
  }

  if (request.method === "PUT") {
    return DASHBOARD_RESOURCE_PERMISSIONS.table.edit;
  }

  if (request.method === "DELETE") {
    return DASHBOARD_RESOURCE_PERMISSIONS.table.delete;
  }

  return DASHBOARD_RESOURCE_PERMISSIONS.table.view;
};

const dashboardTableHandler = async (request: Request): Promise<Response> => {
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
      return json(await getDashboardTableOptions());
    }

    if (request.method === "GET" && id) {
      const table = await getDashboardTableById(id);
      return table ? json(table) : errorJson("Tabla no encontrada.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardTables());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardTableDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardTableDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardTableMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardTable(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador de la tabla.", 400);
      }

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
      if (!id) {
        return errorJson("Falta el identificador de la tabla.", 400);
      }

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
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar tablas.",
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
  fetch: dashboardTableHandler,
};
