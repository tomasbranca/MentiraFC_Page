const PUBLISHED_NEWS_FILTER = `_type == "news" && !(_id in path("drafts.**"))`;
const NEWS_LIST_PROJECTION = `{
    _id,
    title,
    description,
    date,
    slug,
    "imageAlt": image.alt,
    "imageUrl": image.asset->url
  }`;
const NEWS_PAGE_FILTER = `${PUBLISHED_NEWS_FILTER} && (!$hasSearch || title match $search || description match $search || slug.current match $search)`;

export const NEWS_QUERY = `
  *[${PUBLISHED_NEWS_FILTER}] | order(date desc) ${NEWS_LIST_PROJECTION}
`;

const NEWS_PAGE_QUERIES = {
  "date:desc": `{
    "items": *[${NEWS_PAGE_FILTER}] | order(date desc, _id desc)[$offset...$end] ${NEWS_LIST_PROJECTION},
    "total": count(*[${NEWS_PAGE_FILTER}])
  }`,
  "date:asc": `{
    "items": *[${NEWS_PAGE_FILTER}] | order(date asc, _id asc)[$offset...$end] ${NEWS_LIST_PROJECTION},
    "total": count(*[${NEWS_PAGE_FILTER}])
  }`,
  "title:asc": `{
    "items": *[${NEWS_PAGE_FILTER}] | order(title asc, _id asc)[$offset...$end] ${NEWS_LIST_PROJECTION},
    "total": count(*[${NEWS_PAGE_FILTER}])
  }`,
  "title:desc": `{
    "items": *[${NEWS_PAGE_FILTER}] | order(title desc, _id desc)[$offset...$end] ${NEWS_LIST_PROJECTION},
    "total": count(*[${NEWS_PAGE_FILTER}])
  }`,
} as const;

export type NewsPageSortBy = "date" | "title";

export const NEWS_PAGE_SORT_BY = ["date", "title"] as const;

export const getNewsPageQuery = (
  sortBy: NewsPageSortBy,
  direction: "asc" | "desc"
): string => NEWS_PAGE_QUERIES[`${sortBy}:${direction}`];

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
