import type {
  DashboardOrganizationDraftMutationInput,
  DashboardOrganizationMutationInput,
} from "../../../src/types/dashboard";
import { deleteSanityDocument, uploadSanityImageAsset } from "../sanity.js";

type DashboardOrganizationLogoInput =
  | DashboardOrganizationMutationInput
  | DashboardOrganizationDraftMutationInput;

export const buildOrganizationLogoValue = (assetId: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
});

export const safelyDeleteOrganizationLogoAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should not fail an already-completed organization mutation.
  }
};

export const resolveNextOrganizationLogo = async (
  input: DashboardOrganizationLogoInput,
  previousLogo?: unknown,
  previousLogoAssetId?: string | null
): Promise<{
  logo?: unknown;
  assetId: string | null;
  uploadedAssetId: string | null;
}> => {
  if (input.logoImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.logoImage, {
      tag: "dashboard.organizations.logo",
    });

    return {
      logo: buildOrganizationLogoValue(uploadedAsset._id),
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
      (previousLogoAssetId
        ? buildOrganizationLogoValue(previousLogoAssetId)
        : undefined),
    assetId: previousLogoAssetId ?? null,
    uploadedAssetId: null,
  };
};
