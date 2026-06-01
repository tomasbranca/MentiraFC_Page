const MAX_SANITY_PARAM_LENGTH = 256;
const SANITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLIC_SANITY_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

export const normalizeSanitySlugParam = (input: unknown): string | null => {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  if (
    !value ||
    value.length > MAX_SANITY_PARAM_LENGTH ||
    !SANITY_SLUG_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
};

export const normalizeSanitySlugOrPublicIdParam = (
  input: unknown
): string | null => {
  const slug = normalizeSanitySlugParam(input);

  if (slug) {
    return slug;
  }

  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  if (
    !value ||
    value.length > MAX_SANITY_PARAM_LENGTH ||
    value.startsWith("drafts.") ||
    value.includes("..") ||
    !PUBLIC_SANITY_DOCUMENT_ID_PATTERN.test(value)
  ) {
    return null;
  }

  return value;
};
