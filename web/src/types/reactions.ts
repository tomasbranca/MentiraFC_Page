export type ReactionTargetType = "news" | "player" | "game";

export type ReactionTarget = {
  targetType: ReactionTargetType;
  targetId: string;
};

export type ReactionCount = {
  emoji: string;
  count: number;
};

export type ReactionState = ReactionTarget & {
  counts: ReactionCount[];
  currentUserReaction: string | null;
};
