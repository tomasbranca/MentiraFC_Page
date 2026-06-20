import { Route } from "react-router-dom";

import { lazyWithReload } from "../../lib/lazyWithReload";
import { ROUTES } from "../../shared/routing";

const NewsDetail = lazyWithReload(() => import("../pages/NewsDetail/NewsDetail"));
const GalleryDetail = lazyWithReload(
  () => import("../pages/GalleryDetail/GalleryDetail")
);
const PlayerDetail = lazyWithReload(
  () => import("../pages/PlayerDetail/PlayerDetail")
);
const StaffDetail = lazyWithReload(
  () => import("../pages/StaffDetail/StaffDetail")
);

export const detailRoutes = (
  <>
    <Route path={ROUTES.NEWS_DETAIL(":slug")} element={<NewsDetail />} />
    <Route path={ROUTES.GALLERY_DETAIL(":slug")} element={<GalleryDetail />} />
    <Route path={ROUTES.STAFF_DETAIL(":slug")} element={<StaffDetail />} />
    <Route path={ROUTES.PLAYER_DETAIL(":slug")} element={<PlayerDetail />} />
  </>
);
