import { Link } from "react-router-dom";
import { FiSave, FiX } from "react-icons/fi";

type DashboardFormActionsProps = {
  isSaving: boolean;
  isDraftSaving: boolean;
  isPublishing: boolean;
  onSaveDraft: () => void | Promise<void>;
  submitLabel: string;
  publishLoadingLabel?: string;
  draftLabel?: string;
  draftLoadingLabel?: string;
  cancelTo?: string;
  error?: string | null;
};

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35 hover:bg-white/4.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-violet-200/25 bg-violet-100 px-5 py-3 text-sm font-semibold text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-55";

const DashboardFormActions = ({
  isSaving,
  isDraftSaving,
  isPublishing,
  onSaveDraft,
  submitLabel,
  publishLoadingLabel = "Publicando...",
  draftLabel = "Guardar borrador",
  draftLoadingLabel = "Guardando...",
  cancelTo,
  error,
}: DashboardFormActionsProps) => (
  <>
    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
      {cancelTo ? (
        <Link to={cancelTo} className={secondaryButtonClassName}>
          <FiX className="size-4" aria-hidden="true" />
          Cancelar
        </Link>
      ) : null}
      <button
        type="button"
        disabled={isSaving}
        className={secondaryButtonClassName}
        onClick={() => void onSaveDraft()}
      >
        <FiSave className="size-4" aria-hidden="true" />
        {isDraftSaving ? draftLoadingLabel : draftLabel}
      </button>
      <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
        <FiSave className="size-4" aria-hidden="true" />
        {isPublishing ? publishLoadingLabel : submitLabel}
      </button>
    </div>

    <div
      className="min-h-6 text-sm text-red-300"
      aria-live="polite"
      role={error ? "alert" : undefined}
    >
      {error}
    </div>
  </>
);

export default DashboardFormActions;
