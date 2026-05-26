import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createNewsComment,
  deleteNewsComment,
  deleteNewsCommentAsModerator,
  fetchNewsCommentsPage,
  reportNewsComment,
  updateNewsComment,
} from "../../../data/comments";
import { queryKeys } from "../../../data/queryKeys";
import type {
  CommentSort,
  CreateCommentReportInput,
  CreateNewsCommentInput,
} from "../../../types/comments";

export const useNewsComments = (newsId: string, sort: CommentSort = "newest") =>
  useInfiniteQuery({
    queryKey: queryKeys.comments.byNews(newsId, sort),
    queryFn: ({ pageParam }) =>
      fetchNewsCommentsPage({
        newsId,
        sort,
        cursor: typeof pageParam === "string" ? pageParam : null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(newsId),
  });

export const useCreateNewsCommentMutation = (newsId: string, sort: CommentSort) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNewsCommentInput) => createNewsComment(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byNews(newsId, sort),
      });
    },
  });
};

export const useUpdateNewsCommentMutation = (newsId: string, sort: CommentSort) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      body,
    }: {
      commentId: string;
      body: string;
    }) => updateNewsComment(commentId, { body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byNews(newsId, sort),
      });
    },
  });
};

export const useDeleteNewsCommentMutation = (newsId: string, sort: CommentSort) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteNewsComment(commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byNews(newsId, sort),
      });
    },
  });
};

export const useModeratorDeleteNewsCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteNewsCommentAsModerator(commentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.comments.moderation,
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === "comments" &&
            query.queryKey[1] === "byNews",
        }),
      ]);
    },
  });
};

export const useReportNewsCommentMutation = (newsId: string, sort: CommentSort) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      input,
    }: {
      commentId: string;
      input: CreateCommentReportInput;
    }) => reportNewsComment(commentId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byNews(newsId, sort),
      });
    },
  });
};
