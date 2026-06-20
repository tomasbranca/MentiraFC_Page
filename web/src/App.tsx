import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import type { InitialDataPayload } from "./data/getInitialData";
import { fetchPublicMaintenanceSettings } from "./data/admin";
import { queryKeys } from "./data/queryKeys";
import { lazyWithReload } from "./lib/lazyWithReload";
import { shouldEnableVercelAnalytics } from "./lib/analytics/shouldEnableVercelAnalytics";
import ErrorFallback from "./presentation/components/errors/ErrorFallback";
import { GameProvider } from "./presentation/context/GameProvider";
import { InitialDataProvider } from "./presentation/context/InitialDataContext";
import Footer from "./presentation/layout/Footer/Footer";
import NavBar from "./presentation/layout/NavBar/NavBar";
import AppRoutes from "./presentation/routing/AppRoutes";
import { isStandaloneRoutePath } from "./presentation/routing/standaloneRoutes";
import RouteHead from "./presentation/seo/RouteHead";

import "./App.css";

type AppProps = {
  initialData: InitialDataPayload;
};

const Analytics = lazyWithReload(() =>
  import("@vercel/analytics/react").then(({ Analytics }) => ({
    default: Analytics,
  }))
);
const SpeedInsights = lazyWithReload(() =>
  import("@vercel/speed-insights/react").then(({ SpeedInsights }) => ({
    default: SpeedInsights,
  }))
);
const AppToaster = lazyWithReload(() => import("./presentation/app/AppToaster"));

function App({ initialData }: AppProps) {
  const { pathname } = useLocation();
  const enableAnalytics = shouldEnableVercelAnalytics();
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);
  const hasBootstrapError = initialData.bootstrapScope === "bootstrap-error";
  const isStandaloneRoute = isStandaloneRoutePath(pathname);
  const maintenanceQuery = useQuery({
    queryKey: queryKeys.admin.publicMaintenance,
    queryFn: fetchPublicMaintenanceSettings,
    enabled: !isStandaloneRoute,
    staleTime: 1000 * 60,
    retry: false,
  });
  const isMaintenanceActive =
    !isStandaloneRoute && maintenanceQuery.data?.enabled === true;

  useEffect(() => {
    const loadDeferredStyles = () => {
      void import("./presentation/app/nonCritical.css");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadDeferredStyles);

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(loadDeferredStyles, 1);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!enableAnalytics) return;

    const loadAnalytics = () => setShouldLoadAnalytics(true);

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadAnalytics, {
        timeout: 3000,
      });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(loadAnalytics, 3000);

    return () => clearTimeout(timeoutId);
  }, [enableAnalytics]);

  const handleBootstrapRetry = () => {
    window.location.reload();
  };

  return (
    <InitialDataProvider initialData={initialData}>
      {shouldLoadAnalytics && (
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}

      <GameProvider>
        <Suspense fallback={null}>
          <AppToaster />
        </Suspense>
        <RouteHead />
        {!isStandaloneRoute && <NavBar />}

        <main
          className={
            isStandaloneRoute
              ? "min-h-screen"
              : "border-t-96 border-t-violet-900 min-h-screen"
          }
        >
          {isMaintenanceActive ? (
            <section className="flex min-h-[90vh] items-center justify-center bg-[#101012] px-4 py-16 text-white">
              <div className="max-w-xl rounded-md border border-violet-200/20 bg-[#17151d] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-violet-200/80">
                  Mantenimiento
                </p>
                <h1 className="mt-4 text-3xl font-black uppercase leading-none sm:text-4xl">
                  Volvemos en breve
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-violet-50/75">
                  {maintenanceQuery.data?.message ||
                    "Estamos realizando mantenimiento. Volve a intentar en unos minutos."}
                </p>
              </div>
            </section>
          ) : hasBootstrapError ? (
            <ErrorFallback
              title="No pudimos cargar la pagina"
              message={initialData.bootstrapError?.message}
              onRetry={handleBootstrapRetry}
              retryLabel="Volver a intentar"
            />
          ) : (
            <AppRoutes />
          )}
        </main>

        {!isStandaloneRoute && <Footer />}
      </GameProvider>
    </InitialDataProvider>
  );
}

export default App;
