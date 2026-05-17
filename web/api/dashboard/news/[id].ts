import {
  deleteDashboardNews,
  getDashboardNewsById,
  updateDashboardNews,
} from "../../_lib/news.js";
import { authorizeDashboardUser } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { validateDashboardNewsMutation } from "./_shared.js";

const getIdFromRequest = (request: Request): string | null => {
  const pathname = new URL(request.url).pathname;
  const id = pathname.split("/").filter(Boolean).at(-1);

  return id ?? null;
};

const dashboardNewsByIdHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);

    if (!id) {
      return errorJson("Falta el identificador de la noticia.", 400);
    }

    if (request.method === "GET") {
      const news = await getDashboardNewsById(id);
      return news ? json(news) : errorJson("Noticia no encontrada.", 404);
    }

    if (request.method === "PUT") {
      const validation = await validateDashboardNewsMutation(request);

      if (!validation.ok) {
        return validation.response;
      }

      return json(await updateDashboardNews(id, validation.input));
    }

    if (request.method === "DELETE") {
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
        "Falta configurar SANITY_WRITE_TOKEN para modificar noticias.",
        500
      );
    }

    return errorJson(
      "No pudimos procesar la noticia. Verificá la configuración del backend.",
      500
    );
  }
};

export default {
  fetch: dashboardNewsByIdHandler,
};
