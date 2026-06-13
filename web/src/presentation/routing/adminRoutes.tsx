import { Route } from "react-router-dom";

import { PERMISSIONS } from "../../domain/auth/permissions";
import { lazyWithReload } from "../../lib/lazyWithReload";
import { ROUTES } from "../../shared/routing";
import RequirePermission from "./RequirePermission";

const AdminLayout = lazyWithReload(() => import("../layout/AdminLayout/AdminLayout"));
const AdminHome = lazyWithReload(() => import("../pages/Admin/AdminHome"));
const AdminCommentReports = lazyWithReload(
  () => import("../pages/AdminCommentReports/AdminCommentReports")
);
const AdminUsers = lazyWithReload(() => import("../pages/Admin/AdminUsers"));
const AdminRoles = lazyWithReload(() => import("../pages/Admin/AdminRoles"));
const AdminFooterSettings = lazyWithReload(
  () => import("../pages/Admin/AdminFooterSettings")
);
const AdminAuditLog = lazyWithReload(() => import("../pages/Admin/AdminAuditLog"));
const AdminMetrics = lazyWithReload(() => import("../pages/Admin/AdminMetrics"));
const AdminAuthControls = lazyWithReload(
  () => import("../pages/Admin/AdminAuthControls")
);
const AdminFeatureFlags = lazyWithReload(
  () => import("../pages/Admin/AdminFeatureFlags")
);
const AdminMaintenance = lazyWithReload(
  () => import("../pages/Admin/AdminMaintenance")
);

export const adminRoutes = (
  <Route
    path={ROUTES.ADMIN}
    element={
      <RequirePermission permission={PERMISSIONS.viewAdminPanel}>
        <AdminLayout />
      </RequirePermission>
    }
  >
    <Route index element={<AdminHome />} />
    <Route path="reportes-comentarios" element={<AdminCommentReports />} />
    <Route path="usuarios" element={<AdminUsers />} />
    <Route path="roles-permisos" element={<AdminRoles />} />
    <Route path="footer-sponsors" element={<AdminFooterSettings />} />
    <Route path="audit-log" element={<AdminAuditLog />} />
    <Route path="metricas" element={<AdminMetrics />} />
    <Route path="auth" element={<AdminAuthControls />} />
    <Route path="feature-flags" element={<AdminFeatureFlags />} />
    <Route path="mantenimiento" element={<AdminMaintenance />} />
  </Route>
);
