import { describe, expect, it } from "vitest";

import type { NewsItem, Player } from "../../types/models";
import {
  buildMissingNewsHead,
  buildNewsHead,
  buildPlayerHead,
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
      imageUrl: "/custom-og.png",
    };

    const metadata = buildNewsHead(newsItem);

    expect(metadata.title).toBe("Victoria importante | Mentira FC");
    expect(metadata.description).toBe("Mentira FC gano un partido clave.");
    expect(metadata.canonicalUrl).toBe(
      "https://mentirafc.vercel.app/noticias/victoria-importante"
    );
    expect(metadata.imageUrl).toBe("https://mentirafc.vercel.app/custom-og.png");
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

  it("marks missing dynamic pages as noindex", () => {
    expect(buildMissingNewsHead("no-existe").robots).toBe("noindex, follow");
    expect(STATIC_PAGE_HEAD.admin.robots).toBe("noindex, nofollow");
  });

  it("resolves static route metadata and ignores dynamic routes", () => {
    expect(getStaticPageHeadByPathname("/noticias/")).toBe(
      STATIC_PAGE_HEAD.news
    );
    expect(getStaticPageHeadByPathname("/plantel/tomas-brancatisano")).toBeNull();
  });
});
