import {
  DashboardOrganizationValidationError,
  deleteDashboardOrganization,
  getDashboardOrganizationById,
  listDashboardOrganizations,
  publishDashboardOrganization,
  saveDashboardOrganizationDraft,
} from "../organizations.js";
import { authorizeDashboardRequest } from "../auth.js";
import { errorJson, json } from "../responses.js";
import {
  validateDashboardOrganizationDraftMutation,
  validateDashboardOrganizationMutation,
} from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const dashboardOrganizationsHandler = async (
  request: Request
): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(
      request,
      "organizations"
    );

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const organization = await getDashboardOrganizationById(id);
      return organization
        ? json(organization)
        : errorJson("Organizador no encontrado.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardOrganizations());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation =
          await validateDashboardOrganizationDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(
          await saveDashboardOrganizationDraft(null, validation.input),
          { status: 201 }
        );
      }

      const validation = await validateDashboardOrganizationMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardOrganization(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del organizador.", 400);
      }

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
      if (!id) {
        return errorJson("Falta el identificador del organizador.", 400);
      }

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
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar organizadores.",
        500
      );
    }

    if (error instanceof DashboardOrganizationValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar los organizadores. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardOrganizationsHandler,
};
