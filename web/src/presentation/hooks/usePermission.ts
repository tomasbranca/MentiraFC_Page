import { useMemo } from "react";

import type {
  AppPermission,
  DashboardPermissionResource,
  DashboardResourcePermissionAction,
  PermissionChecker,
} from "../../domain/auth/permissions";
import {
  createPermissionChecker,
  hasDashboardResourcePermission,
  hasPermission,
} from "../../domain/auth/permissions";
import { useAuth } from "../context/useAuth";

export const usePermission = (permission: AppPermission): boolean => {
  const { account } = useAuth();

  return hasPermission(account?.role, permission);
};

export const useDashboardPermission = <
  Resource extends DashboardPermissionResource,
  Action extends DashboardResourcePermissionAction<Resource>,
>(
  resource: Resource,
  action: Action
): boolean => {
  const { account } = useAuth();

  return hasDashboardResourcePermission(account?.role, resource, action);
};

export const usePermissionChecker = (): PermissionChecker => {
  const { account } = useAuth();

  return useMemo(
    () => createPermissionChecker(account?.role),
    [account?.role]
  );
};
