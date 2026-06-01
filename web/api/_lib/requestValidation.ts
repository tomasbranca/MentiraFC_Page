export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_SANITY_DOCUMENT_ID_LENGTH = 256;
const SANITY_DOCUMENT_ID_PATTERN =
  /^(?:drafts\.)?[A-Za-z0-9][A-Za-z0-9_.-]*$/;

type SanityDocumentIdOptions = {
  allowDrafts?: boolean;
};

export type OptionalValidatedParam = {
  invalid: boolean;
  value: string | null;
};

export const normalizeUuid = (input: unknown): string | null => {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  return UUID_PATTERN.test(value) ? value : null;
};

export const normalizeSanityDocumentId = (
  input: unknown,
  options: SanityDocumentIdOptions = {}
): string | null => {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  if (
    !value ||
    value.length > MAX_SANITY_DOCUMENT_ID_LENGTH ||
    !SANITY_DOCUMENT_ID_PATTERN.test(value) ||
    value.includes("..") ||
    (!options.allowDrafts && value.startsWith("drafts."))
  ) {
    return null;
  }

  return value;
};

export const normalizeOptionalSanityDocumentId = (
  input: unknown,
  options: SanityDocumentIdOptions = {}
): OptionalValidatedParam => {
  if (typeof input !== "string" || !input.trim()) {
    return { invalid: false, value: null };
  }

  const value = normalizeSanityDocumentId(input, options);

  return value ? { invalid: false, value } : { invalid: true, value: null };
};
