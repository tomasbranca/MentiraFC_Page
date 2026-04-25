import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { getInitialData, type InitialDataPayload } from "./data/getInitialData";
import { queryKeys } from "./data/queryKeys";
import { queryClient } from "./lib/queryClient";
import { reportError } from "./lib/errors/errorLogger";
import { startWebVitalsTracking } from "./lib/performance/reportWebVitals";
import ScrollToTop from "./presentation/app/scrollToTop";
import Loader from "./presentation/components/Loader/Loader";
import ErrorBoundary from "./presentation/components/errors/ErrorBoundary";
import ErrorFallback from "./presentation/components/errors/ErrorFallback";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

const root = createRoot(rootElement);

const renderShell = (node: ReactNode) => {
  root.render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <StrictMode>
          <ErrorBoundary>{node}</ErrorBoundary>
        </StrictMode>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const preloadQueryCache = (payload: InitialDataPayload) => {
  queryClient.setQueryData(queryKeys.news.all, payload.news);
  queryClient.setQueryData(queryKeys.players.all, payload.players);
  queryClient.setQueryData(queryKeys.games.finished, payload.games);
  queryClient.setQueryData(queryKeys.tournaments.current, payload.tournament);
  queryClient.setQueryData(queryKeys.teams.all, payload.teams);
  queryClient.setQueryData(
    queryKeys.games.tournamentFinished,
    payload.tournamentGames
  );
  queryClient.setQueryData(queryKeys.games.latest, payload.latestGame);
};

const bootstrap = async () => {
  startWebVitalsTracking();
  renderShell(<Loader />);

  try {
    const initialData = await getInitialData();

    preloadQueryCache(initialData);
    renderShell(<App initialData={initialData} />);
  } catch (error) {
    reportError(error, {
      scope: "main",
      action: "bootstrap_initial_render",
    });

    renderShell(
      <ErrorFallback
        title="No se pudieron cargar los datos iniciales"
        message="Intentá recargar la página en unos minutos."
      />
    );
  }
};

void bootstrap();
