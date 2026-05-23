import { randomUUID } from "node:crypto";

import type {
  DashboardOrganizationDraftMutationInput,
  DashboardOrganizationItem,
  DashboardOrganizationMutationInput,
  DashboardOrganizationReferenceCounts,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  resolveNextOrganizationLogo,
  safelyDeleteOrganizationLogoAsset,
} from "./imageAssets.js";
import {
  dashboardOrganizationByIdQuery,
  dashboardOrganizationListQuery,
  dashboardOrganizationReferenceUsageQuery,
} from "./queries.js";
import { adaptDashboardOrganizationItem } from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_ORGANIZATION_PREFIX = "organizations-";

export class DashboardOrganizationValidationError extends Error {}

type DashboardOrganizationColorValue = {
  hex?: string | null;
};

type DashboardOrganizationDocument = {
  id: string;
  updatedAt?: string | null;
  name?: string | null;
  primaryColor?: string | DashboardOrganizationColorValue | null;
  logo?: unknown;
  logoAssetId?: string | null;
  logoUrl?: string | null;
  referenceCounts?: DashboardOrganizationReferenceCounts | null;
};

type DashboardOrganizationDocumentPair = {
  canonicalId: string;
  published?: DashboardOrganizationDocument;
  draft?: DashboardOrganizationDocument;
};

type DashboardOrganizationReferenceUsage = {
  tournaments?: Array<{ id: string }>;
};

const emptyReferenceCounts = (): DashboardOrganizationReferenceCounts => ({
  tournaments: 0,
});

const getCanonicalOrganizationId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftOrganizationId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalOrganizationId(id)}`;

export const createCanonicalOrganizationId = (): string =>
  `${PUBLIC_ORGANIZATION_PREFIX}${randomUUID()}`;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const normalizeColorHex = (
  value?: string | DashboardOrganizationColorValue | null
): string | null => {
  const hex = typeof value === "string" ? value : value?.hex;
  const normalizedHex = hex?.trim().toLowerCase() ?? "";

  return /^#[0-9a-f]{6}$/.test(normalizedHex) ? normalizedHex : null;
};

const getSelectedDocument = ({
  draft,
  published,
}: DashboardOrganizationDocumentPair): DashboardOrganizationDocument | undefined =>
  draft ?? published;

const groupDashboardOrganizationDocuments = (
  documents: DashboardOrganizationDocument[]
): DashboardOrganizationDocumentPair[] => {
  const pairs = new Map<string, DashboardOrganizationDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalOrganizationId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardOrganizationDocumentPair);

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
  pair: DashboardOrganizationDocumentPair
): DashboardOrganizationReferenceCounts => {
  const counts = emptyReferenceCounts();

  for (const item of [pair.published?.referenceCounts, pair.draft?.referenceCounts]) {
    counts.tournaments += item?.tournaments ?? 0;
  }

  return counts;
};

const adaptDashboardOrganizationPair = (
  pair: DashboardOrganizationDocumentPair
): DashboardOrganizationItem => {
  const selectedDocument = getSelectedDocument(pair);

  return adaptDashboardOrganizationItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    name: normalizeString(selectedDocument?.name) || "Organizador sin nombre",
    primaryColor: normalizeColorHex(selectedDocument?.primaryColor),
    updatedAt: selectedDocument?.updatedAt ?? null,
    logoAssetId: selectedDocument?.logoAssetId ?? null,
    logoUrl: selectedDocument?.logoUrl ?? null,
    referenceCounts: combineReferenceCounts(pair),
  });
};

const sortDashboardOrganizationItems = (
  items: DashboardOrganizationItem[]
): DashboardOrganizationItem[] =>
  [...items].sort((left, right) => left.name.localeCompare(right.name, "es"));

const queryDashboardOrganizationDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardOrganizationDocument[]> =>
  querySanity<DashboardOrganizationDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardOrganizationPairById = async (
  id: string
): Promise<DashboardOrganizationDocumentPair | null> => {
  const canonicalId = getCanonicalOrganizationId(id);
  const result = await queryDashboardOrganizationDocuments(
    dashboardOrganizationByIdQuery,
    {
      id: canonicalId,
      draftId: getDraftOrganizationId(canonicalId),
    }
  );
  const [pair] = groupDashboardOrganizationDocuments(result);

  return pair ?? null;
};

const round = (value: number): number => Math.round(value * 1000) / 1000;

const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const match = hex.trim().match(/^#([0-9a-fA-F]{6})$/);

  if (!match) {
    return null;
  }

  const numericValue = Number.parseInt(match[1], 16);

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  };
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === red) {
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }

    hue *= 60;
  }

  return {
    h: round(hue),
    s: round(saturation * 100),
    l: round(lightness * 100),
    a: 1,
  };
};

const rgbToHsv = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }

    hue *= 60;
  }

  return {
    h: round(hue),
    s: max === 0 ? 0 : round((delta / max) * 100),
    v: round(max * 100),
    a: 1,
  };
};

export const buildDashboardOrganizationColorValue = (hex: string) => {
  const normalizedHex = hex.trim().toLowerCase();
  const rgb = hexToRgb(normalizedHex);

  if (!rgb) {
    return undefined;
  }

  return {
    _type: "color",
    hex: normalizedHex,
    alpha: 1,
    hsl: {
      _type: "hslaColor",
      ...rgbToHsl(rgb),
    },
    hsv: {
      _type: "hsvaColor",
      ...rgbToHsv(rgb),
    },
    rgb: {
      _type: "rgbaColor",
      ...rgb,
      a: 1,
    },
  };
};

const buildOrganizationDocument = async (
  id: string,
  input:
    | DashboardOrganizationMutationInput
    | DashboardOrganizationDraftMutationInput,
  previousDocument?: DashboardOrganizationDocument
) => {
  const logo = await resolveNextOrganizationLogo(
    input,
    previousDocument?.logo,
    previousDocument?.logoAssetId
  );

  return {
    document: {
      _id: id,
      _type: "organizations",
      name: input.name?.trim() ?? "",
      primaryColor: input.primaryColor
        ? buildDashboardOrganizationColorValue(input.primaryColor)
        : undefined,
      logo: logo.logo,
    },
    logoAssetId: logo.assetId,
    uploadedAssetId: logo.uploadedAssetId,
  };
};

const safelyDeleteUploadedLogo = async (assetId?: string | null) => {
  await safelyDeleteOrganizationLogoAsset(assetId);
};

const getDocumentIdsToDelete = (
  pair: DashboardOrganizationDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftOrganizationId(canonicalId),
];

const getDashboardOrganizationReferenceUsage = async (
  canonicalId: string
): Promise<DashboardOrganizationReferenceUsage> =>
  querySanity<DashboardOrganizationReferenceUsage>(
    dashboardOrganizationReferenceUsageQuery,
    {
      params: {
        id: canonicalId,
        draftId: getDraftOrganizationId(canonicalId),
      },
      perspective: "raw",
      useToken: true,
    }
  );

const getReferenceUsageCount = (
  usage: DashboardOrganizationReferenceUsage
): number => usage.tournaments?.length ?? 0;

export const listDashboardOrganizations = async (): Promise<
  DashboardOrganizationItem[]
> => {
  const result = await queryDashboardOrganizationDocuments(
    dashboardOrganizationListQuery
  );

  return sortDashboardOrganizationItems(
    groupDashboardOrganizationDocuments(result).map(adaptDashboardOrganizationPair)
  );
};

export const getDashboardOrganizationById = async (
  id: string
): Promise<DashboardOrganizationItem | null> => {
  const pair = await getDashboardOrganizationPairById(id);

  return pair ? adaptDashboardOrganizationPair(pair) : null;
};

export const saveDashboardOrganizationDraft = async (
  id: string | null,
  input: DashboardOrganizationDraftMutationInput
): Promise<DashboardOrganizationItem> => {
  const canonicalId = id
    ? getCanonicalOrganizationId(id)
    : createCanonicalOrganizationId();
  const previousPair = await getDashboardOrganizationPairById(canonicalId);
  const previousDraft = previousPair?.draft;
  const previousSelected = previousDraft ?? previousPair?.published;
  const draft = await buildOrganizationDocument(
    getDraftOrganizationId(canonicalId),
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

  const organization = await getDashboardOrganizationById(canonicalId);

  if (!organization) {
    throw new Error("Saved draft organization could not be reloaded.");
  }

  if (
    previousDraft?.logoAssetId &&
    previousDraft.logoAssetId !== draft.logoAssetId
  ) {
    await safelyDeleteOrganizationLogoAsset(previousDraft.logoAssetId);
  }

  return organization;
};

export const publishDashboardOrganization = async (
  id: string | null,
  input: DashboardOrganizationMutationInput
): Promise<DashboardOrganizationItem> => {
  const canonicalId = id
    ? getCanonicalOrganizationId(id)
    : createCanonicalOrganizationId();
  const previousPair = await getDashboardOrganizationPairById(canonicalId);
  const previousSelected = previousPair?.draft ?? previousPair?.published;
  const published = await buildOrganizationDocument(
    canonicalId,
    input,
    previousSelected
  );

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: published.document,
      },
      {
        delete: {
          id: getDraftOrganizationId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedLogo(published.uploadedAssetId);
    throw error;
  }

  const organization = await getDashboardOrganizationById(canonicalId);

  if (!organization) {
    throw new Error("Published organization could not be reloaded.");
  }

  const previousLogoAssetIds = new Set(
    [
      previousPair?.published?.logoAssetId,
      previousPair?.draft?.logoAssetId,
    ].filter((assetId): assetId is string => Boolean(assetId))
  );

  previousLogoAssetIds.delete(published.logoAssetId ?? "");

  await Promise.all(
    [...previousLogoAssetIds].map((assetId) =>
      safelyDeleteOrganizationLogoAsset(assetId)
    )
  );

  return organization;
};

export const deleteDashboardOrganization = async (
  id: string
): Promise<void> => {
  const canonicalId = getCanonicalOrganizationId(id);
  const pair = await getDashboardOrganizationPairById(canonicalId);
  const usage = await getDashboardOrganizationReferenceUsage(canonicalId);

  if (getReferenceUsageCount(usage) > 0) {
    throw new DashboardOrganizationValidationError(
      "No se puede eliminar el organizador porque tiene torneos vinculados."
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
    [...logoAssetIds].map((assetId) =>
      safelyDeleteOrganizationLogoAsset(assetId)
    )
  );
};
