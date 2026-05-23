import type {
  DashboardStaffDraftMutationInput,
  DashboardStaffMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";

type DashboardStaffPhotoInput =
  | DashboardStaffMutationInput
  | DashboardStaffDraftMutationInput;

export const buildStaffPhotoValue = (assetId: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
});

export const safelyDeleteStaffPhotoAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should not fail an already-completed staff mutation.
  }
};

export const resolveNextStaffPhoto = async (
  input: DashboardStaffPhotoInput,
  previousPhoto?: unknown,
  previousPhotoAssetId?: string | null
): Promise<{
  photo?: unknown;
  assetId: string | null;
  uploadedAssetId: string | null;
}> => {
  if (input.photoImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.photoImage, {
      tag: "dashboard.staff.photo",
    });

    return {
      photo: buildStaffPhotoValue(uploadedAsset._id),
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
        ? buildStaffPhotoValue(previousPhotoAssetId)
        : undefined),
    assetId: previousPhotoAssetId ?? null,
    uploadedAssetId: null,
  };
};
