import { Route } from "react-router-dom";

import { lazyWithReload } from "../../lib/lazyWithReload";
import { ROUTES } from "../../shared/routing";
import Home from "../pages/Home/Home";

const News = lazyWithReload(() => import("../pages/News/News"));
const Gallery = lazyWithReload(() => import("../pages/Gallery/Gallery"));
const Team = lazyWithReload(() => import("../pages/Team/Team"));
const Table = lazyWithReload(() => import("../pages/Table/Table"));
const Record = lazyWithReload(() => import("../pages/Record/Record"));

export const publicRoutes = (
  <>
    <Route path={ROUTES.HOME} element={<Home />} />
    <Route path={ROUTES.NEWS} element={<News />} />
    <Route path={ROUTES.GALLERY} element={<Gallery />} />
    <Route path={ROUTES.TEAM} element={<Team />} />
    <Route path={ROUTES.TABLE} element={<Table />} />
    <Route path={ROUTES.RECORD} element={<Record />} />
  </>
);
