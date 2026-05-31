import { useState } from "react";

import Button from "../Button/Button";

const MAX_LENGTH = 2000;

type NewsCommentComposerProps = {
  disabled?: boolean;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: (currentBody: string) => void | Promise<void>;
};

const NewsCommentComposer = ({
  disabled = false,
  initialValue = "",
  submitLabel = "Publicar",
  onSubmit,
  onCancel,
}: NewsCommentComposerProps) => {
  const [body, setBody] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedLength = body.trim().length;
  const canSubmit = trimmedLength > 0 && trimmedLength <= MAX_LENGTH && !disabled;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(body.trim());
      if (!onCancel) {
        setBody("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="min-w-0 flex-1 space-y-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={onCancel ? 4 : 2}
        maxLength={MAX_LENGTH}
        disabled={disabled || isSubmitting}
        placeholder="Escribi un comentario..."
        aria-label="Tu comentario"
        className="w-full resize-y bg-neutral-800/60 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:bg-neutral-800 focus:outline-none"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-neutral-500">
          {trimmedLength}/{MAX_LENGTH}
        </span>

        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void onCancel(body.trim())}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-400 transition hover:text-neutral-200 disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="px-4! py-1.5! text-xs!"
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default NewsCommentComposer;
