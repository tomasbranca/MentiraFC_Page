import {
  parseDashboardNewsDraftRequestInput,
  parseDashboardNewsRequestInput,
  validateDashboardNewsContent,
  validateDashboardNewsImageFile,
} from "../news.js";
import { errorJson } from "../responses.js";

export const validateDashboardNewsMutation = async (
  request: Request
): Promise<
  | { ok: true; input: NonNullable<Awaited<ReturnType<typeof parseDashboardNewsRequestInput>>> }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardNewsRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos de la noticia no son válidos.", 400),
    };
  }

  const imageError = validateDashboardNewsImageFile(input.coverImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  const contentError = validateDashboardNewsContent(input);

  if (contentError) {
    return {
      ok: false,
      response: errorJson(contentError, 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardNewsDraftMutation = async (
  request: Request
): Promise<
  | { ok: true; input: NonNullable<Awaited<ReturnType<typeof parseDashboardNewsDraftRequestInput>>> }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardNewsDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  const imageError = validateDashboardNewsImageFile(input.coverImage);

  if (imageError) {
    return {
      ok: false,
      response: errorJson(imageError, 400),
    };
  }

  return { ok: true, input };
};
