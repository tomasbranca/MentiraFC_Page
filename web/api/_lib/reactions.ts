import emojiRegex from "emoji-regex";

import { querySanity } from "./sanity.js";
import {
  createPublicSupabaseClient,
  createUserSupabaseClient,
} from "./supabase.js";

export const REACTION_TARGET_TYPES = ["news", "player", "game"] as const;

export type ReactionTargetType = (typeof REACTION_TARGET_TYPES)[number];

export type ReactionTarget = {
  targetType: ReactionTargetType;
  targetId: string;
};

export type ReactionState = ReactionTarget & {
  counts: Array<{
    emoji: string;
    count: number;
  }>;
  currentUserReaction: string | null;
};

type ReactionCountRow = {
  emoji?: unknown;
  reaction_count?: unknown;
};

type UserReactionRow = {
  emoji?: unknown;
};

const targetSanityTypes: Record<ReactionTargetType, string> = {
  news: "news",
  player: "players",
  game: "games",
};

const targetExistsQuery = `
  count(*[
    _type == $sanityType &&
    _id == $targetId &&
    !(_id in path("drafts.**"))
  ]) > 0
`;

export const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
};

export const isReactionTargetType = (
  input: unknown
): input is ReactionTargetType =>
  typeof input === "string" &&
  REACTION_TARGET_TYPES.includes(input as ReactionTargetType);

export const normalizeReactionTarget = ({
  targetType,
  targetId,
}: {
  targetType: unknown;
  targetId: unknown;
}): ReactionTarget | null => {
  if (!isReactionTargetType(targetType) || typeof targetId !== "string") {
    return null;
  }

  const normalizedTargetId = targetId.trim();

  if (!normalizedTargetId || normalizedTargetId.startsWith("drafts.")) {
    return null;
  }

  return {
    targetType,
    targetId: normalizedTargetId,
  };
};

export const normalizeEmoji = (input: unknown): string | null => {
  if (typeof input !== "string") {
    return null;
  }

  const emoji = input.trim();

  if (!emoji || emoji.length > 32 || new TextEncoder().encode(emoji).length > 128) {
    return null;
  }

  const regex = emojiRegex();
  const matches = [...emoji.matchAll(regex)];

  return matches.length === 1 && matches[0]?.[0] === emoji ? emoji : null;
};

export const ensureReactionTargetExists = async ({
  targetType,
  targetId,
}: ReactionTarget): Promise<boolean> => {
  const sanityType = targetSanityTypes[targetType];

  return querySanity<boolean>(targetExistsQuery, {
    params: {
      sanityType,
      targetId,
    },
    perspective: "published",
  });
};

const getUserIdFromToken = async (
  token: string | null,
  { required }: { required: boolean }
): Promise<string | null> => {
  if (!token) {
    if (required) {
      throw new Error("Missing auth token.");
    }

    return null;
  }

  const supabase = createUserSupabaseClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    if (required) {
      throw new Error("Invalid auth token.");
    }

    return null;
  }

  return user.id;
};

export const getReactionState = async (
  target: ReactionTarget,
  token: string | null
): Promise<ReactionState> => {
  const userId = await getUserIdFromToken(token, { required: false });
  const supabase =
    userId && token
      ? createUserSupabaseClient(token)
      : createPublicSupabaseClient();
  const { data: countRows, error: countsError } = await supabase
    .from("reaction_counts")
    .select("emoji, reaction_count")
    .eq("target_type", target.targetType)
    .eq("target_id", target.targetId)
    .order("reaction_count", { ascending: false })
    .order("emoji", { ascending: true });

  if (countsError) {
    throw countsError;
  }

  let currentUserReaction: string | null = null;

  if (userId) {
    const { data: reactionRow, error: reactionError } = await supabase
      .from("user_reactions")
      .select("emoji")
      .eq("user_id", userId)
      .eq("target_type", target.targetType)
      .eq("target_id", target.targetId)
      .maybeSingle();

    if (reactionError) {
      throw reactionError;
    }

    const reactionEmoji = (reactionRow as UserReactionRow | null)?.emoji;
    currentUserReaction = typeof reactionEmoji === "string" ? reactionEmoji : null;
  }

  return {
    ...target,
    counts: ((countRows ?? []) as ReactionCountRow[])
      .map((row) => ({
        emoji: typeof row.emoji === "string" ? row.emoji : "",
        count:
          typeof row.reaction_count === "number" ? row.reaction_count : 0,
      }))
      .filter((row) => row.emoji && row.count > 0),
    currentUserReaction,
  };
};

export const setReaction = async (
  target: ReactionTarget,
  emoji: string,
  token: string | null
): Promise<ReactionState> => {
  const userId = await getUserIdFromToken(token, { required: true });
  const supabase = createUserSupabaseClient(token ?? "");
  const { data: existingReaction, error: existingReactionError } = await supabase
    .from("user_reactions")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", target.targetType)
    .eq("target_id", target.targetId)
    .maybeSingle();

  if (existingReactionError) {
    throw existingReactionError;
  }

  if (existingReaction) {
    const { error } = await supabase
      .from("user_reactions")
      .update({ emoji })
      .eq("user_id", userId)
      .eq("target_type", target.targetType)
      .eq("target_id", target.targetId);

    if (error) {
      throw error;
    }

    return getReactionState(target, token);
  }

  const { error } = await supabase.from("user_reactions").insert({
    user_id: userId,
    target_type: target.targetType,
    target_id: target.targetId,
    emoji,
  });

  if (error) {
    throw error;
  }

  return getReactionState(target, token);
};

export const removeReaction = async (
  target: ReactionTarget,
  token: string | null
): Promise<ReactionState> => {
  const userId = await getUserIdFromToken(token, { required: true });
  const supabase = createUserSupabaseClient(token ?? "");
  const { error } = await supabase
    .from("user_reactions")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", target.targetType)
    .eq("target_id", target.targetId);

  if (error) {
    throw error;
  }

  return getReactionState(target, token);
};
