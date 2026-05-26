import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  fetchCommentModerationPage,
  getCommentReportReasonLabel,
  updateCommentReportStatus,
} from "../../../data/comments";
import { queryKeys } from "../../../data/queryKeys";
import {
  useModeratorDeleteNewsCommentMutation,
} from "../../hooks/queries/useNewsComments";
import Button from "../../components/Button/Button";

const DashboardCommentsModeration = () => {
  const queryClient = useQueryClient();
  const moderationQuery = useInfiniteQuery({
    queryKey: queryKeys.comments.moderation,
    queryFn: ({ pageParam }) =>
      fetchCommentModerationPage({
        cursor: typeof pageParam === "string" ? pageParam : null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const moderatorDeleteMutation = useModeratorDeleteNewsCommentMutation();
  const reviewMutation = useMutation({
    mutationFn: ({
      reportId,
      status,
    }: {
      reportId: string;
      status: "dismissed" | "actioned";
    }) => updateCommentReportStatus(reportId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.moderation,
      });
    },
  });

  const items = useMemo(
    () => moderationQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [moderationQuery.data]
  );

  const handleDismiss = async (reportId: string) => {
    try {
      await reviewMutation.mutateAsync({ reportId, status: "dismissed" });
      toast.success("Reporte descartado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos actualizar el reporte."
      );
    }
  };

  const handleAction = async (commentId: string, reportId: string) => {
    try {
      await moderatorDeleteMutation.mutateAsync(commentId);
      await reviewMutation.mutateAsync({ reportId, status: "actioned" });
      toast.success("Comentario moderado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No pudimos moderar el comentario."
      );
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
          Moderacion de comentarios
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Revisa reportes abiertos y actua sobre comentarios de noticias.
        </p>
      </header>

      {moderationQuery.isLoading ? (
        <p className="text-sm text-neutral-400 animate-pulse">Cargando cola...</p>
      ) : null}

      {moderationQuery.isError ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          No pudimos cargar la cola de moderacion.
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void moderationQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {!moderationQuery.isLoading &&
      !moderationQuery.isError &&
      items.length === 0 ? (
        <p className="text-sm text-neutral-400">No hay reportes abiertos.</p>
      ) : null}

      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.comment.id}
            className="rounded-lg border border-violet-900/80 bg-neutral-950/80 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-violet-300">
              {item.openReportCount} reporte(s) abierto(s)
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-200">
              {item.comment.body}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Noticia: {item.comment.newsId}
            </p>

            <ul className="mt-4 space-y-2">
              {item.reports.map((report) => (
                <li
                  key={report.id}
                  className="rounded-md border border-violet-950 px-3 py-2 text-sm text-neutral-300"
                >
                  <p>
                    {getCommentReportReasonLabel(report.reason)}
                    {report.details ? ` — ${report.details}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="!px-3 !py-1 text-xs"
                      disabled={reviewMutation.isPending}
                      onClick={() => void handleDismiss(report.id)}
                    >
                      Descartar
                    </Button>
                    <Button
                      className="!px-3 !py-1 text-xs"
                      disabled={
                        moderatorDeleteMutation.isPending ||
                        reviewMutation.isPending
                      }
                      onClick={() =>
                        void handleAction(item.comment.id, report.id)
                      }
                    >
                      Eliminar comentario
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {moderationQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={moderationQuery.isFetchingNextPage}
            onClick={() => void moderationQuery.fetchNextPage()}
          >
            {moderationQuery.isFetchingNextPage
              ? "Cargando..."
              : "Cargar mas reportes"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardCommentsModeration;
