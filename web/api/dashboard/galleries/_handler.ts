import {
  DashboardGalleryValidationError,
  deleteDashboardGallery,
  getDashboardGalleryById,
  getDashboardGalleryOptions,
  listDashboardGalleries,
  publishDashboardGallery,
  saveDashboardGalleryDraft,
} from "../../_lib/galleries.js";
import { authorizeDashboardRequest } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import {
  validateDashboardGalleryDraftMutation,
  validateDashboardGalleryMutation,
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

const dashboardGalleryHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "galleries");

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && shouldLoadOptions(request)) {
      return json(await getDashboardGalleryOptions());
    }

    if (request.method === "GET" && id) {
      const gallery = await getDashboardGalleryById(id);
      return gallery ? json(gallery) : errorJson("Galeria no encontrada.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardGalleries());
    }

    if (request.method === "POST") {
      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardGalleryDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardGalleryDraft(null, validation.input), {
          status: 201,
        });
      }

      const validation = await validateDashboardGalleryMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardGallery(null, validation.input), {
        status: 201,
      });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador de la galeria.", 400);
      }

      if (getIntentFromRequest(request) === "draft") {
        const validation = await validateDashboardGalleryDraftMutation(request);

        if (!validation.ok) {
          return validation.response;
        }

        return json(await saveDashboardGalleryDraft(id, validation.input));
      }

      const validation = await validateDashboardGalleryMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await publishDashboardGallery(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador de la galeria.", 400);
      }

      await deleteDashboardGallery(id);
      return json(null);
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_API_WRITE_TOKEN para crear o modificar galerias.",
        500
      );
    }

    if (error instanceof DashboardGalleryValidationError) {
      return errorJson(error.message, 400);
    }

    return errorJson(
      "No pudimos procesar la galeria. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardGalleryHandler,
};
