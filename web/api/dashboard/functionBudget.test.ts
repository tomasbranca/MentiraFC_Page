import { readFileSync, readdirSync } from "node:fs";
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

const apiDir = join(dashboardApiDir, "..");

const getApiSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getApiSourceFiles(fullPath);
    }

    return entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
      ? [fullPath]
      : [];
  });

describe("dashboard api function budget", () => {
  it("centraliza el dashboard en una sola Function para el plan Hobby de Vercel", () => {
    const routeFiles = getRouteFiles(dashboardApiDir);

    expect(routeFiles.some((filePath) => filePath.endsWith(`${sep}[id].ts`))).toBe(
      false
    );
    expect(routeFiles).toEqual(["[resource].ts"]);
  });

  it("evita imports de directorios que rompen el runtime ESM de Vercel", () => {
    const directoryImports = getApiSourceFiles(apiDir).flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");
      const imports = source.matchAll(
        /from\s+["'](?<specifier>[^"']*src\/domain\/games)["']/g
      );

      return [...imports].map((match) => ({
        filePath: relative(apiDir, filePath),
        specifier: match.groups?.specifier,
      }));
    });

    expect(directoryImports).toEqual([]);
  });
});
