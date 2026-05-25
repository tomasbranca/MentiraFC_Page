import { lazy, Suspense, useState, type ComponentProps } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import { Link } from "react-router-dom";

import type { ReactionTarget } from "../../../types/reactions";
import { ROUTES } from "../../../shared/routing";
import { useAuth } from "../../context/useAuth";
import {
  useReactionState,
  useRemoveReaction,
  useSetReaction,
} from "../../hooks/queries/useReactionState";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

type EmojiPickerProps = ComponentProps<typeof EmojiPicker>;

type EmojiReactionBarProps = {
  target: ReactionTarget;
  source: string;
  className?: string;
};

const pickerProps = {
  theme: "dark" as EmojiPickerProps["theme"],
  emojiStyle: "native" as EmojiPickerProps["emojiStyle"],
  lazyLoadEmojis: true,
  searchPlaceholder: "Buscar emoji",
  previewConfig: {
    showPreview: false,
  },
  width: "100%",
  height: 340,
} satisfies Partial<EmojiPickerProps>;

const getTotalReactionCount = (
  counts: Array<{ count: number }> | undefined
) => counts?.reduce((total, item) => total + item.count, 0) ?? 0;

const EmojiReactionBar = ({
  target,
  source,
  className = "",
}: EmojiReactionBarProps) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const reactionQuery = useReactionState(target, source);
  const setReactionMutation = useSetReaction(target, source);
  const removeReactionMutation = useRemoveReaction(target, source);
  const reactionState = reactionQuery.data;
  const currentReaction = reactionState?.currentUserReaction ?? null;
  const visibleCounts = reactionState?.counts.slice(0, 8) ?? [];
  const totalReactions = getTotalReactionCount(reactionState?.counts);
  const isMutating =
    setReactionMutation.isPending || removeReactionMutation.isPending;
  const mutationError =
    setReactionMutation.isError || removeReactionMutation.isError;

  const handleReaction = async (emoji: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setShowLoginPrompt(false);

    if (currentReaction === emoji) {
      await removeReactionMutation.mutateAsync();
      return;
    }

    await setReactionMutation.mutateAsync(emoji);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setIsPickerOpen(false);
    void handleReaction(emojiData.emoji);
  };

  return (
    <div
      className={`relative text-neutral-200 ${className}`}
      aria-label="Reacciones"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {reactionQuery.isLoading && (
            <span className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-black/25 px-2.5 text-xs text-neutral-400">
              ...
            </span>
          )}

          {visibleCounts.map((item) => {
            const isActive = currentReaction === item.emoji;

            return (
              <button
                key={item.emoji}
                type="button"
                aria-pressed={isActive}
                aria-label={`${item.count} reacciones con ${item.emoji}`}
                disabled={isMutating || isAuthLoading}
                onClick={() => void handleReaction(item.emoji)}
                className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold leading-none transition backdrop-blur ${
                  isActive
                    ? "border-violet-300/80 bg-violet-700/55 text-white"
                    : "border-white/10 bg-black/25 text-violet-100/85 hover:border-violet-400/60 hover:bg-violet-950/70 hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="mr-1 text-sm" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.count}
              </button>
            );
          })}

          <button
            type="button"
            aria-label={currentReaction ? "Cambiar reaccion" : "Agregar reaccion"}
            disabled={isMutating || isAuthLoading}
            onClick={() => {
              if (!user) {
                setShowLoginPrompt(true);
                return;
              }

              setShowLoginPrompt(false);
              setIsPickerOpen((currentValue) => !currentValue);
            }}
            className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-black/20 px-2.5 text-xs font-semibold leading-none text-violet-100/75 backdrop-blur transition hover:border-violet-400/60 hover:bg-violet-950/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {currentReaction ? "＋" : totalReactions > 0 ? "＋" : "🙂"}
          </button>
        </div>
      </div>

      {!user && showLoginPrompt && (
        <p className="mt-2 text-xs text-violet-100/70">
          <Link to={ROUTES.LOGIN} className="font-semibold text-violet-300">
            Ingresa
          </Link>{" "}
          para dejar tu emoji.
        </p>
      )}

      {reactionQuery.isError && (
        <p className="mt-2 text-xs text-red-300">
          No pudimos cargar las reacciones.
        </p>
      )}

      {mutationError && (
        <p className="mt-2 text-xs text-red-300">
          No pudimos guardar tu reaccion. Proba nuevamente.
        </p>
      )}

      {isPickerOpen && user && (
        <div className="absolute left-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/40">
          <Suspense
            fallback={
              <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
                Cargando emojis...
              </div>
            }
          >
            <EmojiPicker {...pickerProps} onEmojiClick={handleEmojiClick} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default EmojiReactionBar;
