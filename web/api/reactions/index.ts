import { errorJson, json } from "../_lib/responses.js";
import {
  ensureReactionTargetExists,
  getBearerToken,
  getReactionState,
  normalizeEmoji,
  normalizeReactionTarget,
  removeReaction,
  setReaction,
} from "../_lib/reactions.js";
import {
  assertRateLimit,
  getClientIp,
  isRateLimitError,
  RATE_LIMIT_MESSAGE,
} from "../_lib/rateLimit.js";
import { hasExcessiveContentLength } from "../_lib/requestValidation.js";
import { AUTHENTICATED_WRITE_IP_RATE_LIMIT_RULES } from "../_lib/securityLimits.js";
import { logSecurityEvent } from "../_lib/securityLog.js";

const MAX_REACTION_MUTATION_PAYLOAD_BYTES = 2_000;

const getTargetFromRequest = (request: Request) => {
  const url = new URL(request.url);

  return normalizeReactionTarget({
    targetType: url.searchParams.get("targetType"),
    targetId: url.searchParams.get("targetId"),
  });
};

const parseMutationBody = async (request: Request) => {
  try {
    return (await request.json()) as {
      targetType?: unknown;
      targetId?: unknown;
      emoji?: unknown;
    };
  } catch {
    return null;
  }
};

const validateExistingTarget = async (
  target: NonNullable<ReturnType<typeof normalizeReactionTarget>>
): Promise<Response | null> => {
  const exists = await ensureReactionTargetExists(target);

  return exists ? null : errorJson("La entidad no existe o no esta publicada.", 404);
};

const assertReactionIpRateLimit = (request: Request): void => {
  const clientIp = getClientIp(request);

  if (!clientIp) {
    return;
  }

  assertRateLimit({
    action: "reactions:write:ip",
    identifier: clientIp,
    rules: AUTHENTICATED_WRITE_IP_RATE_LIMIT_RULES,
    meta: { route: "reactions" },
  });
};

const reactionsHandler = async (request: Request): Promise<Response> => {
  try {
    const token = getBearerToken(request);

    if (request.method === "GET") {
      const target = getTargetFromRequest(request);

      if (!target) {
        return errorJson("Falta una entidad valida para las reacciones.", 400);
      }

      return json(await getReactionState(target, token));
    }

    if (request.method === "POST") {
      if (!token) {
        logSecurityEvent("reaction_create_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      assertReactionIpRateLimit(request);

      if (hasExcessiveContentLength(request, MAX_REACTION_MUTATION_PAYLOAD_BYTES)) {
        return errorJson("El payload de reaccion es demasiado grande.", 413);
      }

      const body = await parseMutationBody(request);

      if (!body) {
        return errorJson("El payload de reaccion no es valido.", 400);
      }

      const target = normalizeReactionTarget({
        targetType: body.targetType,
        targetId: body.targetId,
      });
      const emoji = normalizeEmoji(body.emoji);

      if (!target) {
        return errorJson("Falta una entidad valida para la reaccion.", 400);
      }

      if (!emoji) {
        return errorJson("La reaccion debe ser un unico emoji valido.", 400);
      }

      const targetError = await validateExistingTarget(target);

      if (targetError) {
        return targetError;
      }

      return json(await setReaction(target, emoji, token));
    }

    if (request.method === "DELETE") {
      if (!token) {
        logSecurityEvent("reaction_delete_unauthorized", {
          method: request.method,
        });
        return errorJson("No autorizado.", 401);
      }

      assertReactionIpRateLimit(request);

      const target = getTargetFromRequest(request);

      if (!target) {
        return errorJson("Falta una entidad valida para la reaccion.", 400);
      }

      const targetError = await validateExistingTarget(target);

      if (targetError) {
        return targetError;
      }

      return json(await removeReaction(target, token));
    }

    return errorJson("Metodo no permitido.", 405);
  } catch (error) {
    if (isRateLimitError(error)) {
      return errorJson(RATE_LIMIT_MESSAGE, 429);
    }

    if (
      error instanceof Error &&
      (error.message === "Missing auth token." ||
        error.message === "Invalid auth token.")
    ) {
      return errorJson("No autorizado.", 401);
    }

    if (error instanceof Error && error.message === "Inactive user.") {
      return errorJson("Tu usuario ha sido baneado.", 403);
    }

    logSecurityEvent("reactions_api_sensitive_error", {}, "error");

    return errorJson(
      "No pudimos procesar las reacciones. Verifica la configuracion del backend.",
      500
    );
  }
};

export default {
  fetch: reactionsHandler,
};
