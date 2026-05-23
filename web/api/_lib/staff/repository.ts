import { randomUUID } from "node:crypto";

import type {
  DashboardStaffDraftMutationInput,
  DashboardStaffItem,
  DashboardStaffMutationInput,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardStaffByIdQuery,
  dashboardStaffListQuery,
} from "./queries.js";
import {
  resolveNextStaffPhoto,
  safelyDeleteStaffPhotoAsset,
} from "./imageAssets.js";
import { adaptDashboardStaffItem } from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_STAFF_PREFIX = "staff-";

type DashboardStaffDocument = {
  id: string;
  updatedAt?: string | null;
  name?: string | null;
  lastName?: string | null;
  role?: string | null;
  birthDate?: string | null;
  slug?: string | null;
  photo?: unknown;
  imageAssetId?: string | null;
  imageUrl?: string | null;
};

type DashboardStaffDocumentPair = {
  canonicalId: string;
  published?: DashboardStaffDocument;
  draft?: DashboardStaffDocument;
};

const getCanonicalStaffId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftStaffId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalStaffId(id)}`;

export const createCanonicalStaffId = (): string =>
  `${PUBLIC_STAFF_PREFIX}${randomUUID()}`;

const getSelectedDocument = ({
  draft,
  published,
}: DashboardStaffDocumentPair): DashboardStaffDocument | undefined =>
  draft ?? published;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const normalizeSlugValue = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildDashboardStaffSlug = ({
  id,
  name,
  lastName,
}: {
  id: string;
  name?: string;
  lastName?: string;
}): string | undefined => {
  const nameSlug = normalizeSlugValue([name, lastName].filter(Boolean).join(" "));

  if (nameSlug) {
    return nameSlug;
  }

  const idSlug = normalizeSlugValue(id);
  return idSlug || undefined;
};

const groupDashboardStaffDocuments = (
  documents: DashboardStaffDocument[]
): DashboardStaffDocumentPair[] => {
  const pairs = new Map<string, DashboardStaffDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalStaffId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardStaffDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptDashboardStaffPair = (
  pair: DashboardStaffDocumentPair
): DashboardStaffItem => {
  const selectedDocument = getSelectedDocument(pair);
  const name = normalizeString(selectedDocument?.name);
  const lastName = normalizeString(selectedDocument?.lastName);
  const fullName = [name, lastName].filter(Boolean).join(" ").trim();

  return adaptDashboardStaffItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    name,
    lastName,
    fullName: fullName || "Integrante sin nombre",
    role: normalizeString(selectedDocument?.role),
    birthDate: selectedDocument?.birthDate ?? null,
    updatedAt: selectedDocument?.updatedAt ?? null,
    slug: normalizeString(selectedDocument?.slug),
    imageAssetId: selectedDocument?.imageAssetId ?? null,
    imageUrl: selectedDocument?.imageUrl ?? null,
  });
};

const sortDashboardStaffItems = (
  items: DashboardStaffItem[]
): DashboardStaffItem[] =>
  [...items].sort((left, right) =>
    left.fullName.localeCompare(right.fullName, "es")
  );

const queryDashboardStaffDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardStaffDocument[]> =>
  querySanity<DashboardStaffDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardStaffPairById = async (
  id: string
): Promise<DashboardStaffDocumentPair | null> => {
  const canonicalId = getCanonicalStaffId(id);
  const result = await queryDashboardStaffDocuments(dashboardStaffByIdQuery, {
    id: canonicalId,
    draftId: getDraftStaffId(canonicalId),
  });
  const [pair] = groupDashboardStaffDocuments(result);

  return pair ?? null;
};

const buildStaffDocument = async (
  id: string,
  input: DashboardStaffMutationInput | DashboardStaffDraftMutationInput,
  previousDocument?: DashboardStaffDocument
) => {
  const photo = await resolveNextStaffPhoto(
    input,
    previousDocument?.photo,
    previousDocument?.imageAssetId
  );
  const slug = buildDashboardStaffSlug({
    id: getCanonicalStaffId(id),
    name: input.name,
    lastName: input.lastName,
  });

  return {
    document: {
      _id: id,
      _type: "staff",
      name: input.name?.trim() ?? "",
      lastName: input.lastName?.trim() ?? "",
      role: input.role?.trim() ?? "",
      birthDate: input.birthDate?.trim() || undefined,
      photo: photo.photo,
      slug: slug
        ? {
            _type: "slug",
            current: slug,
          }
        : undefined,
    },
    photoAssetId: photo.assetId,
    uploadedAssetId: photo.uploadedAssetId,
  };
};

const safelyDeleteUploadedPhoto = async (assetId?: string | null) => {
  await safelyDeleteStaffPhotoAsset(assetId);
};

const getDocumentIdsToDelete = (
  pair: DashboardStaffDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftStaffId(canonicalId),
];

export const listDashboardStaff = async (): Promise<DashboardStaffItem[]> => {
  const result = await queryDashboardStaffDocuments(dashboardStaffListQuery);

  return sortDashboardStaffItems(
    groupDashboardStaffDocuments(result).map(adaptDashboardStaffPair)
  );
};

export const getDashboardStaffById = async (
  id: string
): Promise<DashboardStaffItem | null> => {
  const pair = await getDashboardStaffPairById(id);

  return pair ? adaptDashboardStaffPair(pair) : null;
};

export const saveDashboardStaffDraft = async (
  id: string | null,
  input: DashboardStaffDraftMutationInput
): Promise<DashboardStaffItem> => {
  const canonicalId = id ? getCanonicalStaffId(id) : createCanonicalStaffId();
  const previousPair = await getDashboardStaffPairById(canonicalId);
  const previousDraft = previousPair?.draft;
  const previousSelected = previousDraft ?? previousPair?.published;
  const draft = await buildStaffDocument(
    getDraftStaffId(canonicalId),
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
    await safelyDeleteUploadedPhoto(draft.uploadedAssetId);
    throw error;
  }

  const staffMember = await getDashboardStaffById(canonicalId);

  if (!staffMember) {
    throw new Error("Saved draft staff member could not be reloaded.");
  }

  if (
    previousDraft?.imageAssetId &&
    previousDraft.imageAssetId !== draft.photoAssetId
  ) {
    await safelyDeleteStaffPhotoAsset(previousDraft.imageAssetId);
  }

  return staffMember;
};

export const publishDashboardStaff = async (
  id: string | null,
  input: DashboardStaffMutationInput
): Promise<DashboardStaffItem> => {
  const canonicalId = id ? getCanonicalStaffId(id) : createCanonicalStaffId();
  const previousPair = await getDashboardStaffPairById(canonicalId);
  const previousSelected = previousPair?.draft ?? previousPair?.published;
  const published = await buildStaffDocument(
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
          id: getDraftStaffId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedPhoto(published.uploadedAssetId);
    throw error;
  }

  const staffMember = await getDashboardStaffById(canonicalId);

  if (!staffMember) {
    throw new Error("Published staff member could not be reloaded.");
  }

  const previousPhotoAssetIds = new Set(
    [previousPair?.published?.imageAssetId, previousPair?.draft?.imageAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );

  previousPhotoAssetIds.delete(published.photoAssetId ?? "");

  await Promise.all(
    [...previousPhotoAssetIds].map((assetId) =>
      safelyDeleteStaffPhotoAsset(assetId)
    )
  );

  return staffMember;
};

export const deleteDashboardStaff = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalStaffId(id);
  const pair = await getDashboardStaffPairById(canonicalId);
  const photoAssetIds = new Set(
    [pair?.published?.imageAssetId, pair?.draft?.imageAssetId].filter(
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
    [...photoAssetIds].map((assetId) => safelyDeleteStaffPhotoAsset(assetId))
  );
};
