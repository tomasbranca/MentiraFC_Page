import {
  DEFAULT_FOOTER_SETTINGS,
  type FooterLink,
  type FooterSettings,
  type FooterSocialLink,
  type FooterSponsor,
} from "../../../../shared/site/footerSettings";
import {
  sanityFooterSettingsSchema,
  type SanityFooterSettings,
} from "../schemas";
import { validateSanityItem } from "../validation";

const trimText = (value: string | null | undefined): string =>
  value?.trim() ?? "";

const isAllowedUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value) || value.startsWith("/");

const normalizeItemId = (
  value: string | null | undefined,
  fallback: string
): string => {
  const normalized = trimText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
};

const adaptSocials = (
  socials: SanityFooterSettings["socials"]
): FooterSocialLink[] =>
  (socials ?? [])
    .map((item, index) => {
      const label = trimText(item.label);
      const url = trimText(item.url);

      if (!label || !isAllowedUrl(url)) return null;

      return {
        id: normalizeItemId(item._key, `${item.platform}-${index}`),
        label,
        platform: item.platform,
        url,
      };
    })
    .filter((item): item is FooterSocialLink => Boolean(item));

const adaptLinks = (links: SanityFooterSettings["links"]): FooterLink[] =>
  (links ?? [])
    .map((item, index) => {
      const label = trimText(item.label);
      const url = trimText(item.url);

      if (!label || !isAllowedUrl(url)) return null;

      return {
        id: normalizeItemId(item._key, `link-${index}`),
        label,
        url,
      };
    })
    .filter((item): item is FooterLink => Boolean(item));

const adaptSponsors = (
  sponsors: SanityFooterSettings["sponsors"]
): FooterSponsor[] =>
  (sponsors ?? [])
    .map((item, index) => {
      const name = trimText(item.name);
      const url = trimText(item.url);
      const logoUrl = trimText(item.resolvedLogoUrl);

      if (!name || !isAllowedUrl(url) || !logoUrl) return null;

      return {
        id: normalizeItemId(item._key, `sponsor-${index}`),
        name,
        url,
        logoUrl,
        logoAlt: trimText(item.logoAlt) || name,
      };
    })
    .filter((item): item is FooterSponsor => Boolean(item));

export const adaptFooterSettings = (input: unknown): FooterSettings => {
  const validated = validateSanityItem(
    sanityFooterSettingsSchema,
    input,
    "footerSettings.adapter:adaptFooterSettings"
  );

  if (!validated) {
    return DEFAULT_FOOTER_SETTINGS;
  }

  return {
    id: validated._id || DEFAULT_FOOTER_SETTINGS.id,
    contactEmail:
      trimText(validated.contactEmail) ||
      DEFAULT_FOOTER_SETTINGS.contactEmail,
    socials: adaptSocials(validated.socials),
    links: adaptLinks(validated.links),
    sponsors: adaptSponsors(validated.sponsors),
    updatedAt: validated._updatedAt ?? null,
  };
};
