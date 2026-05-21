import {
  parseDashboardMatchDraftRequestInput,
  parseDashboardMatchRequestInput,
} from "../../_lib/matches.js";
import { errorJson } from "../../_lib/responses.js";

export const validateDashboardMatchMutation = async (
  request: Request
): Promise<
  | { ok: true; input: NonNullable<Awaited<ReturnType<typeof parseDashboardMatchRequestInput>>> }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardMatchRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del partido no son validos.", 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardMatchDraftMutation = async (
  request: Request
): Promise<
  | { ok: true; input: NonNullable<Awaited<ReturnType<typeof parseDashboardMatchDraftRequestInput>>> }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardMatchDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  return { ok: true, input };
};
