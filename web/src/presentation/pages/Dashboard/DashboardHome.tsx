import { Navigate } from "react-router-dom";

import { ROUTES } from "../../../shared/routing";

const DashboardHome = () => <Navigate to={ROUTES.DASHBOARD_NEWS} replace />;

export default DashboardHome;
