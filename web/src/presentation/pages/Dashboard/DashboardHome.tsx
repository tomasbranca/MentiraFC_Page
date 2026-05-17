import { Navigate } from "react-router-dom";

import { ROUTES } from "../../constants/routes.constants";

const DashboardHome = () => <Navigate to={ROUTES.DASHBOARD_NEWS} replace />;

export default DashboardHome;
