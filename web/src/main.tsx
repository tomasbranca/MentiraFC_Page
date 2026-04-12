import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import ScrollToTop from "./presentation/app/scrollToTop";
import ErrorBoundary from "./presentation/components/errors/ErrorBoundary";
import { queryClient } from "./lib/queryClient";
import { startWebVitalsTracking } from "./lib/performance/reportWebVitals";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

startWebVitalsTracking();

createRoot(rootElement).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    </QueryClientProvider>
  </BrowserRouter>
);
