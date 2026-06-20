import {
  parseDashboardGalleryDraftRequestInput,
  parseDashboardGalleryRequestInput,
  validateDashboardGalleryImageFile,
} from "../galleries.js";
import { errorJson } from "../responses.js";

const validateGalleryPhotoFiles = (
  input:
    | NonNullable<Awaited<ReturnType<typeof parseDashboardGalleryRequestInput>>>
    | NonNullable<
        Awaited<ReturnType<typeof parseDashboardGalleryDraftRequestInput>>
      >
): string | null => {
  for (const file of Object.values(input.photoImageFiles ?? {})) {
    const imageError = validateDashboardGalleryImageFile(file);

    if (imageError) {
      return imageError;
    }
  }

  return null;
};

export const validateDashboardGalleryMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardGalleryRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardGalleryRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos de la galeria no son validos.", 400),
    };
  }

  const imageError = validateGalleryPhotoFiles(input);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  const hasMissingPhotoImage = input.photos.some((photo) => {
    const uploadKey = photo.uploadKey?.trim();

    return !photo.imageAssetId && (!uploadKey || !input.photoImageFiles?.[uploadKey]);
  });

  if (hasMissingPhotoImage) {
    return {
      ok: false,
      response: errorJson("Cada foto publicada necesita una imagen.", 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardGalleryDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardGalleryDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardGalleryDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateGalleryPhotoFiles(input);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
