import {
  DashboardOrganizationValidationError,
  deleteDashboardOrganization,
  getDashboardOrganizationById,
  publishDashboardOrganization,
  saveDashboardOrganizationDraft,
} from "../../_lib/organizations.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardOrganizationDraftMutation,
  validateDashboardOrganizationMutation,
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

const dashboardOrganizationByIdHandler = async (
  request: Request
): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (!id) {
      return errorJson("Falta el identificador del organizador.", 400);
    }

    if (request.method === "GET") {
      const organization = await getDashboardOrganizationById(id);
      return organization
        ? json(organization)
        : errorJson("Organizador no encontrado.", 404);
    }

    if (request.method === "PUT") {
      if (getIntentFromRequest(request) === "draft") {
        const validation =
          await validateDashboardOrganizationDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardOrganizationDraft(id, validation.input));
      }

      const validation = await validateDashboardOrganizationMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardOrganization(id, validation.input));
    }

    if (request.method === "DELETE") {
      await deleteDashboardOrganization(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para modificar organizadores.",
        500
      );
    }

    if (error instanceof DashboardOrganizationValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar el organizador. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardOrganizationByIdHandler,
};
