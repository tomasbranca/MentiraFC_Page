import {
  parseDashboardTournamentDraftRequestInput,
  parseDashboardTournamentRequestInput,
} from "../tournaments.js";
import { errorJson } from "../responses.js";

export const validateDashboardTournamentMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTournamentRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTournamentRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Los datos del torneo no son validos.", 400),
    };
  }

  return { ok: true, input };
};

export const validateDashboardTournamentDraftMutation = async (
  request: Request
): Promise<
  | {
      ok: true;
      input: NonNullable<
        Awaited<ReturnType<typeof parseDashboardTournamentDraftRequestInput>>
      >;
    }
  | { ok: false; response: Response }
> => {
  const input = await parseDashboardTournamentDraftRequestInput(request);

  if (!input) {
    return {
      ok: false,
      response: errorJson("Revisa los datos del borrador.", 400),
    };
  }

  return { ok: true, input };
};
