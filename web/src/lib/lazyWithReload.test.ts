import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearLazyReloadGuard,
  resolveLazyImportWithReload,
} from "./lazyWithReload";

const createStorageMock = () => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

describe("lazyWithReload", () => {
  const originalWindow = globalThis.window;
  const originalSessionStorage = globalThis.sessionStorage;

  beforeEach(() => {
    const sessionStorageMock = createStorageMock();
    const reload = vi.fn();

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: sessionStorageMock,
    });

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          reload,
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });

    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: originalSessionStorage,
    });
  });

  it("recarga una sola vez ante un fallo de chunk y deja la promesa pendiente", async () => {
    const reload = vi.spyOn(window.location, "reload");
    let settled = false;

    const promise = resolveLazyImportWithReload(async () => {
      throw new Error("Failed to fetch dynamically imported module");
    });

    promise.then(() => {
      settled = true;
    });

    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("mentira-fc:lazy-reload")).toBe("1");
    expect(settled).toBe(false);
  });

  it("si el fallo persiste despues del reload, propaga el error y limpia el guard", async () => {
    sessionStorage.setItem("mentira-fc:lazy-reload", "1");
    const reload = vi.spyOn(window.location, "reload");

    await expect(
      resolveLazyImportWithReload(async () => {
        throw new Error("Importing a module script failed");
      })
    ).rejects.toThrow("Importing a module script failed");

    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("mentira-fc:lazy-reload")).toBeNull();
  });

  it("limpia el guard cuando el import carga bien", async () => {
    sessionStorage.setItem("mentira-fc:lazy-reload", "1");

    const module = await resolveLazyImportWithReload(async () => ({
      default: () => null,
    }));

    expect(typeof module.default).toBe("function");
    expect(sessionStorage.getItem("mentira-fc:lazy-reload")).toBeNull();
  });
});
