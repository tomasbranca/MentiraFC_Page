export type WebVitalsMetricName =
  | "LCP"
  | "CLS"
  | "INP"
  | "FCP"
  | "TTFB"
  | "DOMContentLoaded"
  | "Load";

export interface WebVitalsMetric {
  name: WebVitalsMetricName;
  value: number;
  unit: "ms" | "score";
  rating: "good" | "needs-improvement" | "poor";
}

const metricThresholds: Record<
  WebVitalsMetricName,
  { good: number; needsImprovement: number; unit: "ms" | "score" }
> = {
  LCP: { good: 2500, needsImprovement: 4000, unit: "ms" },
  CLS: { good: 0.1, needsImprovement: 0.25, unit: "score" },
  INP: { good: 200, needsImprovement: 500, unit: "ms" },
  FCP: { good: 1800, needsImprovement: 3000, unit: "ms" },
  TTFB: { good: 800, needsImprovement: 1800, unit: "ms" },
  DOMContentLoaded: { good: 1500, needsImprovement: 3000, unit: "ms" },
  Load: { good: 2500, needsImprovement: 4000, unit: "ms" },
};

function getRating(name: WebVitalsMetricName, value: number): WebVitalsMetric["rating"] {
  const threshold = metricThresholds[name];

  if (value <= threshold.good) {
    return "good";
  }

  if (value <= threshold.needsImprovement) {
    return "needs-improvement";
  }

  return "poor";
}

function emitMetric(metric: WebVitalsMetric): void {
  // Se deja como hook simple para futura integración con GA4, Sentry o endpoint propio.
  if (import.meta.env.DEV) {
    console.info("[WebVitals]", metric);
  }
}

export function startWebVitalsTracking(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }

  const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigationEntry) {
    emitMetric({
      name: "TTFB",
      value: navigationEntry.responseStart,
      unit: metricThresholds.TTFB.unit,
      rating: getRating("TTFB", navigationEntry.responseStart),
    });

    emitMetric({
      name: "DOMContentLoaded",
      value: navigationEntry.domContentLoadedEventEnd,
      unit: metricThresholds.DOMContentLoaded.unit,
      rating: getRating("DOMContentLoaded", navigationEntry.domContentLoadedEventEnd),
    });

    emitMetric({
      name: "Load",
      value: navigationEntry.loadEventEnd,
      unit: metricThresholds.Load.unit,
      rating: getRating("Load", navigationEntry.loadEventEnd),
    });
  }

  const observed = new Set<WebVitalsMetricName>();

  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (entry.entryType === "largest-contentful-paint" && !observed.has("LCP")) {
        observed.add("LCP");
        emitMetric({
          name: "LCP",
          value: entry.startTime,
          unit: metricThresholds.LCP.unit,
          rating: getRating("LCP", entry.startTime),
        });
      }

      if (entry.entryType === "paint" && entry.name === "first-contentful-paint" && !observed.has("FCP")) {
        observed.add("FCP");
        emitMetric({
          name: "FCP",
          value: entry.startTime,
          unit: metricThresholds.FCP.unit,
          rating: getRating("FCP", entry.startTime),
        });
      }

      if (entry.entryType === "layout-shift") {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput?: boolean };
        if (shift.hadRecentInput) {
          continue;
        }

        const currentValue = shift.value;
        emitMetric({
          name: "CLS",
          value: currentValue,
          unit: metricThresholds.CLS.unit,
          rating: getRating("CLS", currentValue),
        });
      }

      if (entry.entryType === "event" && entry.name === "click") {
        const eventEntry = entry as PerformanceEventTiming;
        emitMetric({
          name: "INP",
          value: eventEntry.duration,
          unit: metricThresholds.INP.unit,
          rating: getRating("INP", eventEntry.duration),
        });
      }
    }
  });

  observer.observe({ type: "largest-contentful-paint", buffered: true });
  observer.observe({ type: "paint", buffered: true });
  observer.observe({ type: "layout-shift", buffered: true });
  observer.observe({ type: "event", buffered: true });
}
