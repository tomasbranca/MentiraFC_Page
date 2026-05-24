import { describe, expect, it } from "vitest";

import { ROUTES } from "../../shared/routing";
import { getDashboardNavigationContext } from "./dashboardNavigation";

describe("dashboardNavigation", () => {
  it("identifies a dashboard list route", () => {
    const context = getDashboardNavigationContext(ROUTES.DASHBOARD_MATCHES);

    expect(context.title).toBe("Partidos");
    expect(context.actionLabel).toBe("Listado");
    expect(context.isFormRoute).toBe(false);
    expect(context.listRoute).toBe(ROUTES.DASHBOARD_MATCHES);
    expect(context.breadcrumbs.map((item) => item.label)).toEqual([
      "Dashboard",
      "Partidos",
    ]);
  });

  it("labels edit routes and exposes the list route", () => {
    const context = getDashboardNavigationContext(
      ROUTES.DASHBOARD_NEWS_EDIT("news-123")
    );

    expect(context.title).toBe("Noticias");
    expect(context.actionLabel).toBe("Editar noticia");
    expect(context.isFormRoute).toBe(true);
    expect(context.listRoute).toBe(ROUTES.DASHBOARD_NEWS);
    expect(context.breadcrumbs.map((item) => item.label)).toEqual([
      "Dashboard",
      "Noticias",
      "Editar noticia",
    ]);
  });

  it("keeps staff forms under the Plantel section", () => {
    const context = getDashboardNavigationContext(ROUTES.DASHBOARD_STAFF_NEW);

    expect(context.title).toBe("Plantel");
    expect(context.actionLabel).toBe("Nuevo integrante");
    expect(context.listRoute).toBe(ROUTES.DASHBOARD_PLAYERS);
    expect(context.breadcrumbs.map((item) => item.label)).toEqual([
      "Dashboard",
      "Plantel",
      "Nuevo integrante",
    ]);
  });

  it("normalizes trailing slashes", () => {
    const context = getDashboardNavigationContext(
      `${ROUTES.DASHBOARD_TABLE_NEW}/`
    );

    expect(context.title).toBe("Tabla");
    expect(context.actionLabel).toBe("Nueva tabla");
  });
});
