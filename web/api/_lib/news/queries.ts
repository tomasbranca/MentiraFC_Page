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

export const dashboardNewsListQuery = `*[_type == "news"] | order(coalesce(date, _updatedAt) desc) ${dashboardNewsProjection}`;

export const dashboardNewsByIdQuery = `*[
  _type == "news" &&
  (_id == $id || _id == $draftId)
] ${dashboardNewsProjection}`;
