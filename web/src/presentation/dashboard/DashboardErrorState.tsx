import ErrorFallback from "../components/errors/ErrorFallback";

type DashboardErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

const DashboardErrorState = ({
  title = "No se pudo cargar la pagina",
  message = "Reintenta en unos segundos.",
  onRetry,
}: DashboardErrorStateProps) => (
  <ErrorFallback title={title} message={message} onRetry={onRetry} />
);

export default DashboardErrorState;
