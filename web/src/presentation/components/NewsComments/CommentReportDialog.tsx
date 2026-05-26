import { useState } from "react";

import {
  COMMENT_REPORT_REASONS,
  type CommentReportReason,
  type CreateCommentReportInput,
} from "../../../types/comments";
import { getCommentReportReasonLabel } from "../../../data/comments";
import Button from "../Button/Button";

type CommentReportDialogProps = {
  disabled?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCommentReportInput) => Promise<void>;
};

const CommentReportDialog = ({
  disabled = false,
  onClose,
  onSubmit,
}: CommentReportDialogProps) => {
  const [reason, setReason] = useState<CommentReportReason>("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        reason,
        details: details.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-report-title"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-md bg-neutral-900 p-5 shadow-2xl"
      >
        <h3
          id="comment-report-title"
          className="text-lg font-bold uppercase tracking-wide text-white"
        >
          Reportar comentario
        </h3>
        <p className="mt-2 text-sm text-neutral-400">
          Contanos por que consideras que este comentario deberia revisarse.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-xs uppercase tracking-wide text-neutral-500">
            Motivo
          </legend>
          {COMMENT_REPORT_REASONS.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 bg-neutral-800/60 px-3 py-2 text-sm text-neutral-200"
            >
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => setReason(option)}
              />
              {getCommentReportReasonLabel(option)}
            </label>
          ))}
        </fieldset>

        <label className="mt-4 block text-xs uppercase tracking-wide text-neutral-500">
          Detalle opcional
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full bg-neutral-800/60 px-3 py-2 text-sm normal-case text-neutral-100 focus:bg-neutral-800 focus:outline-none"
            placeholder="Agrega contexto si hace falta"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || disabled}>
            {isSubmitting ? "Enviando..." : "Enviar reporte"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentReportDialog;
