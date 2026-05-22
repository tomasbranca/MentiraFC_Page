const dashboardStaffProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  lastName,
  role,
  birthDate,
  "slug": slug.current,
  photo,
  "imageAssetId": photo.asset->_id,
  "imageUrl": photo.asset->url
}`;

export const dashboardStaffListQuery = `*[_type == "staff"] | order(lastName asc, name asc) ${dashboardStaffProjection}`;

export const dashboardStaffByIdQuery = `*[
  _type == "staff" &&
  (_id == $id || _id == $draftId)
] ${dashboardStaffProjection}`;
