import type { ReactNode } from "react";

type DashboardEmptyStateProps = {
  title?: string;
  message: ReactNode;
  action?: ReactNode;
  className?: string;
};

const DashboardEmptyState = ({
  title,
  message,
  action,
  className = "",
}: DashboardEmptyStateProps) => (
  <div className={`p-6 text-sm text-violet-100/75 ${className}`.trim()}>
    {title ? <p className="font-semibold text-violet-50">{title}</p> : null}
    <p className={title ? "mt-1" : undefined}>{message}</p>
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);

export default DashboardEmptyState;
