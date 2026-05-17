import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import Loader from "../components/Loader/Loader";
import ErrorFallback from "../components/errors/ErrorFallback";
import { ROUTES } from "../constants/routes.constants";
import { useAuth } from "../context/useAuth";

type RequireAuthProps = {
  children: ReactNode;
};

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const {
    user,
    account,
    isLoading,
    isAccountLoading,
    accountError,
    refreshAccount,
  } = useAuth();

  if (isLoading || isAccountLoading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (accountError) {
    return (
      <ErrorFallback
        title="No pudimos cargar tu cuenta"
        message={accountError}
        onRetry={refreshAccount}
      />
    );
  }

  if (!account) {
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
