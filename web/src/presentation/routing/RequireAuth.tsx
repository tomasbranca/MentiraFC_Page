import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import Loader from "../components/Loader/Loader";
import ErrorFallback from "../components/errors/ErrorFallback";
import { ROUTES } from "../../shared/routing";
import { useAuth } from "../context/useAuth";

type RequireAuthProps = {
  children: ReactNode;
  requireAccount?: boolean;
};

const RequireAuth = ({
  children,
  requireAccount = true,
}: RequireAuthProps) => {
  const location = useLocation();
  const {
    user,
    account,
    isLoading,
    isAccountLoading,
    accountError,
    refreshAccount,
  } = useAuth();

  if (isLoading || (requireAccount && isAccountLoading)) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (requireAccount && accountError) {
    return (
      <ErrorFallback
        title="No pudimos cargar tu cuenta"
        message={accountError}
        onRetry={refreshAccount}
      />
    );
  }

  if (requireAccount && !account) {
    return (
      <ErrorFallback
        title="No encontramos tu cuenta"
        message="Intentá nuevamente en unos minutos."
        onRetry={refreshAccount}
      />
    );
  }

  return children;
};

export default RequireAuth;
