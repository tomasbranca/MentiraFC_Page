import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiCheck,
  FiMessageSquare,
  FiTrash2,
} from "react-icons/fi";

import {
  fetchCommentModerationPage,
  getCommentReportReasonLabel,
  updateCommentReportStatus,
} from "../../../data/comments";
import { queryKeys } from "../../../data/queryKeys";
import type { CommentModerationItem } from "../../../types/comments";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import { useModeratorDeleteNewsCommentMutation } from "../../hooks/queries/useNewsComments";
import { formatDateTime } from "../../utils/date.utils";
import {
  getReportCountLabel,
  getVisibleOpenReportIds,
} from "./adminCommentReports.utils";

const getAuthorName = (item: CommentModerationItem): string => {
  const authorName = `${item.comment.author.firstName} ${item.comment.author.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  return authorName || "Usuario";
};

const AdminCommentReports = () => {
  const queryClient = useQueryClient();
  const [actioningCommentId, setActioningCommentId] = useState<string | null>(
    null
  );
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
  const totalVisibleReports = items.reduce(
    (total, item) => total + item.openReportCount,
    0
  );

  const handleDismiss = async (reportId: string) => {
    try {
      await reviewMutation.mutateAsync({ reportId, status: "dismissed" });
      toast.success("Reporte descartado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar el reporte."
      );
    }
  };

  const handleAction = async (item: CommentModerationItem) => {
    const reportIds = getVisibleOpenReportIds(item);

    setActioningCommentId(item.comment.id);

    try {
      await moderatorDeleteMutation.mutateAsync(item.comment.id);
      await Promise.all(
        reportIds.map((reportId) =>
          updateCommentReportStatus(reportId, "actioned")
        )
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.comments.moderation,
      });
      toast.success("Comentario eliminado y reportes cerrados.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos moderar el comentario."
      );
    } finally {
      setActioningCommentId(null);
    }
  };

  if (moderationQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (moderationQuery.isError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorFallback
          title="No pudimos cargar los reportes"
          message="Intenta nuevamente en unos minutos."
          onRetry={() => void moderationQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="rounded-md border border-[#ded7ef] bg-white p-4 sm:p-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">
            Moderacion
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2.5">
            <h1 className="text-3xl font-black uppercase leading-none text-[#17151d]">
              Reportes de comentarios
            </h1>
            <span className="rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              {getReportCountLabel(totalVisibleReports)}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Cola de reportes abiertos enviados por usuarios del sitio.
          </p>
        </div>

        <div className="rounded-md border border-violet-200 bg-[#17151d] p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-sm bg-violet-100 text-violet-950">
              <FiMessageSquare className="size-5" aria-hidden="true" />
            </span>
            <span className="text-3xl font-black leading-none">
              {items.length}
            </span>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">
            Comentarios en cola
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-md border border-[#ded7ef] bg-white p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            <FiCheck className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-black uppercase text-[#17151d]">
            No hay reportes abiertos
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            La cola de moderacion esta al dia.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const isActioning = actioningCommentId === item.comment.id;
            const reportIds = getVisibleOpenReportIds(item);
            const isBusy =
              isActioning ||
              moderatorDeleteMutation.isPending ||
              reviewMutation.isPending;

            return (
              <article
                key={item.comment.id}
                className="overflow-hidden rounded-md border border-[#ded7ef] bg-white"
              >
                <div className="grid gap-4 border-b border-[#e7e1f2] bg-[#fbfaff] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                        <FiAlertTriangle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        {getReportCountLabel(item.openReportCount)}
                      </span>
                      <span className="text-xs font-medium text-neutral-500">
                        Noticia {item.comment.newsId}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                      {item.comment.body}
                    </p>

                    <p className="mt-3 text-xs text-neutral-500">
                      Autor: {getAuthorName(item)}
                    </p>
                  </div>

                  <Button
                    className="rounded-sm! border-red-200! bg-red-50! px-3! py-2! text-xs! font-bold! text-red-800! hover:border-red-300! hover:bg-red-100!"
                    disabled={isBusy || reportIds.length === 0}
                    onClick={() => void handleAction(item)}
                  >
                    <FiTrash2 className="size-4" aria-hidden="true" />
                    {isActioning ? "Eliminando" : "Eliminar comentario"}
                  </Button>
                </div>

                <ul className="divide-y divide-[#ede8f5]">
                  {item.reports.map((report) => (
                    <li
                      key={report.id}
                      className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#17151d]">
                          {getCommentReportReasonLabel(report.reason)}
                        </p>
                        {report.details ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">
                            {report.details}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatDateTime(report.createdAt)}
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        className="rounded-sm! border-neutral-300! px-3! py-2! text-xs! font-bold! text-neutral-700! hover:border-violet-300! hover:bg-violet-50!"
                        disabled={isBusy || report.status !== "open"}
                        onClick={() => void handleDismiss(report.id)}
                      >
                        Descartar
                      </Button>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {moderationQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            className="rounded-sm! border-violet-200! bg-white! text-violet-900! hover:bg-violet-50!"
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

export default AdminCommentReports;
