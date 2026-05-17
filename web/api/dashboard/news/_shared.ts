import {
  parseDashboardNewsRequestInput,
  validateDashboardNewsContent,
  validateDashboardNewsImageFile,
} from "../../_lib/news.js";
import { errorJson } from "../../_lib/responses.js";

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
