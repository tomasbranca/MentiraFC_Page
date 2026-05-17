const PUBLISHED_NEWS_FILTER = `_type == "news" && !(_id in path("drafts.**"))`;

const dashboardNewsProjection = `{
  "id": _id,
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

export const dashboardNewsListQuery = `*[${PUBLISHED_NEWS_FILTER}] | order(date desc) ${dashboardNewsProjection}`;

export const dashboardNewsByIdQuery = `*[${PUBLISHED_NEWS_FILTER} && _id == $id][0] ${dashboardNewsProjection}`;
