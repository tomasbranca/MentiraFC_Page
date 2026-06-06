import { randomUUID } from "node:crypto";

import type {
  DashboardTeamDraftMutationInput,
  DashboardTeamItem,
  DashboardTeamMutationInput,
  DashboardTeamReferenceCounts,
} from "../../../src/types/dashboard";
import {
  buildOffsetPaginatedResult,
  buildOffsetPaginationQueryParams,
  type OffsetPaginationParams,
  type PaginatedResult,
} from "../../../shared/pagination.js";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  resolveNextTeamLogo,
  safelyDeleteTeamLogoAsset,
} from "./imageAssets.js";
import {
  dashboardTeamByIdQuery,
  dashboardTeamListQuery,
  dashboardTeamReferenceUsageQuery,
  getDashboardTeamsPageQuery,
  type DashboardTeamsPageKindFilter,
  type DashboardTeamsPageSortBy,
  type DashboardTeamsPageStatusFilter,
  type DashboardTeamsPageUsageFilter,
} from "./queries.js";
import { adaptDashboardTeamItem } from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_TEAM_PREFIX = "teams-";

export class DashboardTeamValidationError extends Error {}

type DashboardTeamDocument = {
  id: string;
  updatedAt?: string | null;
  name?: string | null;
  isMain?: boolean | null;
  logo?: unknown;
  logoAssetId?: string | null;
  logoUrl?: string | null;
  referenceCounts?: DashboardTeamReferenceCounts | null;
};

type DashboardTeamDocumentPair = {
  canonicalId: string;
  published?: DashboardTeamDocument;
  draft?: DashboardTeamDocument;
};

type DashboardTeamReferenceUsage = {
  matches?: Array<{ id: string }>;
  tournaments?: Array<{ id: string }>;
  tables?: Array<{ id: string }>;
  snapshots?: Array<{ id: string }>;
};

type DashboardTeamsPageResult = {
  items?: DashboardTeamDocument[];
  total?: number;
};

type DashboardTeamsPageFilters = {
  status?: DashboardTeamsPageStatusFilter | null;
  kind?: DashboardTeamsPageKindFilter | null;
  usage?: DashboardTeamsPageUsageFilter | null;
};

const emptyReferenceCounts = (): DashboardTeamReferenceCounts => ({
  matches: 0,
  tournaments: 0,
  tables: 0,
  snapshots: 0,
});

const getCanonicalTeamId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftTeamId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalTeamId(id)}`;

export const createCanonicalTeamId = (): string =>
  `${PUBLIC_TEAM_PREFIX}${randomUUID()}`;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const getSelectedDocument = ({
  draft,
  published,
}: DashboardTeamDocumentPair): DashboardTeamDocument | undefined =>
  draft ?? published;

const groupDashboardTeamDocuments = (
  documents: DashboardTeamDocument[]
): DashboardTeamDocumentPair[] => {
  const pairs = new Map<string, DashboardTeamDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalTeamId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardTeamDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const combineReferenceCounts = (
  pair: DashboardTeamDocumentPair
): DashboardTeamReferenceCounts => {
  const counts = emptyReferenceCounts();

  for (const item of [pair.published?.referenceCounts, pair.draft?.referenceCounts]) {
    counts.matches += item?.matches ?? 0;
    counts.tournaments += item?.tournaments ?? 0;
    counts.tables += item?.tables ?? 0;
    counts.snapshots += item?.snapshots ?? 0;
  }

  return counts;
};

const adaptDashboardTeamPair = (
  pair: DashboardTeamDocumentPair
): DashboardTeamItem => {
  const selectedDocument = getSelectedDocument(pair);

  return adaptDashboardTeamItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    name: normalizeString(selectedDocument?.name) || "Club sin nombre",
    isMain: Boolean(selectedDocument?.isMain),
    updatedAt: selectedDocument?.updatedAt ?? null,
    logoAssetId: selectedDocument?.logoAssetId ?? null,
    logoUrl: selectedDocument?.logoUrl ?? null,
    referenceCounts: combineReferenceCounts(pair),
  });
};

const sortDashboardTeamItems = (
  items: DashboardTeamItem[]
): DashboardTeamItem[] =>
  [...items].sort((left, right) => {
    if (left.isMain !== right.isMain) {
      return left.isMain ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "es");
  });

const queryDashboardTeamDocuments = async (
  query: string,
  params?: Record<string, string | number | boolean>
): Promise<DashboardTeamDocument[]> =>
  querySanity<DashboardTeamDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardTeamPairById = async (
  id: string
): Promise<DashboardTeamDocumentPair | null> => {
  const canonicalId = getCanonicalTeamId(id);
  const result = await queryDashboardTeamDocuments(dashboardTeamByIdQuery, {
    id: canonicalId,
    draftId: getDraftTeamId(canonicalId),
  });
  const [pair] = groupDashboardTeamDocuments(result);

  return pair ?? null;
};

const buildTeamDocument = async (
  id: string,
  input: DashboardTeamMutationInput | DashboardTeamDraftMutationInput,
  previousDocument?: DashboardTeamDocument
) => {
  const logo = await resolveNextTeamLogo(
    input,
    previousDocument?.logo,
    previousDocument?.logoAssetId
  );

  return {
    document: {
      _id: id,
      _type: "teams",
      name: input.name?.trim() ?? "",
      isMain: input.isMain ?? previousDocument?.isMain ?? false,
      logo: logo.logo,
    },
    logoAssetId: logo.assetId,
    uploadedAssetId: logo.uploadedAssetId,
  };
};

const safelyDeleteUploadedLogo = async (assetId?: string | null) => {
  await safelyDeleteTeamLogoAsset(assetId);
};

const getDocumentIdsToDelete = (
  pair: DashboardTeamDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftTeamId(canonicalId),
];

const getDashboardTeamReferenceUsage = async (
  canonicalId: string
): Promise<DashboardTeamReferenceUsage> =>
  querySanity<DashboardTeamReferenceUsage>(dashboardTeamReferenceUsageQuery, {
    params: {
      id: canonicalId,
      draftId: getDraftTeamId(canonicalId),
    },
    perspective: "raw",
    useToken: true,
  });

const getReferenceUsageCount = (usage: DashboardTeamReferenceUsage): number =>
  (usage.matches?.length ?? 0) +
  (usage.tournaments?.length ?? 0) +
  (usage.tables?.length ?? 0) +
  (usage.snapshots?.length ?? 0);

export const listDashboardTeams = async (): Promise<DashboardTeamItem[]> => {
  const result = await queryDashboardTeamDocuments(dashboardTeamListQuery);

  return sortDashboardTeamItems(
    groupDashboardTeamDocuments(result).map(adaptDashboardTeamPair)
  );
};

export const getDashboardTeamsPage = async (
  pagination: OffsetPaginationParams<DashboardTeamsPageSortBy>,
  filters: DashboardTeamsPageFilters = {}
): Promise<PaginatedResult<DashboardTeamItem>> => {
  const result = await querySanity<DashboardTeamsPageResult>(
    getDashboardTeamsPageQuery(pagination.sortBy, pagination.direction),
    {
      params: {
        ...buildOffsetPaginationQueryParams(pagination),
        hasStatus: Boolean(filters.status),
        status: filters.status ?? "",
        hasKind: Boolean(filters.kind),
        kind: filters.kind ?? "",
        hasUsage: Boolean(filters.usage),
        usage: filters.usage ?? "",
      },
      perspective: "raw",
      useToken: true,
    }
  );
  const items = sortDashboardTeamItems(
    groupDashboardTeamDocuments(result.items ?? []).map(adaptDashboardTeamPair)
  );

  return buildOffsetPaginatedResult(items, result.total, pagination);
};

export const getDashboardTeamById = async (
  id: string
): Promise<DashboardTeamItem | null> => {
  const pair = await getDashboardTeamPairById(id);

  return pair ? adaptDashboardTeamPair(pair) : null;
};

export const saveDashboardTeamDraft = async (
  id: string | null,
  input: DashboardTeamDraftMutationInput
): Promise<DashboardTeamItem> => {
  const canonicalId = id ? getCanonicalTeamId(id) : createCanonicalTeamId();
  const previousPair = await getDashboardTeamPairById(canonicalId);
  const previousDraft = previousPair?.draft;
  const previousSelected = previousDraft ?? previousPair?.published;
  const draft = await buildTeamDocument(
    getDraftTeamId(canonicalId),
    input,
    previousSelected
  );

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: draft.document,
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedLogo(draft.uploadedAssetId);
    throw error;
  }

  const team = await getDashboardTeamById(canonicalId);

  if (!team) {
    throw new Error("Saved draft team could not be reloaded.");
  }

  if (previousDraft?.logoAssetId && previousDraft.logoAssetId !== draft.logoAssetId) {
    await safelyDeleteTeamLogoAsset(previousDraft.logoAssetId);
  }

  return team;
};

export const publishDashboardTeam = async (
  id: string | null,
  input: DashboardTeamMutationInput
): Promise<DashboardTeamItem> => {
  const canonicalId = id ? getCanonicalTeamId(id) : createCanonicalTeamId();
  const previousPair = await getDashboardTeamPairById(canonicalId);
  const previousSelected = previousPair?.draft ?? previousPair?.published;
  const published = await buildTeamDocument(canonicalId, input, previousSelected);

  if (!published.document.logo) {
    await safelyDeleteUploadedLogo(published.uploadedAssetId);
    throw new DashboardTeamValidationError(
      "Carga el escudo del club antes de publicar."
    );
  }

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: published.document,
      },
      {
        delete: {
          id: getDraftTeamId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedLogo(published.uploadedAssetId);
    throw error;
  }

  const team = await getDashboardTeamById(canonicalId);

  if (!team) {
    throw new Error("Published team could not be reloaded.");
  }

  const previousLogoAssetIds = new Set(
    [previousPair?.published?.logoAssetId, previousPair?.draft?.logoAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );

  previousLogoAssetIds.delete(published.logoAssetId ?? "");

  await Promise.all(
    [...previousLogoAssetIds].map((assetId) => safelyDeleteTeamLogoAsset(assetId))
  );

  return team;
};

export const deleteDashboardTeam = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalTeamId(id);
  const pair = await getDashboardTeamPairById(canonicalId);
  const selectedDocument = pair ? getSelectedDocument(pair) : undefined;

  if (selectedDocument?.isMain) {
    throw new DashboardTeamValidationError(
      "No se puede eliminar el club principal."
    );
  }

  const usage = await getDashboardTeamReferenceUsage(canonicalId);

  if (getReferenceUsageCount(usage) > 0) {
    throw new DashboardTeamValidationError(
      "No se puede eliminar el club porque tiene partidos, torneos o tablas vinculadas."
    );
  }

  const logoAssetIds = new Set(
    [pair?.published?.logoAssetId, pair?.draft?.logoAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );

  await mutateSanity<unknown>(
    getDocumentIdsToDelete(pair, canonicalId).map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );

  await Promise.all(
    [...logoAssetIds].map((assetId) => safelyDeleteTeamLogoAsset(assetId))
  );
};
