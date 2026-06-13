import { Suspense } from "react";
import { Routes } from "react-router-dom";

import Loader from "../components/Loader/Loader";
import { appRouteElements } from "./appRouteElements";

const AppRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>{appRouteElements}</Routes>
  </Suspense>
);

export default AppRoutes;
