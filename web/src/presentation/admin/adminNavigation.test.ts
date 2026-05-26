import { describe, expect, it } from "vitest";

import { ROUTES } from "../../shared/routing";
import { getAdminNavigationContext } from "./adminNavigation";

describe("adminNavigation", () => {
  it("identifica el inicio del panel admin", () => {
    const context = getAdminNavigationContext(ROUTES.ADMIN);

    expect(context.title).toBe("Panel admin");
    expect(context.actionLabel).toBe("Vista general");
    expect(context.currentSection.id).toBe("home");
    expect(context.breadcrumbs.map((item) => item.label)).toEqual(["Admin"]);
  });

  it("identifica la cola de reportes", () => {
    const context = getAdminNavigationContext(ROUTES.ADMIN_COMMENT_REPORTS);

    expect(context.title).toBe("Reportes");
    expect(context.actionLabel).toBe("Cola de reportes");
    expect(context.currentSection.id).toBe("commentReports");
    expect(context.breadcrumbs.map((item) => item.label)).toEqual([
      "Admin",
      "Reportes",
    ]);
  });

  it("normaliza barras finales", () => {
    const context = getAdminNavigationContext(
      `${ROUTES.ADMIN_COMMENT_REPORTS}/`
    );

    expect(context.currentSection.id).toBe("commentReports");
  });
});
