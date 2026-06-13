import { adminRoutes } from "./adminRoutes";
import { authRoutes } from "./authRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { detailRoutes } from "./detailRoutes";
import { publicRoutes } from "./publicRoutes";

export const appRouteElements = (
  <>
    {publicRoutes}
    {authRoutes}
    {adminRoutes}
    {dashboardRoutes}
    {detailRoutes}
  </>
);
