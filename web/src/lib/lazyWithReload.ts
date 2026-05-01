import { lazy, type ComponentType } from "react";

const RELOAD_GUARD_KEY = "mentira-fc:lazy-reload";

const CHUNK_LOAD_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "loading chunk",
  "chunkloaderror",
  "error loading dynamically imported module",
];

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? "");
};

const shouldReloadForChunkError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
};

const hasPendingReload = () => sessionStorage.getItem(RELOAD_GUARD_KEY) === "1";

const markPendingReload = () => {
  sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
};

// React.lazy's public type is intentionally ComponentType<any>; keep the any
// contained here so lazy-loaded components retain their own prop types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = ComponentType<any>;

type LazyModule<TComponent extends LazyComponent> = {
  default: TComponent;
};

export const clearLazyReloadGuard = () => {
  sessionStorage.removeItem(RELOAD_GUARD_KEY);
};

export const resolveLazyImportWithReload = async <
  TComponent extends LazyComponent,
  T extends LazyModule<TComponent>,
>(
  importer: () => Promise<T>
) => {
  try {
    const module = await importer();
    clearLazyReloadGuard();

    return module;
  } catch (error) {
    if (typeof window !== "undefined" && shouldReloadForChunkError(error)) {
      if (!hasPendingReload()) {
        markPendingReload();
        window.location.reload();

        return new Promise<T>(() => {});
      }

      clearLazyReloadGuard();
    }

    throw error;
  }
};

export const lazyWithReload = <
  TComponent extends LazyComponent,
  T extends LazyModule<TComponent>,
>(
  importer: () => Promise<T>
) => lazy(() => resolveLazyImportWithReload(importer));
