export const STAFF_QUERY = `
  *[_type == "staff"] | order(lastName asc, name asc) {
    _id,
    name,
    lastName,
    role,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;

export const STAFF_BY_SLUG_OR_ID_QUERY = `
  coalesce(
    *[_type == "staff" && slug.current == $slug][0],
    *[_type == "staff" && _id == $slug][0]
  ) {
    _id,
    name,
    lastName,
    role,
    birthDate,
    slug,
    "imageUrl": photo.asset->url
  }
`;
