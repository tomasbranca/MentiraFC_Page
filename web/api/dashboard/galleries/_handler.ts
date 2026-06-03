import {
  DASHBOARD_GALLERIES_PAGE_PHOTO_FILTERS,
  DASHBOARD_GALLERIES_PAGE_SORT_BY,
  DASHBOARD_GALLERIES_PAGE_STATUS_FILTERS,
  DashboardGalleryValidationError,
  deleteDashboardGallery,
  getDashboardGalleryById,
  getDashboardGalleryOptions,
  getDashboardGalleriesPage,
  listDashboardGalleries,
  publishDashboardGallery,
  saveDashboardGalleryDraft,
} from "../../_lib/galleries.js";
import { authorizeDashboardRequest } from "../../_lib/auth.js";
import { errorJson, json } from "../../_lib/responses.js";
import { parseOffsetPaginationParams } from "../../../shared/pagination.js";
import {
  validateDashboardGalleryDraftMutation,
  validateDashboardGalleryMutation,
} from "./_shared.js";

const PAGINATION_PARAM_NAMES = [
  "page",
  "limit",
  "sortBy",
  "direction",
  "search",
  "status",
  "photos",
  "cursor",
] as const;

type DashboardGalleriesStatusFilter =
  (typeof DASHBOARD_GALLERIES_PAGE_STATUS_FILTERS)[number];
type DashboardGalleriesPhotoFilter =
  (typeof DASHBOARD_GALLERIES_PAGE_PHOTO_FILTERS)[number];

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

const shouldUsePaginatedResponse = (searchParams: URLSearchParams): boolean =>
  PAGINATION_PARAM_NAMES.some((paramName) => searchParams.has(paramName));

const parseDashboardGalleriesStatusFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; status: DashboardGalleriesStatusFilter | null }
  | { ok: false; message: string } => {
  const status = searchParams.get("status")?.trim();

  if (!status || status === "all") {
    return { ok: true, status: null };
  }

  if (
    DASHBOARD_GALLERIES_PAGE_STATUS_FILTERS.includes(
      status as DashboardGalleriesStatusFilter
    )
  ) {
    return { ok: true, status: status as DashboardGalleriesStatusFilter };
  }

  return {
    ok: false,
    message: "El filtro de publicacion no esta permitido para este listado.",
  };
};

const parseDashboardGalleriesPhotoFilter = (
  searchParams: URLSearchParams
):
  | { ok: true; photos: DashboardGalleriesPhotoFilter | null }
  | { ok: false; message: string } => {
  const photos = searchParams.get("photos")?.trim();

  if (!photos || photos === "all") {
    return { ok: true, photos: null };
  }

  if (
    DASHBOARD_GALLERIES_PAGE_PHOTO_FILTERS.includes(
      photos as DashboardGalleriesPhotoFilter
    )
  ) {
    return { ok: true, photos: photos as DashboardGalleriesPhotoFilter };
  }

  return {
    ok: false,
    message: "El filtro de fotos no esta permitido para este listado.",
  };
};

const dashboardGalleryHandler = async (request: Request): Promise<Response> => {
  try {
    const authorization = await authorizeDashboardRequest(request, "galleries");

    if (authorization instanceof Response) {
      return authorization;
    }

    const id = getIdFromRequest(request);
    const url = new URL(request.url);

    if (request.method === "GET" && shouldLoadOptions(request)) {
      return json(await getDashboardGalleryOptions());
    }

    if (request.method === "GET" && id) {
      const gallery = await getDashboardGalleryById(id);
      return gallery ? json(gallery) : errorJson("Galeria no encontrada.", 404);
    }

    if (request.method === "GET") {
      if (shouldUsePaginatedResponse(url.searchParams)) {
        const pagination = parseOffsetPaginationParams(url.searchParams, {
          allowedSortBy: DASHBOARD_GALLERIES_PAGE_SORT_BY,
          defaultSortBy: "date",
        });

        if (!pagination.ok) {
          return errorJson(
            pagination.issues[0]?.message ?? "Paginacion invalida.",
            400
          );
        }

        const statusFilter = parseDashboardGalleriesStatusFilter(
          url.searchParams
        );

        if (!statusFilter.ok) {
          return errorJson(statusFilter.message, 400);
        }

        const photoFilter = parseDashboardGalleriesPhotoFilter(
          url.searchParams
        );

        if (!photoFilter.ok) {
          return errorJson(photoFilter.message, 400);
        }

        return json(
          await getDashboardGalleriesPage(pagination.params, {
            status: statusFilter.status,
            photos: photoFilter.photos,
          })
        );
      }

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
