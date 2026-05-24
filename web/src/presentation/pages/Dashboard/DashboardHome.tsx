import { Navigate } from "react-router-dom";

import ErrorFallback from "../../components/errors/ErrorFallback";
import { useAuth } from "../../context/useAuth";
import { getFirstAllowedDashboardRoute } from "../../dashboard/dashboardSections";

const DashboardHome = () => {
  const { account } = useAuth();
  const firstAllowedRoute = getFirstAllowedDashboardRoute(account?.role);

  if (!firstAllowedRoute) {
    return (
      <ErrorFallback
        title="No tenes permisos para ver secciones del dashboard"
        message="Tu cuenta puede entrar al dashboard, pero no tiene una seccion habilitada."
      />
    );
  }

  return <Navigate to={firstAllowedRoute} replace />;
};

export default DashboardHome;
