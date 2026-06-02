const dashboardNewsSummaryProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  title,
  description,
  date,
  "slug": slug.current,
  "imageAlt": image.alt,
  "imageAssetId": image.asset->_id,
  "imageUrl": image.asset->url
}`;

const dashboardNewsProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  title,
  description,
  date,
  "slug": slug.current,
  "imageAlt": image.alt,
  "imageAssetId": image.asset->_id,
  "imageUrl": image.asset->url,
  content[]{
    ...,
    "imageAssetId": asset->_id,
    "imageUrl": asset->url,
    "fileUrl": file.asset->url,
    "mimeType": file.asset->mimeType,
    "originalFilename": file.asset->originalFilename
  }
}`;

const dashboardNewsPageFilter = `_type == "news" && (!$hasSearch || title match $search || description match $search || slug.current match $search) && (!$hasStatus || ($status == "draft" && _id in path("drafts.**")) || ($status == "published" && !(_id in path("drafts.**")) && !defined(*[_id == "drafts." + ^._id][0]._id)))`;

export const dashboardNewsListQuery = `*[_type == "news"] | order(coalesce(date, _updatedAt) desc) ${dashboardNewsSummaryProjection}`;

const dashboardNewsPageQueries = {
  "date:desc": `{
    "items": *[${dashboardNewsPageFilter}] | order(coalesce(date, _updatedAt) desc, _id desc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
  "date:asc": `{
    "items": *[${dashboardNewsPageFilter}] | order(coalesce(date, _updatedAt) asc, _id asc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
  "title:asc": `{
    "items": *[${dashboardNewsPageFilter}] | order(title asc, _id asc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
  "title:desc": `{
    "items": *[${dashboardNewsPageFilter}] | order(title desc, _id desc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
  "updatedAt:desc": `{
    "items": *[${dashboardNewsPageFilter}] | order(_updatedAt desc, _id desc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
  "updatedAt:asc": `{
    "items": *[${dashboardNewsPageFilter}] | order(_updatedAt asc, _id asc)[$offset...$end] ${dashboardNewsSummaryProjection},
    "total": count(*[${dashboardNewsPageFilter}])
  }`,
} as const;

export type DashboardNewsPageSortBy = "date" | "title" | "updatedAt";
export type DashboardNewsPageStatusFilter = "published" | "draft";

export const DASHBOARD_NEWS_PAGE_SORT_BY = [
  "date",
  "title",
  "updatedAt",
] as const;

export const DASHBOARD_NEWS_PAGE_STATUS_FILTERS = [
  "published",
  "draft",
] as const;

export const getDashboardNewsPageQuery = (
  sortBy: DashboardNewsPageSortBy,
  direction: "asc" | "desc"
): string => dashboardNewsPageQueries[`${sortBy}:${direction}`];

export const dashboardNewsByIdQuery = `*[
  _type == "news" &&
  (_id == $id || _id == $draftId)
] ${dashboardNewsProjection}`;
