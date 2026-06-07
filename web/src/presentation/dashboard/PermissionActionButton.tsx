import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router-dom";

import type {
  DashboardPermissionResource,
  DashboardResourcePermissionAction,
} from "../../domain/auth/permissions";
import { useDashboardPermission } from "../hooks/usePermission";

type PermissionActionButtonProps<
  Resource extends DashboardPermissionResource,
> = {
  resource: Resource;
  action: DashboardResourcePermissionAction<Resource>;
  children: ReactNode;
  className: string;
  to?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  hideWhenDenied?: boolean;
  title?: string;
  ariaLabel?: string;
  deniedTitle?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

function PermissionActionButton<Resource extends DashboardPermissionResource>({
  resource,
  action,
  children,
  className,
  to,
  type = "button",
  disabled = false,
  hideWhenDenied = true,
  title,
  ariaLabel,
  deniedTitle = "No tenes permisos para realizar esta accion.",
  onClick,
}: PermissionActionButtonProps<Resource>) {
  const isAllowed = useDashboardPermission(resource, action);

  if (!isAllowed && hideWhenDenied) {
    return null;
  }

  const resolvedTitle = isAllowed ? title : deniedTitle;
  const resolvedAriaLabel = ariaLabel ?? resolvedTitle;
  const isDisabled = disabled || !isAllowed;

  if (to && isAllowed && !disabled) {
    return (
      <Link
        to={to}
        className={className}
        aria-label={resolvedAriaLabel}
        title={resolvedTitle}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={className}
      disabled={isDisabled}
      aria-label={resolvedAriaLabel}
      title={resolvedTitle}
      onClick={isAllowed ? onClick : undefined}
    >
      {children}
    </button>
  );
}

export default PermissionActionButton;
