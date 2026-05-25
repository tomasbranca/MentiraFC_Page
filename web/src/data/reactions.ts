import { getCurrentAccessToken, getCurrentAuthSession } from "./auth";
import { z, zodParseOptions } from "./zodRuntime";
import type {
  ReactionState,
  ReactionTarget,
  ReactionTargetType,
} from "../types/reactions";

const reactionTargetTypeSchema = z.enum(["news", "player", "game"]);

const reactionCountSchema = z.object({
  emoji: z.string(),
  count: z.number(),
});

const reactionStateSchema = z.object({
  targetType: reactionTargetTypeSchema,
  targetId: z.string(),
  counts: z.array(reactionCountSchema),
  currentUserReaction: z.string().nullable(),
});

const REACTIONS_API_PATH = "/api/reactions";

const buildReactionApiPath = ({
  targetType,
  targetId,
}: ReactionTarget): string => {
  const params = new URLSearchParams({
    targetType,
    targetId,
  });

  return `${REACTIONS_API_PATH}?${params.toString()}`;
};

const parseReactionState = (data: unknown): ReactionState =>
  reactionStateSchema.parse(data, zodParseOptions) as ReactionState;

const fetchReactionApi = async <T>(
  path: string,
  init?: RequestInit & { auth?: "optional" | "required" }
): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (init?.auth === "required") {
    const accessToken = await getCurrentAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    const { session } = await getCurrentAuthSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as {
        data?: T;
        error?: string;
      })
    : {
        error:
          (await response.text()) ||
          `Reaction request failed with status ${response.status}.`,
      };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Reaction request failed.");
  }

  return payload.data as T;
};

export const fetchReactionState = async (
  target: ReactionTarget
): Promise<ReactionState> => {
  const data = await fetchReactionApi<unknown>(buildReactionApiPath(target), {
    auth: "optional",
  });

  return parseReactionState(data);
};

export const setReaction = async (
  target: ReactionTarget,
  emoji: string
): Promise<ReactionState> => {
  const data = await fetchReactionApi<unknown>(REACTIONS_API_PATH, {
    method: "POST",
    auth: "required",
    body: JSON.stringify({
      ...target,
      emoji,
    }),
  });

  return parseReactionState(data);
};

export const removeReaction = async (
  target: ReactionTarget
): Promise<ReactionState> => {
  const data = await fetchReactionApi<unknown>(buildReactionApiPath(target), {
    method: "DELETE",
    auth: "required",
  });

  return parseReactionState(data);
};

export const createReactionTarget = (
  targetType: ReactionTargetType,
  targetId: string
): ReactionTarget => ({
  targetType,
  targetId,
});
