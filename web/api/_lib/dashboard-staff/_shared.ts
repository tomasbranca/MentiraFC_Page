import {
  parseDashboardStaffDraftRequestInput,
  parseDashboardStaffRequestInput,
  validateDashboardStaffImageFile,
} from "../staff.js";
import { errorJson } from "../responses.js";

export const validateDashboardStaffMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardStaffRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardStaffRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del integrante no son validos.", 400),
    };
  }

  const imageError = validateDashboardStaffImageFile(input.photoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardStaffDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardStaffDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardStaffDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateDashboardStaffImageFile(input.photoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
