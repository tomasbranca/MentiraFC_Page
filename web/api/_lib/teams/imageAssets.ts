import type {
  DashboardTeamDraftMutationInput,
  DashboardTeamMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";

type DashboardTeamLogoInput =
  | DashboardTeamMutationInput
  | DashboardTeamDraftMutationInput;

export const buildTeamLogoValue = (assetId: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
});

export const safelyDeleteTeamLogoAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should not fail an already-completed team mutation.
  }
};

export const resolveNextTeamLogo = async (
  input: DashboardTeamLogoInput,
  previousLogo?: unknown,
  previousLogoAssetId?: string | null
): Promise<{
  logo?: unknown;
  assetId: string | null;
  uploadedAssetId: string | null;
}> => {
  if (input.logoImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.logoImage, {
      tag: "dashboard.teams.logo",
    });

    return {
      logo: buildTeamLogoValue(uploadedAsset._id),
      assetId: uploadedAsset._id,
      uploadedAssetId: uploadedAsset._id,
    };
  }

  if (input.removeLogo) {
    return {
      logo: undefined,
      assetId: null,
      uploadedAssetId: null,
    };
  }

  return {
    logo:
      previousLogo ??
      (previousLogoAssetId ? buildTeamLogoValue(previousLogoAssetId) : undefined),
    assetId: previousLogoAssetId ?? null,
    uploadedAssetId: null,
  };
};
