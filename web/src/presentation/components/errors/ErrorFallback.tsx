// @ts-nocheck
import { FiAlertTriangle } from "react-icons/fi";

const ErrorFallback = ({
  title = "Ocurrió un error inesperado",
  message = "Intentá nuevamente en unos minutos.",
  onRetry,
  retryLabel = "Reintentar",
}) => {
  return (
    <main className="h-[80vh] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-xl rounded-xl border border-red-500/40 bg-red-950/40 p-6 text-center shadow-lg shadow-black/30">
        <div className="text-4xl mb-3 flex justify-center" aria-hidden="true">
          <FiAlertTriangle />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-2">{title}</h2>
        <p className="text-red-100/90">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-white/95 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-white transition-colors"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </main>
  );
};

export default ErrorFallback;
