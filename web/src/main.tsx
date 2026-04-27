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
import type { InitialDataPayload } from "./data/getInitialData";
import { getImageUrl } from "./data/imageService";
import { getRouteInitialData } from "./data/getRouteInitialData";
import { queryClient } from "./lib/queryClient";
import { reportError } from "./lib/errors/errorLogger";
import { sortNews } from "./presentation/utils/news.utils";
import { startWebVitalsTracking } from "./lib/performance/reportWebVitals";
import ScrollToTop from "./presentation/app/scrollToTop";
import Loader from "./presentation/components/Loader/Loader";
import ErrorBoundary from "./presentation/components/errors/ErrorBoundary";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

const root = createRoot(rootElement);

const EMPTY_INITIAL_DATA: InitialDataPayload = {
  bootstrapScope: "empty",
  news: [],
  players: [],
  games: [],
  tournament: null,
  teams: [],
  tournamentGames: [],
  latestGame: null,
};

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

const ensureHomeLcpPreload = (payload: InitialDataPayload, pathname: string) => {
  if (pathname !== HOME_PATHNAME) return;

  const firstCarouselImage = sortNews(payload.news)[0]?.imageUrl;

  if (!firstCarouselImage) return;

  const optimizedLcpImage = getImageUrl(firstCarouselImage, {
    width: 1280,
    height: 720,
    fit: "crop",
    quality: 70,
    autoFormat: true,
  });

  const existing = document.getElementById(HOME_LCP_PRELOAD_ID);

  if (existing instanceof HTMLLinkElement) {
    existing.href = optimizedLcpImage;
    return;
  }

  const link = document.createElement("link");
  link.id = HOME_LCP_PRELOAD_ID;
  link.rel = "preload";
  link.as = "image";
  link.href = optimizedLcpImage;
  link.fetchPriority = "high";
  document.head.appendChild(link);
};

const preloadQueryCache = (payload: InitialDataPayload) => {
  const { queryKeys } = require("./data/queryKeys");

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
    const initialData = await getRouteInitialData(pathname);

    ensureHomeLcpPreload(initialData, pathname);
    preloadQueryCache(initialData);
    renderAppShell(initialData, "hydrated");
  } catch (error) {
    reportError(error, {
      scope: "main",
      action: "bootstrap_background_hydration",
    });
  }
};

void bootstrap();
