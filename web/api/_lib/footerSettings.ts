import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SOCIAL_PLATFORMS,
  type FooterLink,
  type FooterSettings,
  type FooterSocialLink,
  type FooterSocialPlatform,
  type FooterSponsor,
} from "../../shared/site/footerSettings.js";
import { mutateSanity, querySanity } from "./sanity.js";

const FOOTER_SETTINGS_ID = "footerSettings";

const FOOTER_SETTINGS_QUERY = `
  *[_type == "footerSettings" && _id == "footerSettings"][0] {
    _id,
    _updatedAt,
    contactEmail,
    socials[]{
      _key,
      label,
      platform,
      url
    },
    links[]{
      _key,
      label,
      url
    },
    sponsors[]{
      _key,
      name,
      url,
      logoAlt,
      "resolvedLogoUrl": coalesce(logo.asset->url, logoUrl)
    }
  }
`;

type FooterSettingsDocument = {
  _id?: string;
  _updatedAt?: string | null;
  contactEmail?: string | null;
  socials?: Array<{
    _key?: string | null;
    label?: string | null;
    platform?: string | null;
    url?: string | null;
  }> | null;
  links?: Array<{
    _key?: string | null;
    label?: string | null;
    url?: string | null;
  }> | null;
  sponsors?: Array<{
    _key?: string | null;
    name?: string | null;
    url?: string | null;
    logoAlt?: string | null;
    resolvedLogoUrl?: string | null;
  }> | null;
};

export type FooterSettingsMutationInput = {
  contactEmail?: unknown;
  socials?: unknown;
  links?: unknown;
  sponsors?: unknown;
};

const trimText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isAllowedUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value) || value.startsWith("/");

const isFooterSocialPlatform = (
  value: unknown
): value is FooterSocialPlatform =>
  typeof value === "string" &&
  FOOTER_SOCIAL_PLATFORMS.includes(value as FooterSocialPlatform);

const normalizeKey = (value: string, fallback: string): string => {
  const key = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return key || fallback;
};

const adaptSocials = (
  socials: FooterSettingsDocument["socials"]
): FooterSocialLink[] =>
  (socials ?? [])
    .map((item, index) => {
      const label = trimText(item.label);
      const url = trimText(item.url);

      if (!label || !isAllowedUrl(url) || !isFooterSocialPlatform(item.platform)) {
        return null;
      }

      return {
        id: normalizeKey(item._key ?? label, `${item.platform}-${index}`),
        label,
        platform: item.platform,
        url,
      };
    })
    .filter((item): item is FooterSocialLink => Boolean(item));

const adaptLinks = (links: FooterSettingsDocument["links"]): FooterLink[] =>
  (links ?? [])
    .map((item, index) => {
      const label = trimText(item.label);
      const url = trimText(item.url);

      if (!label || !isAllowedUrl(url)) return null;

      return {
        id: normalizeKey(item._key ?? label, `link-${index}`),
        label,
        url,
      };
    })
    .filter((item): item is FooterLink => Boolean(item));

const adaptSponsors = (
  sponsors: FooterSettingsDocument["sponsors"]
): FooterSponsor[] =>
  (sponsors ?? [])
    .map((item, index) => {
      const name = trimText(item.name);
      const url = trimText(item.url);
      const logoUrl = trimText(item.resolvedLogoUrl);

      if (!name || !isAllowedUrl(url) || !logoUrl) return null;

      return {
        id: normalizeKey(item._key ?? name, `sponsor-${index}`),
        name,
        url,
        logoUrl,
        logoAlt: trimText(item.logoAlt) || name,
      };
    })
    .filter((item): item is FooterSponsor => Boolean(item));

const adaptFooterSettingsDocument = (
  document: FooterSettingsDocument | null | undefined
): FooterSettings => {
  if (!document) {
    return DEFAULT_FOOTER_SETTINGS;
  }

  return {
    id: document._id ?? FOOTER_SETTINGS_ID,
    contactEmail:
      trimText(document.contactEmail) ||
      DEFAULT_FOOTER_SETTINGS.contactEmail,
    socials: adaptSocials(document.socials),
    links: adaptLinks(document.links),
    sponsors: adaptSponsors(document.sponsors),
    updatedAt: document._updatedAt ?? null,
  };
};

export const getFooterSettingsForAdmin = async (): Promise<FooterSettings> =>
  adaptFooterSettingsDocument(
    await querySanity<FooterSettingsDocument | null>(FOOTER_SETTINGS_QUERY, {
      useToken: true,
      perspective: "raw",
    })
  );

const requireArray = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} debe ser una lista.`);
  }

  return value;
};

const normalizeSocialMutation = (
  value: unknown,
  index: number
): FooterSocialLink => {
  const record = typeof value === "object" && value ? value as Record<string, unknown> : {};
  const label = trimText(record.label);
  const platform = record.platform;
  const url = trimText(record.url);

  if (!label || !isFooterSocialPlatform(platform) || !isAllowedUrl(url)) {
    throw new Error("Revisa las redes sociales del footer.");
  }

  return {
    id: normalizeKey(trimText(record.id) || label, `${platform}-${index}`),
    label,
    platform,
    url,
  };
};

const normalizeLinkMutation = (value: unknown, index: number): FooterLink => {
  const record = typeof value === "object" && value ? value as Record<string, unknown> : {};
  const label = trimText(record.label);
  const url = trimText(record.url);

  if (!label || !isAllowedUrl(url)) {
    throw new Error("Revisa los links del footer.");
  }

  return {
    id: normalizeKey(trimText(record.id) || label, `link-${index}`),
    label,
    url,
  };
};

const normalizeSponsorMutation = (
  value: unknown,
  index: number
): FooterSponsor => {
  const record = typeof value === "object" && value ? value as Record<string, unknown> : {};
  const name = trimText(record.name);
  const url = trimText(record.url);
  const logoUrl = trimText(record.logoUrl);
  const logoAlt = trimText(record.logoAlt);

  if (!name || !isAllowedUrl(url) || !logoUrl) {
    throw new Error("Revisa los sponsors del footer.");
  }

  return {
    id: normalizeKey(trimText(record.id) || name, `sponsor-${index}`),
    name,
    url,
    logoUrl,
    logoAlt: logoAlt || name,
  };
};

export const normalizeFooterSettingsMutationInput = (
  input: FooterSettingsMutationInput
): FooterSettings => {
  const contactEmail = trimText(input.contactEmail);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("El email de contacto no es valido.");
  }

  return {
    id: FOOTER_SETTINGS_ID,
    contactEmail,
    socials: requireArray(input.socials, "socials").map(
      normalizeSocialMutation
    ),
    links: requireArray(input.links, "links").map(normalizeLinkMutation),
    sponsors: requireArray(input.sponsors, "sponsors").map(
      normalizeSponsorMutation
    ),
  };
};

const toSanitySocial = (social: FooterSocialLink) => ({
  _key: social.id,
  _type: "object",
  label: social.label,
  platform: social.platform,
  url: social.url,
});

const toSanityLink = (link: FooterLink) => ({
  _key: link.id,
  _type: "object",
  label: link.label,
  url: link.url,
});

const toSanitySponsor = (sponsor: FooterSponsor) => ({
  _key: sponsor.id,
  _type: "object",
  name: sponsor.name,
  url: sponsor.url,
  logoUrl: sponsor.logoUrl,
  logoAlt: sponsor.logoAlt,
});

export const saveFooterSettingsForAdmin = async (
  input: FooterSettingsMutationInput
): Promise<FooterSettings> => {
  const settings = normalizeFooterSettingsMutationInput(input);
  const document = await mutateSanity<FooterSettingsDocument>([
    {
      createOrReplace: {
        _id: FOOTER_SETTINGS_ID,
        _type: "footerSettings",
        contactEmail: settings.contactEmail,
        socials: settings.socials.map(toSanitySocial),
        links: settings.links.map(toSanityLink),
        sponsors: settings.sponsors.map(toSanitySponsor),
      },
    },
  ]);

  return adaptFooterSettingsDocument(document);
};
