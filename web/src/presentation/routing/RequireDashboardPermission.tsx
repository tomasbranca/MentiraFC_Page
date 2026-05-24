import type { ReactNode } from "react";

import type {
  DashboardPermissionResource,
  DashboardResourcePermissionAction,
} from "../../domain/auth/permissions";
import { getDashboardResourcePermission } from "../../domain/auth/permissions";
import RequirePermission from "./RequirePermission";

type RequireDashboardPermissionProps<
  Resource extends DashboardPermissionResource,
> = {
  resource: Resource;
  action: DashboardResourcePermissionAction<Resource>;
  children: ReactNode;
};

function RequireDashboardPermission<
  Resource extends DashboardPermissionResource,
>({
  resource,
  action,
  children,
}: RequireDashboardPermissionProps<Resource>) {
  return (
    <RequirePermission
      permission={getDashboardResourcePermission(resource, action)}
    >
      {children}
    </RequirePermission>
  );
}

export default RequireDashboardPermission;
