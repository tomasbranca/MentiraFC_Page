import { randomUUID } from "node:crypto";

import type {
  DashboardGalleryDraftMutationInput,
  DashboardGalleryGameOption,
  DashboardGalleryItem,
  DashboardGalleryMutationInput,
  DashboardGalleryOptions,
  DashboardGalleryPhotoItem,
  DashboardGalleryPhotoMutationInput,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardGalleryByIdQuery,
  dashboardGalleryListQuery,
  dashboardGalleryOptionsQuery,
  dashboardGalleryValidationOptionsQuery,
} from "./queries.js";
import {
  adaptDashboardGalleryItem,
  adaptDashboardGalleryOptions,
} from "./validation.js";
import {
  buildGalleryImageValue,
  getGalleryPhotoUploadFile,
  safelyDeleteGalleryImageAsset,
  uploadGalleryPhotoAsset,
} from "./imageAssets.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_GALLERY_PREFIX = "galleries-";

export class DashboardGalleryValidationError extends Error {}

type DashboardGalleryDocumentPhoto = {
  key?: string | null;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  alt?: string | null;
  caption?: string | null;
  isHero?: boolean | null;
  originalFilename?: string | null;
  dimensions?: {
    width?: number | null;
    height?: number | null;
    aspectRatio?: number | null;
  } | null;
};

type DashboardGalleryDocument = {
  id: string;
  updatedAt?: string | null;
  slug?: string | null;
  gameId?: string | null;
  gameDate?: string | null;
  gameState?: string | null;
  gameLocation?: string | null;
  gameCompetition?: string | null;
  gameTournamentId?: string | null;
  gameTournamentName?: string | null;
  gameTournamentOrganizationName?: string | null;
  rivalId?: string | null;
  rivalName?: string | null;
  rivalImageUrl?: string | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  photos?: DashboardGalleryDocumentPhoto[] | null;
};

type DashboardGalleryDocumentPair = {
  canonicalId: string;
  published?: DashboardGalleryDocument;
  draft?: DashboardGalleryDocument;
};

type DashboardGalleryOptionsSource = {
  games?: DashboardGalleryGameOption[];
};

type DashboardGalleryValidationSource = {
  games?: Array<{
    id: string;
  }>;
};

type ResolvedGalleryPhotos = {
  photos: Array<{
    _key: string;
    _type: "galleryPhoto";
    image: ReturnType<typeof buildGalleryImageValue>;
    alt?: string;
    caption?: string;
    isHero: boolean;
  }>;
  assetIds: string[];
  uploadedAssetIds: string[];
};

const getCanonicalGalleryId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftGalleryId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalGalleryId(id)}`;

export const createCanonicalGalleryId = (): string =>
  `${PUBLIC_GALLERY_PREFIX}${randomUUID()}`;

const normalizeString = (value?: string | null): string =>
  value?.trim() ?? "";

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getSelectedDocument = ({
  draft,
  published,
}: DashboardGalleryDocumentPair): DashboardGalleryDocument | undefined =>
  draft ?? published;

const groupDashboardGalleryDocuments = (
  documents: DashboardGalleryDocument[]
): DashboardGalleryDocumentPair[] => {
  const pairs = new Map<string, DashboardGalleryDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalGalleryId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardGalleryDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptPhoto = (
  photo: DashboardGalleryDocumentPhoto,
  index: number
): DashboardGalleryPhotoItem => ({
  key: photo.key ?? `photo-${index + 1}`,
  imageAssetId: photo.imageAssetId ?? null,
  imageUrl: photo.imageUrl ?? null,
  alt: photo.alt ?? null,
  caption: photo.caption ?? null,
  isHero: Boolean(photo.isHero),
  originalFilename: photo.originalFilename ?? null,
  dimensions: photo.dimensions ?? null,
});

const adaptDashboardGalleryPair = (
  pair: DashboardGalleryDocumentPair
): DashboardGalleryItem => {
  const selectedDocument = getSelectedDocument(pair);
  const photos = (selectedDocument?.photos ?? []).map(adaptPhoto);

  return adaptDashboardGalleryItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    slug: normalizeString(selectedDocument?.slug),
    updatedAt: selectedDocument?.updatedAt ?? null,
    gameId: selectedDocument?.gameId ?? null,
    gameDate: selectedDocument?.gameDate ?? null,
    gameState: selectedDocument?.gameState ?? null,
    gameLocation: selectedDocument?.gameLocation ?? null,
    gameCompetition: selectedDocument?.gameCompetition ?? null,
    gameTournamentId: selectedDocument?.gameTournamentId ?? null,
    gameTournamentName: selectedDocument?.gameTournamentName ?? null,
    gameTournamentOrganizationName:
      selectedDocument?.gameTournamentOrganizationName ?? null,
    rivalId: selectedDocument?.rivalId ?? null,
    rivalName: selectedDocument?.rivalName ?? null,
    rivalImageUrl: selectedDocument?.rivalImageUrl ?? null,
    goalsFor: normalizeOptionalNumber(selectedDocument?.goalsFor),
    goalsAgainst: normalizeOptionalNumber(selectedDocument?.goalsAgainst),
    photos,
    photoCount: photos.filter((photo) => photo.imageAssetId || photo.imageUrl)
      .length,
  });
};

const sortDashboardGalleryItems = (
  items: DashboardGalleryItem[]
): DashboardGalleryItem[] =>
  [...items].sort((left, right) => {
    const leftTime =
      new Date(left.gameDate ?? left.updatedAt ?? "").getTime() || 0;
    const rightTime =
      new Date(right.gameDate ?? right.updatedAt ?? "").getTime() || 0;

    return rightTime - leftTime;
  });

const queryDashboardGalleryDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardGalleryDocument[]> =>
  querySanity<DashboardGalleryDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardGalleryPairById = async (
  id: string
): Promise<DashboardGalleryDocumentPair | null> => {
  const canonicalId = getCanonicalGalleryId(id);
  const result = await queryDashboardGalleryDocuments(dashboardGalleryByIdQuery, {
    id: canonicalId,
    draftId: getDraftGalleryId(canonicalId),
  });
  const [pair] = groupDashboardGalleryDocuments(result);

  return pair ?? null;
};

const buildReference = (id?: string | null) =>
  id
    ? {
        _type: "reference",
        _ref: id,
      }
    : undefined;

const sanitizeKey = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "photo";

const createPhotoKey = (
  photo: DashboardGalleryPhotoMutationInput,
  index: number
): string =>
  sanitizeKey(photo.key || photo.imageAssetId || photo.uploadKey || `photo-${index + 1}`);

const resolveGalleryPhotos = async (
  input: DashboardGalleryMutationInput | DashboardGalleryDraftMutationInput
): Promise<ResolvedGalleryPhotos> => {
  const photos: ResolvedGalleryPhotos["photos"] = [];
  const assetIds: string[] = [];
  const uploadedAssetIds: string[] = [];

  for (const [index, photo] of (input.photos ?? []).entries()) {
    const uploadFile = getGalleryPhotoUploadFile(input, photo);
    const assetId = uploadFile
      ? await uploadGalleryPhotoAsset(uploadFile)
      : photo.imageAssetId?.trim();

    if (!assetId) {
      continue;
    }

    if (uploadFile) {
      uploadedAssetIds.push(assetId);
    }

    assetIds.push(assetId);
    photos.push({
      _key: createPhotoKey(photo, index),
      _type: "galleryPhoto",
      image: buildGalleryImageValue(assetId),
      alt: photo.alt?.trim() || undefined,
      caption: photo.caption?.trim() || undefined,
      isHero: Boolean(photo.isHero),
    });
  }

  return {
    photos,
    assetIds,
    uploadedAssetIds,
  };
};

const buildGalleryDocument = (
  id: string,
  input: DashboardGalleryMutationInput | DashboardGalleryDraftMutationInput,
  photos: ResolvedGalleryPhotos["photos"]
) => ({
  _id: id,
  _type: "galleries",
  game: buildReference(input.gameId),
  slug: input.slug?.trim()
    ? {
        _type: "slug",
        current: input.slug.trim(),
      }
    : undefined,
  photos: photos.length > 0 ? photos : undefined,
});

const getDocumentIdsToDelete = (
  pair: DashboardGalleryDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftGalleryId(canonicalId),
];

const collectPhotoAssetIds = (
  photos?: DashboardGalleryDocumentPhoto[] | null
): Set<string> =>
  new Set(
    (photos ?? [])
      .map((photo) => photo.imageAssetId)
      .filter((assetId): assetId is string => Boolean(assetId))
  );

const safelyDeleteUploadedAssets = async (assetIds: string[]) => {
  await Promise.all(
    assetIds.map((assetIdToDelete) =>
      safelyDeleteGalleryImageAsset(assetIdToDelete)
    )
  );
};

const getDashboardGalleryValidationSource =
  async (): Promise<DashboardGalleryValidationSource> =>
    querySanity<DashboardGalleryValidationSource>(
      dashboardGalleryValidationOptionsQuery,
      {
        perspective: "raw",
        useToken: true,
      }
    );

const validateGalleryReferences = async (
  input: DashboardGalleryMutationInput
): Promise<string | null> => {
  const source = await getDashboardGalleryValidationSource();
  const finishedGameIds = new Set((source.games ?? []).map((game) => game.id));

  if (!finishedGameIds.has(input.gameId)) {
    return "El partido seleccionado no existe o no esta finalizado.";
  }

  return null;
};

export const listDashboardGalleries =
  async (): Promise<DashboardGalleryItem[]> => {
    const result = await queryDashboardGalleryDocuments(
      dashboardGalleryListQuery
    );

    return sortDashboardGalleryItems(
      groupDashboardGalleryDocuments(result).map(adaptDashboardGalleryPair)
    );
  };

export const getDashboardGalleryById = async (
  id: string
): Promise<DashboardGalleryItem | null> => {
  const pair = await getDashboardGalleryPairById(id);

  return pair ? adaptDashboardGalleryPair(pair) : null;
};

export const getDashboardGalleryOptions =
  async (): Promise<DashboardGalleryOptions> => {
    const result = await querySanity<DashboardGalleryOptionsSource>(
      dashboardGalleryOptionsQuery,
      {
        perspective: "raw",
        useToken: true,
      }
    );

    return adaptDashboardGalleryOptions({
      games: result.games ?? [],
    });
  };

export const saveDashboardGalleryDraft = async (
  id: string | null,
  input: DashboardGalleryDraftMutationInput
): Promise<DashboardGalleryItem> => {
  const canonicalId = id ? getCanonicalGalleryId(id) : createCanonicalGalleryId();
  const previousPair = await getDashboardGalleryPairById(canonicalId);
  const draftPhotos = await resolveGalleryPhotos(input);

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: buildGalleryDocument(
          getDraftGalleryId(canonicalId),
          input,
          draftPhotos.photos
        ),
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedAssets(draftPhotos.uploadedAssetIds);
    throw error;
  }

  const gallery = await getDashboardGalleryById(canonicalId);

  if (!gallery) {
    throw new Error("Saved draft gallery could not be reloaded.");
  }

  const previousDraftAssetIds = collectPhotoAssetIds(previousPair?.draft?.photos);
  const nextAssetIds = new Set(draftPhotos.assetIds);
  const publishedAssetIds = collectPhotoAssetIds(previousPair?.published?.photos);

  await Promise.all(
    [...previousDraftAssetIds]
      .filter(
        (assetIdToDelete) =>
          !nextAssetIds.has(assetIdToDelete) &&
          !publishedAssetIds.has(assetIdToDelete)
      )
      .map((assetIdToDelete) =>
        safelyDeleteGalleryImageAsset(assetIdToDelete)
      )
  );

  return gallery;
};

export const publishDashboardGallery = async (
  id: string | null,
  input: DashboardGalleryMutationInput
): Promise<DashboardGalleryItem> => {
  const referenceError = await validateGalleryReferences(input);

  if (referenceError) {
    throw new DashboardGalleryValidationError(referenceError);
  }

  const canonicalId = id ? getCanonicalGalleryId(id) : createCanonicalGalleryId();
  const previousPair = await getDashboardGalleryPairById(canonicalId);
  const publishedPhotos = await resolveGalleryPhotos(input);

  try {
    await mutateSanity<unknown>([
      {
        createOrReplace: buildGalleryDocument(
          canonicalId,
          input,
          publishedPhotos.photos
        ),
      },
      {
        delete: {
          id: getDraftGalleryId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedAssets(publishedPhotos.uploadedAssetIds);
    throw error;
  }

  const gallery = await getDashboardGalleryById(canonicalId);

  if (!gallery) {
    throw new Error("Published gallery could not be reloaded.");
  }

  const previousAssetIds = new Set([
    ...collectPhotoAssetIds(previousPair?.published?.photos),
    ...collectPhotoAssetIds(previousPair?.draft?.photos),
  ]);
  const nextAssetIds = new Set(publishedPhotos.assetIds);

  await Promise.all(
    [...previousAssetIds]
      .filter((assetIdToDelete) => !nextAssetIds.has(assetIdToDelete))
      .map((assetIdToDelete) =>
        safelyDeleteGalleryImageAsset(assetIdToDelete)
      )
  );

  return gallery;
};

export const deleteDashboardGallery = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalGalleryId(id);
  const pair = await getDashboardGalleryPairById(canonicalId);
  const assetIds = new Set([
    ...collectPhotoAssetIds(pair?.published?.photos),
    ...collectPhotoAssetIds(pair?.draft?.photos),
  ]);

  await mutateSanity<unknown>(
    getDocumentIdsToDelete(pair, canonicalId).map((documentId) => ({
      delete: {
        id: documentId,
      },
    }))
  );

  await Promise.all(
    [...assetIds].map((assetIdToDelete) =>
      safelyDeleteGalleryImageAsset(assetIdToDelete)
    )
  );
};
