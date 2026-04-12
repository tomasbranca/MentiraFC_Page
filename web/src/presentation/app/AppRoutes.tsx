import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

import Loader from "../components/Loader/Loader";
import { ROUTES } from "../constants/routes.constants";
import Home from "../pages/Home/Home";

import AppLayout from "./AppLayout";

const News = lazy(() => import("../pages/News/News"));
const Team = lazy(() => import("../pages/Team/Team"));
const Table = lazy(() => import("../pages/Table/Table"));
const Record = lazy(() => import("../pages/Record/Record"));
const Admin = lazy(() => import("../pages/Admin/Admin"));
const NewsDetail = lazy(() => import("../pages/NewsDetail/NewsDetail"));
const PlayerDetail = lazy(() => import("../pages/PlayerDetail/PlayerDetail"));

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={<Loader />}>
    {component}
  </Suspense>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.NEWS} element={withSuspense(<News />)} />
        <Route path={ROUTES.TEAM} element={withSuspense(<Team />)} />
        <Route path={ROUTES.TABLE} element={withSuspense(<Table />)} />
        <Route path={ROUTES.RECORD} element={withSuspense(<Record />)} />
        <Route path={ROUTES.ADMIN} element={withSuspense(<Admin />)} />
        <Route
          path={ROUTES.NEWS_DETAIL(":slug")}
          element={withSuspense(<NewsDetail />)}
        />
        <Route
          path={ROUTES.PLAYER_DETAIL(":slug")}
          element={withSuspense(<PlayerDetail />)}
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
