import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchReactionState,
  removeReaction,
  setReaction,
} from "../../../data/reactions";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { ReactionTarget } from "../../../types/reactions";

export const useReactionState = (
  target: ReactionTarget | null,
  source: string
) =>
  useQuery({
    queryKey: target
      ? queryKeys.reactions.byTarget(target.targetType, target.targetId)
      : queryKeys.reactions.byTarget("unknown", "unknown"),
    enabled: Boolean(target),
    queryFn: async () => {
      if (!target) {
        throw new Error("Missing reaction target.");
      }

      try {
        return await fetchReactionState(target);
      } catch (error) {
        reportError(error, {
          source,
          action: "load_reaction_state",
          targetType: target.targetType,
          targetId: target.targetId,
        });
        throw error;
      }
    },
  });

export const useSetReaction = (target: ReactionTarget, source: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emoji: string) => setReaction(target, emoji),
    onSuccess: (reactionState) => {
      queryClient.setQueryData(
        queryKeys.reactions.byTarget(target.targetType, target.targetId),
        reactionState
      );
    },
    onError: (error) => {
      reportError(error, {
        source,
        action: "set_reaction",
        targetType: target.targetType,
        targetId: target.targetId,
      });
    },
  });
};

export const useRemoveReaction = (target: ReactionTarget, source: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => removeReaction(target),
    onSuccess: (reactionState) => {
      queryClient.setQueryData(
        queryKeys.reactions.byTarget(target.targetType, target.targetId),
        reactionState
      );
    },
    onError: (error) => {
      reportError(error, {
        source,
        action: "remove_reaction",
        targetType: target.targetType,
        targetId: target.targetId,
      });
    },
  });
};
