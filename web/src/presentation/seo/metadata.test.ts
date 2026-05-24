import { describe, expect, it } from "vitest";

import type { NewsItem, Player, StaffMember } from "../../types/models";
import {
  buildMissingNewsHead,
  buildNewsHead,
  buildPlayerHead,
  buildStaffHead,
  DEFAULT_HEAD,
  getStaticPageHeadByPathname,
  STATIC_PAGE_HEAD,
} from "./metadata";

describe("seo metadata", () => {
  it("builds article metadata for a news detail", () => {
    const newsItem: NewsItem = {
      id: "news-1",
      title: "Victoria importante",
      description: "Mentira FC gano un partido clave.",
      date: "2026-04-30",
      slug: "victoria-importante",
      imageAlt: "Mentira FC festejando un gol",
      imageUrl: "/custom-og.png",
    };

    const metadata = buildNewsHead(newsItem);

    expect(metadata.title).toBe("Victoria importante | Mentira FC");
    expect(metadata.description).toBe("Mentira FC gano un partido clave.");
    expect(metadata.canonicalUrl).toBe(
      "https://mentirafc.vercel.app/noticias/victoria-importante"
    );
    expect(metadata.imageUrl).toBe("https://mentirafc.vercel.app/custom-og.png");
    expect(metadata.imageAlt).toBe("Mentira FC festejando un gol");
    expect(metadata.openGraphType).toBe("article");
    expect(metadata.publishedTime).toBe("2026-04-30");
  });

  it("builds profile metadata for a player detail", () => {
    const player: Player = {
      id: "player-1",
      name: "Tomas",
      lastName: "Brancatisano",
      fullName: "Tomas Brancatisano",
      slug: "tomas-brancatisano",
      number: 10,
      position: "del",
      imageUrl: null,
    };

    const metadata = buildPlayerHead(player, "DELANTERO");

    expect(metadata.title).toBe("Tomas Brancatisano | Mentira FC");
    expect(metadata.description).toContain("camiseta 10");
    expect(metadata.description).toContain("delantero");
    expect(metadata.canonicalUrl).toBe(
      "https://mentirafc.vercel.app/plantel/tomas-brancatisano"
    );
    expect(metadata.imageUrl).toBe(DEFAULT_HEAD.imageUrl);
    expect(metadata.openGraphType).toBe("profile");
  });

  it("builds profile metadata for a staff detail without shirt number", () => {
    const staffMember: StaffMember = {
      id: "staff-1",
      name: "Juan",
      lastName: "Perez",
      fullName: "Juan Perez",
      slug: "juan-perez",
      role: "Director tecnico",
      imageUrl: null,
    };

    const metadata = buildStaffHead(staffMember);

    expect(metadata.title).toBe("Juan Perez | Mentira FC");
    expect(metadata.description).toContain("director tecnico");
    expect(metadata.description).not.toContain("camiseta");
    expect(metadata.canonicalUrl).toBe(
      "https://mentirafc.vercel.app/plantel/staff/juan-perez"
    );
    expect(metadata.openGraphType).toBe("profile");
  });

  it("marks missing dynamic pages as noindex", () => {
    expect(buildMissingNewsHead("no-existe").robots).toBe("noindex, follow");
    expect(STATIC_PAGE_HEAD.login.robots).toBe("noindex, nofollow");
    expect(STATIC_PAGE_HEAD.passwordResetRequest.robots).toBe(
      "noindex, nofollow"
    );
    expect(STATIC_PAGE_HEAD.passwordResetUpdate.robots).toBe(
      "noindex, nofollow"
    );
    expect(STATIC_PAGE_HEAD.account.robots).toBe("noindex, nofollow");
    expect(STATIC_PAGE_HEAD.dashboard.robots).toBe("noindex, nofollow");
  });

  it("resolves static route metadata and ignores dynamic routes", () => {
    expect(getStaticPageHeadByPathname("/noticias/")).toBe(
      STATIC_PAGE_HEAD.news
    );
    expect(getStaticPageHeadByPathname("/dashboard/noticias/123")).toBe(
      STATIC_PAGE_HEAD.dashboard
    );
    expect(getStaticPageHeadByPathname("/recuperar-contrasena")).toBe(
      STATIC_PAGE_HEAD.passwordResetRequest
    );
    expect(getStaticPageHeadByPathname("/nueva-contrasena")).toBe(
      STATIC_PAGE_HEAD.passwordResetUpdate
    );
    expect(getStaticPageHeadByPathname("/plantel/tomas-brancatisano")).toBeNull();
  });
});
