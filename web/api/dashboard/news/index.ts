import {
  createDashboardNews,
  listDashboardNews,
  parseDashboardNewsInput,
} from "../../_lib/news";
import { authorizeDashboardUser } from "../../_lib/auth";
import { errorJson, json } from "../../_lib/responses";

const dashboardNewsHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardUser(request);

    if (authorization instanceof Response) {
      return authorization;
    }

    if (request.method === "GET") {
      return json(await listDashboardNews());
    }

    if (request.method === "POST") {
      const input = parseDashboardNewsInput(await request.json());

      if (!input) {
        return errorJson("Los datos de la noticia no son válidos.", 400);
      }

      return json(await createDashboardNews(input), { status: 201 });
    }

    return errorJson("Método no permitido.", 405);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Sanity write token is not configured."
    ) {
      return errorJson(
        "Falta configurar SANITY_WRITE_TOKEN para crear noticias.",
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
