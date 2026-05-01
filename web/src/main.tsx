import { StrictMode, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/archivo/latin-900.css";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-700.css";
import "@fontsource/roboto/latin-900.css";

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

import "./index.css";

void initSentry();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

const root = createRoot(rootElement);

const EMPTY_INITIAL_DATA: InitialDataPayload = createEmptyInitialData();

const renderShell = (node: ReactNode) => {
  root.render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <StrictMode>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>{node}</Suspense>
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
const HOME_LCP_IMAGE_WIDTHS = [640, 960, 1280] as const;
const HOME_LCP_IMAGE_SIZES = "100vw";

const buildHomeLcpImageUrl = (imageUrl: string, width: number): string => {
  if (!imageUrl.includes("cdn.sanity.io/images/")) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", "720");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("q", "70");
    url.searchParams.set("auto", "format");

    return url.toString();
  } catch {
    return imageUrl;
  }
};

const buildHomeLcpImageSrcSet = (imageUrl: string): string =>
  HOME_LCP_IMAGE_WIDTHS.map(
    (width) => `${buildHomeLcpImageUrl(imageUrl, width)} ${width}w`
  ).join(", ");

const ensureHomeLcpPreload = (
  payload: InitialDataPayload,
  pathname: string
) => {
  if (pathname !== HOME_PATHNAME) return;

  const firstCarouselImage = sortNews(payload.news)[0]?.imageUrl;

  if (!firstCarouselImage) return;

  const optimizedLcpImage = buildHomeLcpImageUrl(firstCarouselImage, 1280);
  const optimizedLcpImageSrcSet = buildHomeLcpImageSrcSet(firstCarouselImage);

  const existing = document.getElementById(HOME_LCP_PRELOAD_ID);

  if (existing instanceof HTMLLinkElement) {
    existing.href = optimizedLcpImage;
    existing.setAttribute("imagesrcset", optimizedLcpImageSrcSet);
    existing.setAttribute("imagesizes", HOME_LCP_IMAGE_SIZES);
    return;
  }

  const link = document.createElement("link");
  link.id = HOME_LCP_PRELOAD_ID;
  link.rel = "preload";
  link.as = "image";
  link.href = optimizedLcpImage;
  link.fetchPriority = "high";
  link.setAttribute("imagesrcset", optimizedLcpImageSrcSet);
  link.setAttribute("imagesizes", HOME_LCP_IMAGE_SIZES);
  document.head.appendChild(link);
};

const preloadQueryCache = (payload: InitialDataPayload) => {
  if (payload.bootstrapScope === "full") {
    queryClient.setQueryData(queryKeys.games.latest, payload.latestGame);
    queryClient.setQueryData(queryKeys.news.all, payload.news);
    queryClient.setQueryData(queryKeys.players.all, payload.players);
    queryClient.setQueryData(queryKeys.games.finished, payload.games);
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

  if (payload.currentPlayerDetail) {
    queryClient.setQueryData(
      queryKeys.players.bySlug(payload.currentPlayerDetail.slug),
      payload.currentPlayerDetail.player
    );
  }
};

const bootstrap = async () => {
  startWebVitalsTracking();
  renderAppShell(EMPTY_INITIAL_DATA, "shell");

  try {
    const pathname = window.location.pathname;
    const { getRouteInitialData } = await import("./data/getRouteInitialData");
    const initialData = await getRouteInitialData(pathname);

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
