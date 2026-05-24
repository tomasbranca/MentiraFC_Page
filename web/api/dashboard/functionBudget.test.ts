import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dashboardApiDir = dirname(fileURLToPath(import.meta.url));

const getRouteFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getRouteFiles(fullPath);
    }

    const isRouteFile =
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.startsWith("_");

    return isRouteFile ? [relative(dashboardApiDir, fullPath)] : [];
  });

describe("dashboard api function budget", () => {
  it("mantiene una sola Function por recurso para el plan Hobby de Vercel", () => {
    const routeFiles = getRouteFiles(dashboardApiDir);

    expect(routeFiles.some((filePath) => filePath.endsWith(`${sep}[id].ts`))).toBe(
      false
    );
    expect(routeFiles.every((filePath) => filePath.endsWith(`${sep}index.ts`))).toBe(
      true
    );
    expect(routeFiles).toHaveLength(8);
    expect(routeFiles.length).toBeLessThanOrEqual(12);
  });
});
