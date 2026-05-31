export const FOOTER_SETTINGS_QUERY = `
  *[_type == "footerSettings" && _id == "footerSettings"][0] {
    _id,
    _updatedAt,
    contactEmail,
    socials[]{
      _key,
      label,
      platform,
      url
    },
    links[]{
      _key,
      label,
      url
    },
    sponsors[]{
      _key,
      name,
      url,
      logoAlt,
      "resolvedLogoUrl": coalesce(logo.asset->url, logoUrl)
    }
  }
`;
