export const NEWS_QUERY = `
  *[_type == "news"] | order(date desc) {
    _id,
    title,
    description,
    content,
    date,
    slug,
    "imageUrl": image.asset->url
  }
`;

export const NEWS_BY_SLUG_QUERY = `
  *[_type == "news" && slug.current == $slug][0] {
    _id,
    title,
    description,
    content,
    date,
    slug,
    "imageUrl": image.asset->url
  }
`;

export const SUGGESTED_NEWS_QUERY = `
  *[_type == "news" && slug.current != $slug && date >= $date]
  | order(date desc)[0...10] {
    _id,
    title,
    description,
    "slug": slug,
    date,
    "imageUrl": image.asset->url
  }
`;

export const FALLBACK_NEWS_QUERY = `
  *[_type == "news" && slug.current != $slug]
  | order(date desc)[0...10] {
    _id,
    title,
    description,
    "slug": slug,
    date,
    "imageUrl": image.asset->url
  }
`;
