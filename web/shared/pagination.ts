export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;
export const DEFAULT_MAX_PAGE = 1000;
export const DEFAULT_MAX_SEARCH_LENGTH = 80;

export type SortDirection = "asc" | "desc";

export type PaginatedResult<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string | null;
  previousCursor?: string | null;
};

export type OffsetPaginationParams<TSortBy extends string = string> = {
  page: number;
  limit: number;
  offset: number;
  sortBy: TSortBy;
  direction: SortDirection;
  search: string | null;
};

export type PaginationIssueField =
  | "limit"
  | "page"
  | "cursor"
  | "sortBy"
  | "direction"
  | "search";

export type PaginationIssue = {
  field: PaginationIssueField;
  message: string;
};

export type PaginationParseResult<TSortBy extends string = string> =
  | {
      ok: true;
      params: OffsetPaginationParams<TSortBy>;
    }
  | {
      ok: false;
      issues: PaginationIssue[];
    };

type PaginationInput = {
  limit?: unknown;
  page?: unknown;
  cursor?: unknown;
  sortBy?: unknown;
  direction?: unknown;
  search?: unknown;
};

type ParseOffsetPaginationOptions<TSortBy extends string> = {
  allowedSortBy: readonly TSortBy[];
  defaultSortBy: TSortBy;
  defaultDirection?: SortDirection;
  defaultLimit?: number;
  maxLimit?: number;
  maxPage?: number;
  maxSearchLength?: number;
};

const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;

const getInputValue = (
  input: PaginationInput | URLSearchParams,
  key: keyof PaginationInput
): unknown => {
  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  return input[key];
};

const parseInteger = (input: unknown): number | null => {
  if (typeof input === "number" && Number.isInteger(input)) {
    return input;
  }

  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isSafeInteger(parsed) ? parsed : null;
};

export const normalizePaginationLimit = (
  input: unknown,
  {
    defaultLimit = DEFAULT_PAGE_LIMIT,
    maxLimit = MAX_PAGE_LIMIT,
  }: {
    defaultLimit?: number;
    maxLimit?: number;
  } = {}
): number => {
  const parsed = parseInteger(input);

  if (!parsed || parsed <= 0) {
    return defaultLimit;
  }

  return Math.min(parsed, maxLimit);
};

export const normalizePaginationPage = (
  input: unknown,
  {
    defaultPage = 1,
    maxPage = DEFAULT_MAX_PAGE,
  }: {
    defaultPage?: number;
    maxPage?: number;
  } = {}
): number | null => {
  if (input == null || input === "") {
    return defaultPage;
  }

  const parsed = parseInteger(input);

  if (!parsed || parsed <= 0 || parsed > maxPage) {
    return null;
  }

  return parsed;
};

export const normalizePaginationCursor = (
  input: unknown
): string | null => {
  if (input == null || input === "") {
    return null;
  }

  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();

  return CURSOR_PATTERN.test(value) ? value : null;
};

export const normalizeSortDirection = (
  input: unknown,
  defaultDirection: SortDirection = "desc"
): SortDirection | null => {
  if (input == null || input === "") {
    return defaultDirection;
  }

  return input === "asc" || input === "desc" ? input : null;
};

export const normalizeSortBy = <TSortBy extends string>(
  input: unknown,
  allowedSortBy: readonly TSortBy[],
  defaultSortBy: TSortBy
): TSortBy | null => {
  if (input == null || input === "") {
    return defaultSortBy;
  }

  if (typeof input !== "string") {
    return null;
  }

  return allowedSortBy.includes(input as TSortBy)
    ? (input as TSortBy)
    : null;
};

export const normalizeSearch = (
  input: unknown,
  {
    maxLength = DEFAULT_MAX_SEARCH_LENGTH,
  }: {
    maxLength?: number;
  } = {}
): string | null => {
  if (input == null) {
    return null;
  }

  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim().replace(/\s+/g, " ");

  if (!value) {
    return null;
  }

  const hasControlCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0);

    return code < 32 || code === 127;
  });

  if (value.length > maxLength || hasControlCharacter) {
    return null;
  }

  return value;
};

export const parseOffsetPaginationParams = <TSortBy extends string>(
  input: PaginationInput | URLSearchParams,
  options: ParseOffsetPaginationOptions<TSortBy>
): PaginationParseResult<TSortBy> => {
  const issues: PaginationIssue[] = [];
  const limit = normalizePaginationLimit(getInputValue(input, "limit"), {
    defaultLimit: options.defaultLimit,
    maxLimit: options.maxLimit,
  });
  const page = normalizePaginationPage(getInputValue(input, "page"), {
    maxPage: options.maxPage,
  });
  const sortBy = normalizeSortBy(
    getInputValue(input, "sortBy"),
    options.allowedSortBy,
    options.defaultSortBy
  );
  const direction = normalizeSortDirection(
    getInputValue(input, "direction"),
    options.defaultDirection
  );
  const rawSearch = getInputValue(input, "search");
  const search = normalizeSearch(rawSearch, {
    maxLength: options.maxSearchLength,
  });
  const rawCursor = getInputValue(input, "cursor");

  if (page == null) {
    issues.push({
      field: "page",
      message: "La pagina debe ser un entero positivo dentro del rango permitido.",
    });
  }

  if (sortBy == null) {
    issues.push({
      field: "sortBy",
      message: "El orden elegido no esta permitido para este listado.",
    });
  }

  if (direction == null) {
    issues.push({
      field: "direction",
      message: "La direccion de orden debe ser asc o desc.",
    });
  }

  if (rawSearch && search == null) {
    issues.push({
      field: "search",
      message: "La busqueda supera el largo permitido o contiene caracteres invalidos.",
    });
  }

  if (rawCursor && normalizePaginationCursor(rawCursor) == null) {
    issues.push({
      field: "cursor",
      message: "El cursor de paginacion es invalido.",
    });
  }

  if (issues.length > 0 || page == null || sortBy == null || direction == null) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    params: {
      page,
      limit,
      offset: (page - 1) * limit,
      sortBy,
      direction,
      search,
    },
  };
};

export const buildOffsetPaginatedResult = <T>(
  items: T[],
  total: number | undefined,
  params: Pick<OffsetPaginationParams, "page" | "limit">
): PaginatedResult<T> => {
  const totalPages =
    typeof total === "number" ? Math.max(1, Math.ceil(total / params.limit)) : undefined;

  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasPreviousPage: params.page > 1,
    hasNextPage:
      typeof totalPages === "number" ? params.page < totalPages : undefined,
    nextCursor: null,
    previousCursor: null,
  };
};

export const buildTextSearchMatchParam = (search: string | null): string => {
  if (!search) {
    return "";
  }

  return search
    .replace(/[*?"']/g, "")
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => `${token}*`)
    .join(" ");
};

export const buildOffsetPaginationQueryParams = (
  params: OffsetPaginationParams
): Record<string, string | number | boolean> => {
  const search = buildTextSearchMatchParam(params.search);

  return {
    offset: params.offset,
    end: params.offset + params.limit,
    hasSearch: Boolean(search),
    search,
  };
};
