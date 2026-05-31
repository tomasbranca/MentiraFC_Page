import { describe, expect, it } from "vitest";

import { DEFAULT_FOOTER_SETTINGS } from "../../../../shared/site/footerSettings";
import { adaptFooterSettings } from "./footerSettings.adapter";

describe("footerSettings adapter", () => {
  it("normaliza settings validos sin exponer el nombre del club", () => {
    const settings = adaptFooterSettings({
      _id: "footerSettings",
      _updatedAt: "2026-05-31T12:00:00Z",
      contactEmail: " prensa@mentirafc.com ",
      socials: [
        {
          _key: "ig",
          label: " Instagram ",
          platform: "instagram",
          url: "https://instagram.com/mentira.fc",
        },
      ],
      links: [
        {
          _key: "contacto",
          label: "Contacto",
          url: "https://mentirafc.com/contacto",
        },
      ],
      sponsors: [
        {
          _key: "neo",
          name: "NeoKings",
          url: "https://www.neokings.com.ar",
          resolvedLogoUrl: "/sponsors/neokings-160.webp",
          logoAlt: "",
        },
      ],
    });

    expect(settings).toEqual({
      id: "footerSettings",
      updatedAt: "2026-05-31T12:00:00Z",
      contactEmail: "prensa@mentirafc.com",
      socials: [
        {
          id: "ig",
          label: "Instagram",
          platform: "instagram",
          url: "https://instagram.com/mentira.fc",
        },
      ],
      links: [
        {
          id: "contacto",
          label: "Contacto",
          url: "https://mentirafc.com/contacto",
        },
      ],
      sponsors: [
        {
          id: "neo",
          name: "NeoKings",
          url: "https://www.neokings.com.ar",
          logoUrl: "/sponsors/neokings-160.webp",
          logoAlt: "NeoKings",
        },
      ],
    });
    expect("clubName" in settings).toBe(false);
  });

  it("filtra sponsors incompletos y vuelve al default si falta el documento", () => {
    const settings = adaptFooterSettings({
      _id: "footerSettings",
      contactEmail: "",
      sponsors: [
        {
          _key: "bad",
          name: "Sponsor sin logo",
          url: "https://example.com",
          resolvedLogoUrl: "",
        },
      ],
    });

    expect(settings.contactEmail).toBe(DEFAULT_FOOTER_SETTINGS.contactEmail);
    expect(settings.sponsors).toEqual([]);
    expect(adaptFooterSettings(null)).toEqual(DEFAULT_FOOTER_SETTINGS);
  });
});
