export type OpenGraphType = "website" | "article" | "profile";
export type TwitterCard = "summary" | "summary_large_image";

export interface HeadMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  openGraphType?: OpenGraphType;
  twitterCard?: TwitterCard;
  robots?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
}

type MetaAttribute = "name" | "property";

const MANAGED_OPTIONAL_META: Array<[MetaAttribute, string]> = [
  ["property", "article:published_time"],
  ["property", "article:modified_time"],
  ["property", "og:image:alt"],
  ["name", "twitter:image:alt"],
];

const findMeta = (
  attribute: MetaAttribute,
  key: string
): HTMLMetaElement | null =>
  document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

const upsertMeta = (
  attribute: MetaAttribute,
  key: string,
  content: string
): HTMLMetaElement => {
  const existing = findMeta(attribute, key);

  if (existing) {
    existing.content = content;
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = content;
  document.head.appendChild(meta);

  return meta;
};

const removeMeta = (attribute: MetaAttribute, key: string) => {
  findMeta(attribute, key)?.remove();
};

const upsertOptionalMeta = (
  attribute: MetaAttribute,
  key: string,
  content?: string | null
) => {
  if (!content) {
    removeMeta(attribute, key);
    return;
  }

  upsertMeta(attribute, key, content);
};

const upsertCanonical = (href: string) => {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );

  if (existing) {
    existing.href = href;
    return;
  }

  const link = document.createElement("link");
  link.rel = "canonical";
  link.href = href;
  document.head.appendChild(link);
};

export const applyHeadMetadata = (metadata: HeadMetadata) => {
  document.title = metadata.title;
  upsertCanonical(metadata.canonicalUrl);

  upsertMeta("name", "description", metadata.description);
  upsertMeta("name", "robots", metadata.robots ?? "index, follow");

  upsertMeta("property", "og:title", metadata.title);
  upsertMeta("property", "og:description", metadata.description);
  upsertMeta("property", "og:image", metadata.imageUrl);
  upsertMeta("property", "og:url", metadata.canonicalUrl);
  upsertMeta("property", "og:type", metadata.openGraphType ?? "website");

  upsertMeta("property", "og:image:width", String(metadata.imageWidth ?? 1200));
  upsertMeta("property", "og:image:height", String(metadata.imageHeight ?? 630));

  upsertMeta("name", "twitter:card", metadata.twitterCard ?? "summary_large_image");
  upsertMeta("name", "twitter:title", metadata.title);
  upsertMeta("name", "twitter:description", metadata.description);
  upsertMeta("name", "twitter:image", metadata.imageUrl);

  upsertOptionalMeta("property", "article:published_time", metadata.publishedTime);
  upsertOptionalMeta("property", "article:modified_time", metadata.modifiedTime);
  upsertOptionalMeta("property", "og:image:alt", metadata.imageAlt);
  upsertOptionalMeta("name", "twitter:image:alt", metadata.imageAlt);

  for (const [attribute, key] of MANAGED_OPTIONAL_META) {
    const shouldKeep =
      (key === "article:published_time" && metadata.publishedTime) ||
      (key === "article:modified_time" && metadata.modifiedTime) ||
      ((key === "og:image:alt" || key === "twitter:image:alt") &&
        metadata.imageAlt);

    if (!shouldKeep) {
      removeMeta(attribute, key);
    }
  }
};
