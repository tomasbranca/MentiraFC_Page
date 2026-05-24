import {
  parseDashboardTeamDraftRequestInput,
  parseDashboardTeamRequestInput,
  validateDashboardTeamImageFile,
} from "../../_lib/teams.js";
import { errorJson } from "../../_lib/responses.js";

export const validateDashboardTeamMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTeamRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTeamRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del club no son validos.", 400),
    };
  }

  const imageError = validateDashboardTeamImageFile(input.logoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardTeamDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTeamDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTeamDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateDashboardTeamImageFile(input.logoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
