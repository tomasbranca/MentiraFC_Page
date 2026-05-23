import {
  parseDashboardOrganizationDraftRequestInput,
  parseDashboardOrganizationRequestInput,
  validateDashboardOrganizationImageFile,
} from "../../_lib/organizations.js";
import { errorJson } from "../../_lib/responses.js";

export const validateDashboardOrganizationMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardOrganizationRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardOrganizationRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del organizador no son validos.", 400),
    };
  }

  const imageError = validateDashboardOrganizationImageFile(input.logoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardOrganizationDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardOrganizationDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardOrganizationDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateDashboardOrganizationImageFile(input.logoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
