import type { AppPermission } from "../../domain/auth/permissions";
import { hasPermission } from "../../domain/auth/permissions";
import { useAuth } from "../context/useAuth";

export const usePermission = (permission: AppPermission): boolean => {
  const { account } = useAuth();

  return hasPermission(account?.role, permission);
};
