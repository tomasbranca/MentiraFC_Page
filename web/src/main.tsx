import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ScrollToTop from "./presentation/app/scrollToTop";
import ErrorBoundary from "./presentation/components/errors/ErrorBoundary";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento root para montar la app");
}

createRoot(rootElement).render(
  <BrowserRouter>
    <ScrollToTop />
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  </BrowserRouter>
);
