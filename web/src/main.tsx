import { StrictMode, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import {
  createBootstrapErrorPayload,
  createEmptyInitialData,
  type InitialDataPayload,
} from "./data/initialDataPayload";
import { queryKeys } from "./data/queryKeys";
import { queryClient } from "./lib/queryClient";
import { reportError } from "./lib/errors/errorLogger";
import { sortNews } from "./presentation/utils/news.utils";
import { startWebVitalsTracking } from "./lib/performance/reportWebVitals";
import { initSentry } from "./lib/errors/sentryClient";
import ScrollToTop from "./presentation/app/scrollToTop";
import Loader from "./presentation/components/Loader/Loader";
import ErrorBoundary from "./presentation/components/errors/ErrorBoundary";
import { AuthProvider } from "./presentation/context/AuthProvider";
import {
  getHomeCarouselImageHeight,
  HOME_CAROUSEL_IMAGE_FIT,
  HOME_CAROUSEL_IMAGE_QUALITY,
  HOME_CAROUSEL_IMAGE_SIZES,
  HOME_CAROUSEL_IMAGE_WIDTHS,
} from "./presentation/features/main/LatestNews/Carousel/carouselImages";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

const root = createRoot(rootElement);

const EMPTY_INITIAL_DATA: InitialDataPayload = createEmptyInitialData();
const SENTRY_IDLE_DELAY_MS = 5000;

const isSentryConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());

const initializeSentry = () => {
  void initSentry().catch((error: unknown) => {
    console.error("[Sentry]", error);
  });
};

const scheduleSentryInit = () => {
  if (!isSentryConfigured()) return;

  const scheduleIdleInit = () => {
    window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(initializeSentry, { timeout: 5000 });
        return;
      }

      initializeSentry();
    }, SENTRY_IDLE_DELAY_MS);
  };

  if (document.readyState === "complete") {
    scheduleIdleInit();
    return;
  }

  window.addEventListener("load", scheduleIdleInit, { once: true });
};

const renderShell = (node: ReactNode) => {
  root.render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <StrictMode>
          <ErrorBoundary>
            <AuthProvider>
              <Suspense fallback={<Loader />}>{node}</Suspense>
            </AuthProvider>
          </ErrorBoundary>
        </StrictMode>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const renderAppShell = (
  initialData: InitialDataPayload,
  phase: "shell" | "hydrated"
) => {
  renderShell(
    <Suspense fallback={<Loader />}>
      <App key={phase} initialData={initialData} />
    </Suspense>
  );
};

const HOME_PATHNAME = "/";
const HOME_LCP_PRELOAD_ID = "home-lcp-image-preload";

const buildHomeLcpImageUrl = (imageUrl: string, width: number): string => {
  if (!imageUrl.includes("cdn.sanity.io/images/")) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(getHomeCarouselImageHeight(width)));
    url.searchParams.set("fit", HOME_CAROUSEL_IMAGE_FIT);
    url.searchParams.set("q", String(HOME_CAROUSEL_IMAGE_QUALITY));
    url.searchParams.set("auto", "format");

    return url.toString();
  } catch {
    return imageUrl;
  }
};

const buildHomeLcpImageSrcSet = (imageUrl: string): string =>
  HOME_CAROUSEL_IMAGE_WIDTHS.map(
    (width) => `${buildHomeLcpImageUrl(imageUrl, width)} ${width}w`
  ).join(", ");

const getHomeLcpPreloadWidth = (): number => {
  const targetWidth = Math.ceil(window.innerWidth * window.devicePixelRatio);

  return (
    HOME_CAROUSEL_IMAGE_WIDTHS.find((width) => width >= targetWidth) ??
    HOME_CAROUSEL_IMAGE_WIDTHS[HOME_CAROUSEL_IMAGE_WIDTHS.length - 1]
  );
};

const ensureHomeLcpPreload = (
  payload: InitialDataPayload,
  pathname: string
) => {
  if (pathname !== HOME_PATHNAME) return;

  const firstCarouselImage = sortNews(payload.news)[0]?.imageUrl;

  if (!firstCarouselImage) return;

  const optimizedLcpImage = buildHomeLcpImageUrl(
    firstCarouselImage,
    getHomeLcpPreloadWidth()
  );
  const optimizedLcpImageSrcSet = buildHomeLcpImageSrcSet(firstCarouselImage);

  const existing = document.getElementById(HOME_LCP_PRELOAD_ID);

  if (existing instanceof HTMLLinkElement) {
    existing.href = optimizedLcpImage;
    existing.setAttribute("imagesrcset", optimizedLcpImageSrcSet);
    existing.setAttribute("imagesizes", HOME_CAROUSEL_IMAGE_SIZES);
    return;
  }

  const link = document.createElement("link");
  link.id = HOME_LCP_PRELOAD_ID;
  link.rel = "preload";
  link.as = "image";
  link.href = optimizedLcpImage;
  link.fetchPriority = "high";
  link.setAttribute("imagesrcset", optimizedLcpImageSrcSet);
  link.setAttribute("imagesizes", HOME_CAROUSEL_IMAGE_SIZES);
  document.head.appendChild(link);
};

const preloadQueryCache = (payload: InitialDataPayload) => {
  if (payload.bootstrapScope === "full") {
    queryClient.setQueryData(queryKeys.games.latest, payload.latestGame);
    queryClient.setQueryData(queryKeys.news.all, payload.news);
    queryClient.setQueryData(queryKeys.galleries.all, payload.galleries);
    queryClient.setQueryData(queryKeys.players.all, payload.players);
    queryClient.setQueryData(queryKeys.staff.all, payload.staff);
    queryClient.setQueryData(queryKeys.games.finished, payload.games);
    queryClient.setQueryData(
      queryKeys.events.goals(new Date().getFullYear()),
      payload.goalEvents
    );
    queryClient.setQueryData(queryKeys.tournaments.current, payload.tournament);
    queryClient.setQueryData(queryKeys.teams.all, payload.teams);
    queryClient.setQueryData(
      queryKeys.games.tournamentFinished,
      payload.tournamentGames
    );
  }

  if (payload.currentNewsDetail) {
    queryClient.setQueryData(
      queryKeys.news.bySlug(payload.currentNewsDetail.slug),
      payload.currentNewsDetail.newsItem
    );
    queryClient.setQueryData(
      queryKeys.news.suggested(payload.currentNewsDetail.slug),
      payload.currentNewsDetail.suggestedNews
    );
  }

  if (payload.currentGalleryDetail) {
    queryClient.setQueryData(
      queryKeys.galleries.bySlug(payload.currentGalleryDetail.slug),
      payload.currentGalleryDetail.gallery
    );
  }

  if (payload.currentPlayerDetail) {
    queryClient.setQueryData(
      queryKeys.players.bySlug(payload.currentPlayerDetail.slug),
      payload.currentPlayerDetail.player
    );
  }

  if (payload.currentStaffDetail) {
    queryClient.setQueryData(
      queryKeys.staff.bySlug(payload.currentStaffDetail.slug),
      payload.currentStaffDetail.staffMember
    );
  }
};

const loadRouteInitialData = async (
  pathname: string
): Promise<InitialDataPayload> => {
  const { getRouteInitialData } = await import("./data/getRouteInitialData");

  return getRouteInitialData(pathname);
};

const bootstrap = async () => {
  startWebVitalsTracking();
  scheduleSentryInit();
  const pathname = window.location.pathname;
  const routeInitialDataPromise = loadRouteInitialData(pathname);

  renderAppShell(EMPTY_INITIAL_DATA, "shell");

  try {
    const initialData = await routeInitialDataPromise;

    ensureHomeLcpPreload(initialData, pathname);
    preloadQueryCache(initialData);
    renderAppShell(initialData, "hydrated");
  } catch (error) {
    reportError(error, {
      scope: "main",
      action: "bootstrap_background_hydration",
    });
    renderAppShell(createBootstrapErrorPayload(), "hydrated");
  }
};

void bootstrap();
