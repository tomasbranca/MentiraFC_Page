import type {
  DashboardPlayerDraftMutationInput,
  DashboardPlayerMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";

type DashboardPlayerPhotoInput =
  | DashboardPlayerMutationInput
  | DashboardPlayerDraftMutationInput;

export const buildPlayerPhotoValue = (assetId: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
});

export const safelyDeletePlayerPhotoAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should not fail an already-completed player mutation.
  }
};

export const resolveNextPlayerPhoto = async (
  input: DashboardPlayerPhotoInput,
  previousPhoto?: unknown,
  previousPhotoAssetId?: string | null
): Promise<{
  photo?: unknown;
  assetId: string | null;
  uploadedAssetId: string | null;
}> => {
  if (input.photoImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.photoImage, {
      tag: "dashboard.players.photo",
    });

    return {
      photo: buildPlayerPhotoValue(uploadedAsset._id),
      assetId: uploadedAsset._id,
      uploadedAssetId: uploadedAsset._id,
    };
  }

  if (input.removePhoto) {
    return {
      photo: undefined,
      assetId: null,
      uploadedAssetId: null,
    };
  }

  return {
    photo:
      previousPhoto ??
      (previousPhotoAssetId
        ? buildPlayerPhotoValue(previousPhotoAssetId)
        : undefined),
    assetId: previousPhotoAssetId ?? null,
    uploadedAssetId: null,
  };
};
