const dashboardOrganizationReferenceCountsProjection = `{
  "tournaments": count(*[_type == "tournaments" && organization._ref == ^._id])
}`;

const dashboardOrganizationProjection = `{
  "id": _id,
  "updatedAt": _updatedAt,
  name,
  primaryColor,
  logo,
  "logoAssetId": logo.asset->_id,
  "logoUrl": logo.asset->url,
  "referenceCounts": ${dashboardOrganizationReferenceCountsProjection}
}`;

export const dashboardOrganizationListQuery = `*[_type == "organizations"] | order(name asc, _updatedAt desc) ${dashboardOrganizationProjection}`;

export const dashboardOrganizationByIdQuery = `*[
  _type == "organizations" &&
  (_id == $id || _id == $draftId)
] ${dashboardOrganizationProjection}`;

export const dashboardOrganizationReferenceUsageQuery = `{
  "tournaments": *[
    _type == "tournaments" &&
    (organization._ref == $id || organization._ref == $draftId)
  ]{
    "id": _id
  }
}`;
