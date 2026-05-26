import { useState } from "react";

import type { CommentSort, NewsComment } from "../../../types/comments";
import { useAuth } from "../../context/useAuth";
import { formatCommentRelativeDate } from "../../utils/date.utils";
import {
  useDeleteNewsCommentMutation,
  useModeratorDeleteNewsCommentMutation,
  useReportNewsCommentMutation,
  useUpdateNewsCommentMutation,
} from "../../hooks/queries/useNewsComments";
import ProfileInitialsAvatar from "../ProfileInitialsAvatar/ProfileInitialsAvatar";
import {
  confirmDeleteComment,
  confirmDiscardCommentEdit,
  confirmModeratorDeleteComment,
  confirmSaveCommentEdit,
  runCommentMutationToast,
} from "./commentFeedback";
import CommentActionsMenu from "./CommentActionsMenu";
import CommentReportDialog from "./CommentReportDialog";
import NewsCommentComposer from "./NewsCommentComposer";

type NewsCommentItemProps = {
  comment: NewsComment;
  newsId: string;
  sort: CommentSort;
};

const getAuthorLabel = (comment: NewsComment): string => {
  const fullName = `${comment.author.firstName} ${comment.author.lastName}`.trim();
  return fullName || "Usuario";
};

const NewsCommentItem = ({ comment, newsId, sort }: NewsCommentItemProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const updateMutation = useUpdateNewsCommentMutation(newsId, sort);
  const deleteMutation = useDeleteNewsCommentMutation(newsId, sort);
  const moderatorDeleteMutation = useModeratorDeleteNewsCommentMutation();
  const reportMutation = useReportNewsCommentMutation(newsId, sort);

  const handleUpdate = async (body: string) => {
    const confirmed = await confirmSaveCommentEdit();

    if (!confirmed) {
      return;
    }

    try {
      await runCommentMutationToast(
        updateMutation.mutateAsync({ commentId: comment.id, body }),
        {
          loading: "Guardando comentario...",
          success: "Comentario actualizado.",
          error: "No pudimos actualizar el comentario.",
        }
      );
      setIsEditing(false);
    } catch {
      // toast.promise already surfaced the error
    }
  };

  const handleCancelEdit = async (currentBody: string) => {
    const hasChanges = currentBody !== comment.body.trim();

    if (hasChanges) {
      const confirmed = await confirmDiscardCommentEdit();

      if (!confirmed) {
        return;
      }
    }

    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = await confirmDeleteComment();

    if (!confirmed) {
      return;
    }

    try {
      await runCommentMutationToast(deleteMutation.mutateAsync(comment.id), {
        loading: "Eliminando comentario...",
        success: "Comentario eliminado.",
        error: "No pudimos eliminar el comentario.",
      });
    } catch {
      // toast.promise already surfaced the error
    }
  };

  const handleModeratorDelete = async () => {
    const confirmed = await confirmModeratorDeleteComment();

    if (!confirmed) {
      return;
    }

    try {
      await runCommentMutationToast(
        moderatorDeleteMutation.mutateAsync(comment.id),
        {
          loading: "Eliminando comentario...",
          success: "Comentario eliminado por moderacion.",
          error: "No pudimos eliminar el comentario.",
        }
      );
    } catch {
      // toast.promise already surfaced the error
    }
  };

  const handleReport = async (
    input: Parameters<typeof reportMutation.mutateAsync>[0]["input"]
  ) => {
    try {
      await runCommentMutationToast(
        reportMutation.mutateAsync({ commentId: comment.id, input }),
        {
          loading: "Enviando reporte...",
          success: "Reporte enviado.",
          error: "No pudimos enviar el reporte.",
        }
      );
      setIsReportOpen(false);
    } catch {
      // toast.promise already surfaced the error
    }
  };

  const menuItems = [
    ...(comment.canEdit && !isEditing
      ? [
          {
            id: "edit",
            label: "Editar",
            onSelect: () => setIsEditing(true),
          },
        ]
      : []),
    ...(comment.canDelete
      ? [
          {
            id: "delete",
            label: "Borrar",
            onSelect: () => void handleDelete(),
            tone: "danger" as const,
          },
        ]
      : []),
    ...(comment.canModerateDelete
      ? [
          {
            id: "moderate-delete",
            label: "Eliminar (moderacion)",
            onSelect: () => void handleModeratorDelete(),
            tone: "danger" as const,
          },
        ]
      : []),
    ...(user && !comment.canEdit && !comment.hasReported
      ? [
          {
            id: "report",
            label: "Reportar",
            onSelect: () => setIsReportOpen(true),
          },
        ]
      : []),
  ];

  const relativeDate = formatCommentRelativeDate(comment.createdAt);
  const editedLabel = comment.editedAt ? " (editado)" : "";

  return (
    <article className="flex gap-3 py-3">
      <ProfileInitialsAvatar
        firstName={comment.author.firstName}
        lastName={comment.author.lastName}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-200">
            {getAuthorLabel(comment)}
          </p>
          <span className="shrink-0 text-xs text-neutral-500">
            {relativeDate}
            {editedLabel}
          </span>
          {comment.hasReported ? (
            <span className="shrink-0 text-xs text-neutral-500">Reportado</span>
          ) : (
            <CommentActionsMenu items={menuItems} />
          )}
        </div>

        {isEditing ? (
          <div className="mt-3">
            <NewsCommentComposer
              initialValue={comment.body}
              submitLabel="Guardar cambios"
              disabled={updateMutation.isPending}
              onCancel={handleCancelEdit}
              onSubmit={handleUpdate}
            />
          </div>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
            {comment.body}
          </p>
        )}
      </div>

      {isReportOpen ? (
        <CommentReportDialog
          disabled={reportMutation.isPending}
          onClose={() => setIsReportOpen(false)}
          onSubmit={handleReport}
        />
      ) : null}
    </article>
  );
};

export default NewsCommentItem;
