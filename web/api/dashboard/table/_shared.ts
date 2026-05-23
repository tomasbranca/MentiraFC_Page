import {
  parseDashboardTableDraftRequestInput,
  parseDashboardTableRequestInput,
} from "../../_lib/table.js";
import { errorJson } from "../../_lib/responses.js";

export const validateDashboardTableMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTableRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTableRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos de la tabla no son validos.", 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardTableDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTableDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTableDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  return { ok: true, input };
};
