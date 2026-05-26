import type {
  DashboardGalleryDraftMutationInput,
  DashboardGalleryMutationInput,
  DashboardGalleryPhotoMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";

export const buildGalleryImageValue = (assetId: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
});

export const safelyDeleteGalleryImageAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should never make an already-saved gallery mutation fail.
    // Sanity may reject deletion if another document still references the asset.
  }
};

export const getGalleryPhotoUploadFile = (
  input: DashboardGalleryMutationInput | DashboardGalleryDraftMutationInput,
  photo: DashboardGalleryPhotoMutationInput
): File | null => {
  const uploadKey = photo.uploadKey?.trim();

  if (!uploadKey) {
    return null;
  }

  return input.photoImageFiles?.[uploadKey] ?? null;
};

export const uploadGalleryPhotoAsset = async (
  imageFile: File
): Promise<string> => {
  const uploadedAsset = await uploadSanityImageAsset(imageFile, {
    tag: "dashboard.galleries.photo",
  });

  return uploadedAsset._id;
};
