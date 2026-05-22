import {
  parseDashboardPlayerDraftRequestInput,
  parseDashboardPlayerRequestInput,
  validateDashboardPlayerImageFile,
} from "../../_lib/players.js";
import { errorJson } from "../../_lib/responses.js";

export const validateDashboardPlayerMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardPlayerRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardPlayerRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del jugador no son validos.", 400),
    };
  }

  const imageError = validateDashboardPlayerImageFile(input.photoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardPlayerDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardPlayerDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardPlayerDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateDashboardPlayerImageFile(input.photoImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
