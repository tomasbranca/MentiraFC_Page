import { randomUUID } from "node:crypto";

import type {
  DashboardPlayerDraftMutationInput,
  DashboardPlayerItem,
  DashboardPlayerMutationInput,
} from "../../../src/types/dashboard";
import { mutateSanity, querySanity } from "../sanity.js";
import {
  dashboardPlayerByIdQuery,
  dashboardPlayerListQuery,
  dashboardPlayerReferenceUsageQuery,
} from "./queries.js";
import {
  resolveNextPlayerPhoto,
  safelyDeletePlayerPhotoAsset,
} from "./imageAssets.js";
import { adaptDashboardPlayerItem } from "./validation.js";

const DRAFT_PREFIX = "drafts.";
const PUBLIC_PLAYER_PREFIX = "players-";

type DashboardPlayerDocument = {
  id: string;
  updatedAt?: string | null;
  name?: string | null;
  lastName?: string | null;
  number?: number | null;
  position?: string | null;
  dominantFoot?: string | null;
  fieldRatings?: Record<string, number | null> | null;
  goalkeeperRatings?: Record<string, number | null> | null;
  birthDate?: string | null;
  slug?: string | null;
  photo?: unknown;
  imageAssetId?: string | null;
  imageUrl?: string | null;
};

type DashboardPlayerDocumentPair = {
  canonicalId: string;
  published?: DashboardPlayerDocument;
  draft?: DashboardPlayerDocument;
};

type DashboardPlayerReference = {
  _key?: string;
  _ref?: string;
  _type?: string;
  [key: string]: unknown;
};

type DashboardRelatedGame = {
  id: string;
  playedPlayers?: DashboardPlayerReference[] | null;
};

type DashboardRelatedEvent = {
  id: string;
};

type DashboardPlayerReferenceUsage = {
  games?: DashboardRelatedGame[];
  events?: DashboardRelatedEvent[];
};

const getCanonicalPlayerId = (id: string): string =>
  id.startsWith(DRAFT_PREFIX) ? id.slice(DRAFT_PREFIX.length) : id;

const getDraftPlayerId = (id: string): string =>
  `${DRAFT_PREFIX}${getCanonicalPlayerId(id)}`;

export const createCanonicalPlayerId = (): string =>
  `${PUBLIC_PLAYER_PREFIX}${randomUUID()}`;

const getSelectedDocument = ({
  draft,
  published,
}: DashboardPlayerDocumentPair): DashboardPlayerDocument | undefined =>
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

export const buildDashboardPlayerSlug = ({
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

const groupDashboardPlayerDocuments = (
  documents: DashboardPlayerDocument[]
): DashboardPlayerDocumentPair[] => {
  const pairs = new Map<string, DashboardPlayerDocumentPair>();

  for (const document of documents) {
    const canonicalId = getCanonicalPlayerId(document.id);
    const pair =
      pairs.get(canonicalId) ??
      ({
        canonicalId,
      } satisfies DashboardPlayerDocumentPair);

    if (document.id.startsWith(DRAFT_PREFIX)) {
      pair.draft = document;
    } else {
      pair.published = document;
    }

    pairs.set(canonicalId, pair);
  }

  return [...pairs.values()];
};

const adaptDashboardPlayerPair = (
  pair: DashboardPlayerDocumentPair
): DashboardPlayerItem => {
  const selectedDocument = getSelectedDocument(pair);
  const name = normalizeString(selectedDocument?.name);
  const lastName = normalizeString(selectedDocument?.lastName);
  const fullName = [name, lastName].filter(Boolean).join(" ").trim();

  return adaptDashboardPlayerItem({
    id: pair.canonicalId,
    publishedId: pair.published?.id ?? null,
    draftId: pair.draft?.id ?? null,
    status: pair.draft ? "draft" : "published",
    hasDraft: Boolean(pair.draft),
    hasPublishedVersion: Boolean(pair.published),
    name,
    lastName,
    fullName: fullName || "Jugador sin nombre",
    number: selectedDocument?.number ?? null,
    position: selectedDocument?.position ?? null,
    dominantFoot: selectedDocument?.dominantFoot ?? null,
    fieldRatings: selectedDocument?.fieldRatings ?? undefined,
    goalkeeperRatings: selectedDocument?.goalkeeperRatings ?? undefined,
    birthDate: selectedDocument?.birthDate ?? null,
    updatedAt: selectedDocument?.updatedAt ?? null,
    slug: normalizeString(selectedDocument?.slug),
    imageAssetId: selectedDocument?.imageAssetId ?? null,
    imageUrl: selectedDocument?.imageUrl ?? null,
  });
};

const sortDashboardPlayerItems = (
  items: DashboardPlayerItem[]
): DashboardPlayerItem[] =>
  [...items].sort((left, right) => {
    const leftNumber = left.number ?? Number.POSITIVE_INFINITY;
    const rightNumber = right.number ?? Number.POSITIVE_INFINITY;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.fullName.localeCompare(right.fullName, "es");
  });

const queryDashboardPlayerDocuments = async (
  query: string,
  params?: Record<string, string>
): Promise<DashboardPlayerDocument[]> =>
  querySanity<DashboardPlayerDocument[]>(query, {
    params,
    perspective: "raw",
    useToken: true,
  });

const getDashboardPlayerPairById = async (
  id: string
): Promise<DashboardPlayerDocumentPair | null> => {
  const canonicalId = getCanonicalPlayerId(id);
  const result = await queryDashboardPlayerDocuments(dashboardPlayerByIdQuery, {
    id: canonicalId,
    draftId: getDraftPlayerId(canonicalId),
  });
  const [pair] = groupDashboardPlayerDocuments(result);

  return pair ?? null;
};

const compactRatings = (
  ratings?: Record<string, number | undefined>
): Record<string, number> | undefined => {
  const compacted = Object.fromEntries(
    Object.entries(ratings ?? {}).filter(([, value]) => typeof value === "number")
  ) as Record<string, number>;

  return Object.keys(compacted).length > 0 ? compacted : undefined;
};

const buildPlayerDocument = async (
  id: string,
  input: DashboardPlayerMutationInput | DashboardPlayerDraftMutationInput,
  previousDocument?: DashboardPlayerDocument
) => {
  const photo = await resolveNextPlayerPhoto(
    input,
    previousDocument?.photo,
    previousDocument?.imageAssetId
  );
  const slug = buildDashboardPlayerSlug({
    id: getCanonicalPlayerId(id),
    name: input.name,
    lastName: input.lastName,
  });
  const isGoalkeeper = input.position === "arq";

  return {
    document: {
      _id: id,
      _type: "players",
      name: input.name?.trim() ?? "",
      lastName: input.lastName?.trim() ?? "",
      number: input.number,
      position: input.position,
      dominantFoot: input.dominantFoot,
      fieldRatings: isGoalkeeper ? undefined : compactRatings(input.fieldRatings),
      goalkeeperRatings:
        input.position && !isGoalkeeper
          ? undefined
          : compactRatings(input.goalkeeperRatings),
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
  await safelyDeletePlayerPhotoAsset(assetId);
};

const getDocumentIdsToDelete = (
  pair: DashboardPlayerDocumentPair | null,
  canonicalId: string
): string[] => [
  pair?.published?.id ?? canonicalId,
  pair?.draft?.id ?? getDraftPlayerId(canonicalId),
];

const getReferenceIdsToRemove = (
  pair: DashboardPlayerDocumentPair | null,
  canonicalId: string
): Set<string> =>
  new Set(
    [
      canonicalId,
      getDraftPlayerId(canonicalId),
      pair?.published?.id,
      pair?.draft?.id,
    ].filter((id): id is string => Boolean(id))
  );

export const filterDashboardPlayerReferences = (
  references: DashboardPlayerReference[] = [],
  idsToRemove: Set<string>
): DashboardPlayerReference[] =>
  references.filter((reference) => !reference._ref || !idsToRemove.has(reference._ref));

export const buildDashboardPlayerReferenceCleanupMutations = (
  usage: DashboardPlayerReferenceUsage,
  idsToRemove: Set<string>
): unknown[] => [
  ...(usage.games ?? []).map((game) => ({
    patch: {
      id: game.id,
      set: {
        playedPlayers: filterDashboardPlayerReferences(
          game.playedPlayers ?? [],
          idsToRemove
        ),
      },
    },
  })),
  ...(usage.events ?? []).map((event) => ({
    patch: {
      id: event.id,
      unset: ["player"],
    },
  })),
];

const getDashboardPlayerReferenceUsage = async (
  canonicalId: string
): Promise<DashboardPlayerReferenceUsage> =>
  querySanity<DashboardPlayerReferenceUsage>(dashboardPlayerReferenceUsageQuery, {
    params: {
      id: canonicalId,
      draftId: getDraftPlayerId(canonicalId),
    },
    perspective: "raw",
    useToken: true,
  });

export const listDashboardPlayers = async (): Promise<DashboardPlayerItem[]> => {
  const result = await queryDashboardPlayerDocuments(dashboardPlayerListQuery);

  return sortDashboardPlayerItems(
    groupDashboardPlayerDocuments(result).map(adaptDashboardPlayerPair)
  );
};

export const getDashboardPlayerById = async (
  id: string
): Promise<DashboardPlayerItem | null> => {
  const pair = await getDashboardPlayerPairById(id);

  return pair ? adaptDashboardPlayerPair(pair) : null;
};

export const saveDashboardPlayerDraft = async (
  id: string | null,
  input: DashboardPlayerDraftMutationInput
): Promise<DashboardPlayerItem> => {
  const canonicalId = id ? getCanonicalPlayerId(id) : createCanonicalPlayerId();
  const previousPair = await getDashboardPlayerPairById(canonicalId);
  const previousDraft = previousPair?.draft;
  const previousSelected = previousDraft ?? previousPair?.published;
  const draft = await buildPlayerDocument(
    getDraftPlayerId(canonicalId),
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

  const player = await getDashboardPlayerById(canonicalId);

  if (!player) {
    throw new Error("Saved draft player could not be reloaded.");
  }

  if (
    previousDraft?.imageAssetId &&
    previousDraft.imageAssetId !== draft.photoAssetId
  ) {
    await safelyDeletePlayerPhotoAsset(previousDraft.imageAssetId);
  }

  return player;
};

export const publishDashboardPlayer = async (
  id: string | null,
  input: DashboardPlayerMutationInput
): Promise<DashboardPlayerItem> => {
  const canonicalId = id ? getCanonicalPlayerId(id) : createCanonicalPlayerId();
  const previousPair = await getDashboardPlayerPairById(canonicalId);
  const previousSelected = previousPair?.draft ?? previousPair?.published;
  const published = await buildPlayerDocument(
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
          id: getDraftPlayerId(canonicalId),
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteUploadedPhoto(published.uploadedAssetId);
    throw error;
  }

  const player = await getDashboardPlayerById(canonicalId);

  if (!player) {
    throw new Error("Published player could not be reloaded.");
  }

  const previousPhotoAssetIds = new Set(
    [previousPair?.published?.imageAssetId, previousPair?.draft?.imageAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );

  previousPhotoAssetIds.delete(published.photoAssetId ?? "");

  await Promise.all(
    [...previousPhotoAssetIds].map((assetId) =>
      safelyDeletePlayerPhotoAsset(assetId)
    )
  );

  return player;
};

export const deleteDashboardPlayer = async (id: string): Promise<void> => {
  const canonicalId = getCanonicalPlayerId(id);
  const pair = await getDashboardPlayerPairById(canonicalId);
  const usage = await getDashboardPlayerReferenceUsage(canonicalId);
  const idsToRemove = getReferenceIdsToRemove(pair, canonicalId);
  const photoAssetIds = new Set(
    [pair?.published?.imageAssetId, pair?.draft?.imageAssetId].filter(
      (assetId): assetId is string => Boolean(assetId)
    )
  );

  await mutateSanity<unknown>([
    ...buildDashboardPlayerReferenceCleanupMutations(usage, idsToRemove),
    ...getDocumentIdsToDelete(pair, canonicalId).map((documentId) => ({
      delete: {
        id: documentId,
      },
    })),
  ]);

  await Promise.all(
    [...photoAssetIds].map((assetId) => safelyDeletePlayerPhotoAsset(assetId))
  );
};
