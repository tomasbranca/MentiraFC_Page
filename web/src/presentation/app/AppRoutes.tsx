import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Loader from "../components/Loader/Loader";
import { ROUTES } from "../constants/routes.constants";

import AppLayout from "./AppLayout";

const Home = lazy(() => import("../pages/Home/Home"));
const News = lazy(() => import("../pages/News/News"));
const Team = lazy(() => import("../pages/Team/Team"));
const Table = lazy(() => import("../pages/Table/Table"));
const Record = lazy(() => import("../pages/Record/Record"));
const Admin = lazy(() => import("../pages/Admin/Admin"));
const NewsDetail = lazy(() => import("../pages/NewsDetail/NewsDetail"));
const PlayerDetail = lazy(() => import("../pages/PlayerDetail/PlayerDetail"));

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path={ROUTES.HOME}
          element={
            <Suspense fallback={<Loader />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.NEWS}
          element={
            <Suspense fallback={<Loader />}>
              <News />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.TEAM}
          element={
            <Suspense fallback={<Loader />}>
              <Team />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.TABLE}
          element={
            <Suspense fallback={<Loader />}>
              <Table />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.RECORD}
          element={
            <Suspense fallback={<Loader />}>
              <Record />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            <Suspense fallback={<Loader />}>
              <Admin />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.NEWS_DETAIL(":slug")}
          element={
            <Suspense fallback={<Loader />}>
              <NewsDetail />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.PLAYER_DETAIL(":slug")}
          element={
            <Suspense fallback={<Loader />}>
              <PlayerDetail />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
