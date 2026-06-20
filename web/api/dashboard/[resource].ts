import dashboardMatchesRoute from "../_lib/dashboard-matches/_handler.js";
import dashboardGalleriesRoute from "../_lib/dashboard-galleries/_handler.js";
import dashboardNewsRoute from "../_lib/dashboard-news/_handler.js";
import dashboardOrganizationsRoute from "../_lib/dashboard-organizations/_handler.js";
import dashboardPlayersRoute from "../_lib/dashboard-players/_handler.js";
import dashboardStaffRoute from "../_lib/dashboard-staff/_handler.js";
import dashboardTableRoute from "../_lib/dashboard-table/_handler.js";
import dashboardTeamsRoute from "../_lib/dashboard-teams/_handler.js";
import dashboardTournamentsRoute from "../_lib/dashboard-tournaments/_handler.js";
import { errorJson } from "../_lib/responses.js";
import { normalizeOptionalSanityDocumentId } from "../_lib/requestValidation.js";

type DashboardRoute = {
  fetch: (request: Request) => Response | Promise<Response>;
};

const dashboardRoutes: Record<string, DashboardRoute> = {
  matches: dashboardMatchesRoute,
  galleries: dashboardGalleriesRoute,
  news: dashboardNewsRoute,
  organizations: dashboardOrganizationsRoute,
  players: dashboardPlayersRoute,
  staff: dashboardStaffRoute,
  table: dashboardTableRoute,
  teams: dashboardTeamsRoute,
  tournaments: dashboardTournamentsRoute,
};

const getDashboardResource = (request: Request): string | null => {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.lastIndexOf("dashboard");
  const resource = segments[dashboardIndex + 1]?.trim();

  return resource || null;
};

const dashboardRoute = {
  fetch: (request: Request): Response | Promise<Response> => {
    const resource = getDashboardResource(request);
    const route = resource ? dashboardRoutes[resource] : undefined;

    if (!route) {
      return errorJson("Recurso de dashboard no encontrado.", 404);
    }

    const idParam = normalizeOptionalSanityDocumentId(
      new URL(request.url).searchParams.get("id"),
      { allowDrafts: true }
    );

    if (idParam.invalid) {
      return errorJson("Identificador de dashboard invalido.", 400);
    }

    return route.fetch(request);
  },
};

export default dashboardRoute;
