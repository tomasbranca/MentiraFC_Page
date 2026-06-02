import {
  buildOffsetPaginatedResult,
  buildOffsetPaginationQueryParams,
  parseOffsetPaginationParams,
  type OffsetPaginationParams,
  type PaginatedResult,
} from "../../../shared/pagination";

export type SanityPageQueryResult = {
  items?: unknown[];
  total?: number;
};

export type SanityPageOptions<TSortBy extends string> = Partial<
  Pick<
    OffsetPaginationParams<TSortBy>,
    "page" | "limit" | "sortBy" | "direction" | "search"
  >
>;

export const parseSanityPageOptions = <TSortBy extends string>(
  options: SanityPageOptions<TSortBy> | undefined,
  {
    allowedSortBy,
    defaultSortBy,
    defaultLimit,
  }: {
    allowedSortBy: readonly TSortBy[];
    defaultSortBy: TSortBy;
    defaultLimit?: number;
  }
): OffsetPaginationParams<TSortBy> => {
  const parsed = parseOffsetPaginationParams(options ?? {}, {
    allowedSortBy,
    defaultSortBy,
    defaultLimit,
  });

  if (!parsed.ok) {
    throw new Error("Invalid pagination options.");
  }

  return parsed.params;
};

export const buildSanityPageParams = (
  params: OffsetPaginationParams
): Record<string, string | number | boolean> =>
  buildOffsetPaginationQueryParams(params);

export const buildSanityPaginatedResult = <T>(
  items: T[],
  total: number | undefined,
  params: OffsetPaginationParams
): PaginatedResult<T> =>
  buildOffsetPaginatedResult(items, total ?? items.length, params);
