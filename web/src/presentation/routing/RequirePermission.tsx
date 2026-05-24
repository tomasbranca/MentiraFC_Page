import type { ReactNode } from "react";

import type { AppPermission } from "../../domain/auth/permissions";
import { hasPermission } from "../../domain/auth/permissions";
import ErrorFallback from "../components/errors/ErrorFallback";
import { useAuth } from "../context/useAuth";
import RequireAuth from "./RequireAuth";

type RequirePermissionProps = {
  permission: AppPermission;
  children: ReactNode;
};

const RequirePermission = ({
  permission,
  children,
}: RequirePermissionProps) => {
  const { account } = useAuth();

  return (
    <RequireAuth>
      {hasPermission(account?.role, permission) ? (
        children
      ) : (
        <ErrorFallback
          title="No tenés permisos para acceder a esta sección"
          message={`Tu cuenta no tiene el permiso requerido: ${permission}.`}
        />
      )}
    </RequireAuth>
  );
};

export default RequirePermission;
