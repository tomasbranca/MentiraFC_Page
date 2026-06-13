import { Route } from "react-router-dom";

import { lazyWithReload } from "../../lib/lazyWithReload";
import { ROUTES } from "../../shared/routing";
import RequireAuth from "./RequireAuth";

const Login = lazyWithReload(() => import("../pages/Login/Login"));
const PasswordResetRequest = lazyWithReload(() =>
  import("../pages/Login/Login").then(({ default: LoginPage }) => ({
    default: () => <LoginPage initialMode="resetPassword" />,
  }))
);
const PasswordResetUpdate = lazyWithReload(() =>
  import("../pages/Login/Login").then(({ default: LoginPage }) => ({
    default: () => <LoginPage initialMode="updatePassword" />,
  }))
);
const Account = lazyWithReload(() => import("../pages/Account/Account"));

export const authRoutes = (
  <>
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route
      path={ROUTES.PASSWORD_RESET_REQUEST}
      element={<PasswordResetRequest />}
    />
    <Route
      path={ROUTES.PASSWORD_RESET_UPDATE}
      element={<PasswordResetUpdate />}
    />
    <Route
      path={ROUTES.ACCOUNT}
      element={
        <RequireAuth requireAccount={false}>
          <Account />
        </RequireAuth>
      }
    />
  </>
);
