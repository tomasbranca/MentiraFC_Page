import {
  deleteDashboardStaff,
  getDashboardStaffById,
  listDashboardStaff,
  publishDashboardStaff,
  saveDashboardStaffDraft,
} from "../../_lib/staff.js";
import { authorizeDashboardRequest } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardStaffDraftMutation,
  validateDashboardStaffMutation,
} from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const getIntentFromRequest = (request: Request): "draft" | "publish" => {
  const intent = new URL(request.url).searchParams.get("intent")?.trim();
  return intent === "draft" ? "draft" : "publish";
};

const dashboardStaffHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "staff");

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const staffMember = await getDashboardStaffById(id);
      return staffMember
        ? json(staffMember)
        : errorJson("Integrante no encontrado.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardStaff());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardStaffDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardStaffDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardStaffMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardStaff(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador del integrante.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardStaffDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardStaffDraft(id, validation.input));
      }

      const validation = await validateDashboardStaffMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardStaff(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador del integrante.", 400);
      }

      await deleteDashboardStaff(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar integrantes del plantel.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar el plantel. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardStaffHandler,
};
