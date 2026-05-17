import {
  createDashboardNews,
  deleteDashboardNews,
  getDashboardNewsById,
  listDashboardNews,
  updateDashboardNews,
} from "../../_lib/news.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { validateDashboardNewsMutation } from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id || null;
};

const dashboardNewsHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (request.method === "GET" && id) {
      const news = await getDashboardNewsById(id);
      return news ? json(news) : errorJson("Noticia no encontrada.", 404);
    }

    if (request.method === "GET") {
      return json(await listDashboardNews());
    }

    if (request.method === "POST") {
      const validation = await validateDashboardNewsMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await createDashboardNews(validation.input), { status: 201 });
    }

    if (request.method === "PUT") {
      if (!id) {
        return errorJson("Falta el identificador de la noticia.", 400);
      }

      const validation = await validateDashboardNewsMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await updateDashboardNews(id, validation.input));
    }

    if (request.method === "DELETE") {
      if (!id) {
        return errorJson("Falta el identificador de la noticia.", 400);
      }

      await deleteDashboardNews(id);
      return json(null);
    }

    return errorJson("Método no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_WRITE_TOKEN para crear o modificar noticias.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar las noticias. Verificá la configuración del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardNewsHandler,
};
