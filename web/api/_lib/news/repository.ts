import type {
  DashboardNewsItem,
  DashboardNewsMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, mutateSanity, querySanity } from "../sanity.js";
import {
  collectContentImageAssetIds,
  normalizeNewsContent,
} from "./content.js";
import {
  buildNewsImageValue,
  normalizeImageAlt,
  resolveNextImageAssetId,
  safelyDeleteNewsImageAsset,
} from "./imageAssets.js";
import {
  dashboardNewsByIdQuery,
  dashboardNewsListQuery,
} from "./queries.js";
import { adaptDashboardNewsItem } from "./validation.js";

export const listDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const result = await querySanity<unknown[]>(dashboardNewsListQuery);

  return result.map(adaptDashboardNewsItem);
};

export const getDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem | null> => {
  const result = await querySanity<unknown | null>(
    dashboardNewsByIdQuery,
    { id }
  );

  return result ? adaptDashboardNewsItem(result) : null;
};

export const createDashboardNews = async (
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const { assetId, uploadedAssetId } = await resolveNextImageAssetId(input);
  const {
    content,
    uploadedAssetIds: uploadedContentAssetIds,
  } = await normalizeNewsContent(input);

  try {
    const created = await mutateSanity<unknown>([
      {
        create: {
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
      },
    ]);

    if (!created || typeof created !== "object" || !("_id" in created)) {
      throw new Error("Sanity did not return the created news item.");
    }

    const news = await getDashboardNewsById(String(created._id));

    if (!news) {
      throw new Error("Created news item could not be reloaded.");
    }

    return news;
  } catch (error) {
    await safelyDeleteNewsImageAsset(uploadedAssetId);
    await Promise.all(
      uploadedContentAssetIds.map((assetIdToDelete) =>
        safelyDeleteNewsImageAsset(assetIdToDelete)
      )
    );
    throw error;
  }
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const previousNews = await getDashboardNewsById(id);
  const { assetId, uploadedAssetId } = await resolveNextImageAssetId(
    input,
    previousNews?.imageAssetId
  );
  const {
    content,
    uploadedAssetIds: uploadedContentAssetIds,
  } = await normalizeNewsContent(input);

  try {
    await mutateSanity<unknown>([
      {
        patch: {
          id,
          set: {
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
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteNewsImageAsset(uploadedAssetId);
    await Promise.all(
      uploadedContentAssetIds.map((assetIdToDelete) =>
        safelyDeleteNewsImageAsset(assetIdToDelete)
      )
    );
    throw error;
  }

  const news = await getDashboardNewsById(id);

  if (!news) {
    throw new Error("Updated news item could not be reloaded.");
  }

  if (previousNews?.imageAssetId && previousNews.imageAssetId !== assetId) {
    await safelyDeleteNewsImageAsset(previousNews.imageAssetId);
  }

  const previousContentAssetIds = collectContentImageAssetIds(
    previousNews?.content
  );
  const nextContentAssetIds = collectContentImageAssetIds(content);

  await Promise.all(
    [...previousContentAssetIds]
      .filter((assetIdToDelete) => !nextContentAssetIds.has(assetIdToDelete))
      .map((assetIdToDelete) => safelyDeleteNewsImageAsset(assetIdToDelete))
  );

  return news;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  const news = await getDashboardNewsById(id);

  await deleteSanityDocument(id);
  await safelyDeleteNewsImageAsset(news?.imageAssetId);
  await Promise.all(
    [...collectContentImageAssetIds(news?.content)].map((assetIdToDelete) =>
      safelyDeleteNewsImageAsset(assetIdToDelete)
    )
  );
};
