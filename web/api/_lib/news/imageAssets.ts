import type {
  DashboardNewsInput,
  DashboardNewsMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";
import { DEFAULT_NEWS_IMAGE_ASSET_ID } from "./constants.js";

export const normalizeImageAlt = ({
  title,
  imageAlt,
}: DashboardNewsInput): string => {
  const normalizedImageAlt = imageAlt.trim();
  return normalizedImageAlt || title.trim();
};

export const buildNewsImageValue = (assetId: string, alt: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
  alt,
});

const isDefaultNewsImageAsset = (assetId?: string | null): boolean =>
  assetId === DEFAULT_NEWS_IMAGE_ASSET_ID;

export const safelyDeleteNewsImageAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId || isDefaultNewsImageAsset(assetId)) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should never make an already-saved news mutation fail.
    // Sanity may reject deletion if another document still references the asset.
  }
};

export const resolveNextImageAssetId = async (
  input: DashboardNewsMutationInput,
  previousImageAssetId?: string | null
): Promise<{ assetId: string; uploadedAssetId: string | null }> => {
  if (input.coverImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.coverImage);

    return {
      assetId: uploadedAsset._id,
      uploadedAssetId: uploadedAsset._id,
    };
  }

  if (input.useDefaultImage) {
    return {
      assetId: DEFAULT_NEWS_IMAGE_ASSET_ID,
      uploadedAssetId: null,
    };
  }

  return {
    assetId: previousImageAssetId || DEFAULT_NEWS_IMAGE_ASSET_ID,
    uploadedAssetId: null,
  };
};
