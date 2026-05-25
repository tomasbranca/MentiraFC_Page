import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const apiDir = dirname(fileURLToPath(import.meta.url));

const getRouteFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);

    if (entry.name === "_lib") {
      return [];
    }

    if (entry.isDirectory()) {
      return getRouteFiles(fullPath);
    }

    const isRouteFile =
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.startsWith("_");

    return isRouteFile ? [relative(apiDir, fullPath)] : [];
  });

describe("api function budget", () => {
  it("mantiene el proyecto bajo el limite Hobby de Vercel", () => {
    const routeFiles = getRouteFiles(apiDir);

    expect(routeFiles.every((filePath) => filePath.endsWith(`${sep}index.ts`))).toBe(
      true
    );
    expect(routeFiles).toContain(`reactions${sep}index.ts`);
    expect(routeFiles.length).toBeLessThanOrEqual(12);
  });
});
