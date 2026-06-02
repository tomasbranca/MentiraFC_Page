import { randomUUID } from "node:crypto";

import type {
  DashboardNewsDraftMutationInput,
  DashboardNewsItem,
  DashboardNewsMutationInput,
} from "../../../src/types/dashboard";
import type { NewsContentBlock } from "../../../src/types/models";
import {
  buildOffsetPaginatedResult,
  buildOffsetPaginationQueryParams,
  type OffsetPaginationParams,
  type PaginatedResult,
} from "../../../shared/pagination.js";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  collectContentImageAssetIds,
  normalizeNewsContent,
  normalizeNewsDraftContent,
} from "./content.js";
import {
  buildDraftNewsImageValue,
  buildNewsImageValue,
  normalizeImageAlt,
  resolveNextDraftImageAssetId,
  resolveNextImageAssetId,
  safelyDeleteNewsImageAsset,
} from "./imageAssets.js";
import {
  dashboardNewsByIdQuery,
  dashboardNewsListQuery,
  getDashboardNewsPageQuery,
  type DashboardNewsPageStatusFilter,
  type DashboardNewsPageSortBy,
} from "./queries.js";
import { adaptDashboardNewsItem } from "./validation.js";

const DRAFT_PREFIX = "drafts.";

type DashboardNewsDocument = {
  id: string;
  updatedAt?: string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  slug?: string | null;
  imageAlt?: string | null;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  content?: NewsContentBlock[];
};

type DashboardNewsDocumentPair = {
  canonicalId: string;
  published?: DashboardNewsDocument;
  draft?: DashboardNewsDocument;
};

type DashboardNewsPageResult = {
  items?: DashboardNewsDocument[];
  total?: number;
};

type DashboardNewsPageFilters = {
  status?: DashboardNewsPageStatusFilter | null;
};

const getCanonicalNewsId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftNewsId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalNewsId(id)}`;

const createCanonicalNewsId = (): string => `news.${randomUUID()}`;

const getDocumentTitle = (document?: DashboardNewsDocument): string =>
  document?.title?.trim() ?? "";

const getDocumentDescription = (document?: DashboardNewsDocument): string =>
  document?.description?.trim() ?? "";

const getDocumentSlug = (document?: DashboardNewsDocument): string =>
  document?.slug?.trim() ?? "";

const getSelectedDocument = ({
  draft,
  published,
}: DashboardNewsDocumentPair): DashboardNewsDocument | undefined =>
  draft ?? published;

const groupDashboardNewsDocuments = (
  documents: DashboardNewsDocument[]
): DashboardNewsDocumentPair[] => {
  const pairs = new Map<string, DashboardNewsDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalNewsId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardNewsDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptDashboardNewsPair = (
  pair: DashboardNewsDocumentPair
): DashboardNewsItem => {
  const selectedDocument = getSelectedDocument(pair);
  const status = pair.draft ? "draft" : "published";
  const rawItem = {
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status,
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    title: getDocumentTitle(selectedDocument),
    description: getDocumentDescription(selectedDocument),
    date: selectedDocument?.date ?? null,
    updatedAt: selectedDocument?.updatedAt ?? null,
    slug: getDocumentSlug(selectedDocument),
    imageAlt: selectedDocument?.imageAlt ?? null,
    imageAssetId: selectedDocument?.imageAssetId ?? null,
    imageUrl: selectedDocument?.imageUrl ?? null,
    content: selectedDocument?.content ?? [],
  };

  return adaptDashboardNewsItem(rawItem);
};

const sortDashboardNewsItems = (
  items: DashboardNewsItem[]
): DashboardNewsItem[] =>
  [...items].sort((left, right) => {
    const leftTime = new Date(left.date ?? left.updatedAt ?? "").getTime() || 0;
    const rightTime =
      new Date(right.date ?? right.updatedAt ?? "").getTime() || 0;

    return rightTime - leftTime;
  });

const queryDashboardNewsDocuments = async (
  query: string,
  params?: Record<string, string | number | boolean>
): Promise<DashboardNewsDocument[]> =>
  querySanity<DashboardNewsDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardNewsPairById = async (
  id: string
): Promise<DashboardNewsDocumentPair | null> => {
  const canonicalId = getCanonicalNewsId(id);
  const result = await queryDashboardNewsDocuments(dashboardNewsByIdQuery, {
    id: canonicalId,
    draftId: getDraftNewsId(canonicalId),
  });
  const [pair] = groupDashboardNewsDocuments(result);

  return pair ?? null;
};

const buildPublishedNewsDocument = async (
  id: string,
  input: DashboardNewsMutationInput,
  previousImageAssetId?: string | null
) => {
  const { assetId, uploadedAssetId } = await resolveNextImageAssetId(
    input,
    previousImageAssetId
  );
  const { content, uploadedAssetIds } = await normalizeNewsContent(input);

  return {
    document: {
      _id: getCanonicalNewsId(id),
      _type: "news",
      title: input.title,
      description: input.description,
      date: input.date,
      slug: {
        _type: "slug",
        current: input.slug,
      },
      image: buildNewsImageValue(assetId, normalizeImageAlt(input)),
      content,
    },
    assetId,
    content,
    uploadedAssetIds: [uploadedAssetId, ...uploadedAssetIds].filter(
      (assetIdToKeep): assetIdToKeep is string => Boolean(assetIdToKeep)
    ),
  };
};

const buildDraftNewsDocument = async (
  id: string,
  input: DashboardNewsDraftMutationInput,
  previousImageAssetId?: string | null
) => {
  const { assetId, uploadedAssetId } = await resolveNextDraftImageAssetId(
    input,
    previousImageAssetId
  );
  const image = buildDraftNewsImageValue(assetId, input);
  const { content, uploadedAssetIds } = await normalizeNewsDraftContent(input);

  return {
    document: {
      _id: getDraftNewsId(id),
      _type: "news",
      title: input.title?.trim() ?? "",
      description: input.description?.trim() ?? "",
      date: input.date?.trim() || undefined,
      slug: input.slug?.trim()
        ? {
            _type: "slug",
            current: input.slug.trim(),
          }
        : undefined,
      image,
      content,
    },
    assetId,
    content,
    uploadedAssetIds: [uploadedAssetId, ...uploadedAssetIds].filter(
      (assetIdToKeep): assetIdToKeep is string => Boolean(assetIdToKeep)
    ),
  };
};

const safelyDeleteUploadedAssets = async (assetIds: string[]) => {
  await Promise.all(
    assetIds.map((assetIdToDelete) =>
      safelyDeleteNewsImageAsset(assetIdToDelete)
    )
  );
};

export const listDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const result = await queryDashboardNewsDocuments(dashboardNewsListQuery);

  return sortDashboardNewsItems(
    groupDashboardNewsDocuments(result).map(adaptDashboardNewsPair)
  );
};

export const getDashboardNewsPage = async (
  pagination: OffsetPaginationParams<DashboardNewsPageSortBy>,
  filters: DashboardNewsPageFilters = {}
): Promise<PaginatedResult<DashboardNewsItem>> => {
  const result = await querySanity<DashboardNewsPageResult>(
    getDashboardNewsPageQuery(pagination.sortBy, pagination.direction),
    {
      params: {
        ...buildOffsetPaginationQueryParams(pagination),
        hasStatus: Boolean(filters.status),
        status: filters.status ?? "",
      },
      perspective: "raw",
      useToken: true,
    }
  );
  const items = sortDashboardNewsItems(
    groupDashboardNewsDocuments(result.items ?? []).map(adaptDashboardNewsPair)
  );

  return buildOffsetPaginatedResult(items, result.total, pagination);
};

export const getDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem | null> => {
  const pair = await getDashboardNewsPairById(id);

  return pair ? adaptDashboardNewsPair(pair) : null;
};

export const saveDashboardNewsDraft = async (
  id: string | null,
  input: DashboardNewsDraftMutationInput
): Promise<DashboardNewsItem> => {
  const canonicalId = id ? getCanonicalNewsId(id) : createCanonicalNewsId();
  const previousPair = await getDashboardNewsPairById(canonicalId);
  const previousDraft = previousPair?.draft;
  const previousSelected = previousDraft ?? previousPair?.published;
  const draft = await buildDraftNewsDocument(
    canonicalId,
    input,
    previousSelected?.imageAssetId
  );

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: draft.document,
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedAssets(draft.uploadedAssetIds);
    throw error;
  }

  const news = await getDashboardNewsById(canonicalId);

  if (!news) {
    throw new Error("Saved draft news item could not be reloaded.");
  }

  if (
    previousDraft?.imageAssetId &&
    previousDraft.imageAssetId !== draft.assetId
  ) {
    await safelyDeleteNewsImageAsset(previousDraft.imageAssetId);
  }

  const previousContentAssetIds = collectContentImageAssetIds(
    previousDraft?.content
  );
  const nextContentAssetIds = collectContentImageAssetIds(draft.content);

  await Promise.all(
    [...previousContentAssetIds]
      .filter((assetIdToDelete) => !nextContentAssetIds.has(assetIdToDelete))
      .map((assetIdToDelete) => safelyDeleteNewsImageAsset(assetIdToDelete))
  );

  return news;
};

export const publishDashboardNews = async (
  id: string | null,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const canonicalId = id ? getCanonicalNewsId(id) : createCanonicalNewsId();
  const previousPair = await getDashboardNewsPairById(canonicalId);
  const previousSelected = previousPair?.draft ?? previousPair?.published;
  const published = await buildPublishedNewsDocument(
    canonicalId,
    input,
    previousSelected?.imageAssetId
  );

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: published.document,
      },
      {
        delete: {
          id: getDraftNewsId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedAssets(published.uploadedAssetIds);
    throw error;
  }

  const news = await getDashboardNewsById(canonicalId);

  if (!news) {
    throw new Error("Published news item could not be reloaded.");
  }

  const previousImageAssetIds = new Set(
    [previousPair?.published?.imageAssetId, previousPair?.draft?.imageAssetId]
      .filter((assetId): assetId is string => Boolean(assetId))
  );

  previousImageAssetIds.delete(published.assetId);

  await Promise.all(
    [...previousImageAssetIds].map((assetIdToDelete) =>
      safelyDeleteNewsImageAsset(assetIdToDelete)
    )
  );

  const previousContentAssetIds = new Set([
    ...collectContentImageAssetIds(previousPair?.published?.content),
    ...collectContentImageAssetIds(previousPair?.draft?.content),
  ]);
  const nextContentAssetIds = collectContentImageAssetIds(published.content);

  await Promise.all(
    [...previousContentAssetIds]
      .filter((assetIdToDelete) => !nextContentAssetIds.has(assetIdToDelete))
      .map((assetIdToDelete) => safelyDeleteNewsImageAsset(assetIdToDelete))
  );

  return news;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  const pair = await getDashboardNewsPairById(id);
  const canonicalId = getCanonicalNewsId(id);
  const documentIdsToDelete = [
    pair?.published?.id ?? canonicalId,
    pair?.draft?.id ?? getDraftNewsId(canonicalId),
  ];
  const imageAssetIds = new Set(
    [pair?.published?.imageAssetId, pair?.draft?.imageAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );
  const contentAssetIds = new Set([
    ...collectContentImageAssetIds(pair?.published?.content),
    ...collectContentImageAssetIds(pair?.draft?.content),
  ]);

  await mutateSanity<unknown>(
    documentIdsToDelete.map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );

  await Promise.all(
    [...imageAssetIds, ...contentAssetIds].map((assetIdToDelete) =>
      safelyDeleteNewsImageAsset(assetIdToDelete)
    )
  );
};
