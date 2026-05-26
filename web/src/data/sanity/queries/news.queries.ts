const PUBLISHED_NEWS_FILTER = `_type == "news" && !(_id in path("drafts.**"))`;

export const NEWS_QUERY = `
  *[${PUBLISHED_NEWS_FILTER}] | order(date desc) {
    _id,
    title,
    description,
    date,
    slug,
    "imageAlt": image.alt,
    "imageUrl": image.asset->url
  }
`;

export const NEWS_BY_SLUG_QUERY = `
  *[${PUBLISHED_NEWS_FILTER} && slug.current == $slug][0] {
    _id,
    title,
    description,
    content[]{
      ...,
      "imageUrl": asset->url,
      "fileUrl": file.asset->url,
      "mimeType": file.asset->mimeType,
      "originalFilename": file.asset->originalFilename
    },
    date,
    slug,
    "imageAlt": image.alt,
    "imageUrl": image.asset->url
  }
`;

export const SUGGESTED_NEWS_QUERY = `
  *[${PUBLISHED_NEWS_FILTER} && slug.current != $slug && date >= $date]
  | order(date desc)[0...10] {
    _id,
    title,
    description,
    "slug": slug,
    date,
    "imageAlt": image.alt,
    "imageUrl": image.asset->url
  }
`;

export const FALLBACK_NEWS_QUERY = `
  *[${PUBLISHED_NEWS_FILTER} && slug.current != $slug]
  | order(date desc)[0...10] {
    _id,
    title,
    description,
    "slug": slug,
    date,
    "imageAlt": image.alt,
    "imageUrl": image.asset->url
  }
`;
