import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CommentSort, NewsComment } from "../../../types/comments";
import { ROUTES } from "../../../shared/routing";
import { useAuth } from "../../context/useAuth";
import {
  useCreateNewsCommentMutation,
  useNewsComments,
} from "../../hooks/queries/useNewsComments";
import Button from "../Button/Button";
import ProfileInitialsAvatar from "../ProfileInitialsAvatar/ProfileInitialsAvatar";
import { runCommentMutationToast } from "./commentFeedback";
import NewsCommentComposer from "./NewsCommentComposer";
import NewsCommentItem from "./NewsCommentItem";

type NewsCommentsSectionProps = {
  newsId: string;
};

const SORT_OPTIONS: Array<{ value: CommentSort; label: string }> = [
  { value: "newest", label: "Mas recientes" },
  { value: "oldest", label: "Mas antiguos" },
];

const NewsCommentsSection = ({ newsId }: NewsCommentsSectionProps) => {
  const { user, account } = useAuth();
  const [sort, setSort] = useState<CommentSort>("newest");
  const commentsQuery = useNewsComments(newsId, sort);
  const createMutation = useCreateNewsCommentMutation(newsId, sort);

  const comments = useMemo(
    () =>
      commentsQuery.data?.pages.flatMap((page) => page.items) ?? ([] as NewsComment[]),
    [commentsQuery.data]
  );

  const handleCreate = async (body: string) => {
    try {
      await runCommentMutationToast(
        createMutation.mutateAsync({ newsId, body }),
        {
          loading: "Publicando comentario...",
          success: "Comentario publicado.",
          error: "No pudimos publicar el comentario.",
        }
      );
    } catch {
      // toast.promise already surfaced the error
    }
  };

  return (
    <section className="pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-wide text-neutral-200 md:text-2xl">
            Comentarios
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Deja tu opinion sobre esta noticia.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-neutral-500">
          Orden
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as CommentSort)
            }
            className="bg-neutral-800/60 px-3 py-2 text-sm normal-case text-neutral-300 focus:bg-neutral-800 focus:outline-none"
            aria-label="Orden de comentarios"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        {user && account ? (
          <div className="flex gap-3">
            <ProfileInitialsAvatar
              firstName={account.firstName}
              lastName={account.lastName}
            />
            <NewsCommentComposer
              disabled={createMutation.isPending}
              onSubmit={handleCreate}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-neutral-300 underline-offset-2 hover:text-white hover:underline"
            >
              Inicia sesion
            </Link>{" "}
            para comentar esta noticia.
          </p>
        )}
      </div>

      <div className="mt-4 divide-y divide-neutral-800/80">
        {commentsQuery.isLoading ? (
          <p className="py-6 text-sm text-neutral-500 animate-pulse">
            Cargando comentarios...
          </p>
        ) : null}

        {commentsQuery.isError ? (
          <div className="py-6 text-sm text-neutral-400">
            <p>No pudimos cargar los comentarios.</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void commentsQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {!commentsQuery.isLoading &&
        !commentsQuery.isError &&
        comments.length === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            Todavia no hay comentarios. Se el primero en escribir.
          </p>
        ) : null}

        {comments.map((comment) => (
          <NewsCommentItem
            key={comment.id}
            comment={comment}
            newsId={newsId}
            sort={sort}
          />
        ))}
      </div>

      {commentsQuery.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={commentsQuery.isFetchingNextPage}
            onClick={() => void commentsQuery.fetchNextPage()}
            className="px-4 py-2 text-sm font-semibold text-neutral-400 transition hover:text-neutral-200 disabled:opacity-50"
          >
            {commentsQuery.isFetchingNextPage
              ? "Cargando..."
              : "Cargar mas comentarios"}
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default NewsCommentsSection;
