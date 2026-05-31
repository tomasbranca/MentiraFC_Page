import { readFileSync, readdirSync } from "node:fs";
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

    expect(
      routeFiles.every(
        (filePath) =>
          filePath.endsWith(`${sep}index.ts`) ||
          filePath.endsWith(`${sep}[resource].ts`) ||
          filePath.endsWith(`${sep}[...path].ts`)
      )
    ).toBe(true);
    expect(routeFiles).toContain(`dashboard${sep}[resource].ts`);
    expect(routeFiles).toContain(`admin${sep}[resource].ts`);
    expect(routeFiles).toContain(`reactions${sep}index.ts`);
    expect(routeFiles).toContain(`comments${sep}index.ts`);
    expect(routeFiles).toHaveLength(5);
  });

  it("redirige recursos dinamicos antes del fallback SPA", () => {
    const vercelConfig = JSON.parse(
      readFileSync(join(apiDir, "..", "vercel.json"), "utf8")
    ) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };
    const dashboardRewriteIndex = vercelConfig.rewrites?.findIndex(
      (rewrite) => rewrite.source === "/api/dashboard/:resource"
    );
    const adminRewriteIndex = vercelConfig.rewrites?.findIndex(
      (rewrite) => rewrite.source === "/api/admin/:resource"
    );
    const fallbackRewriteIndex = vercelConfig.rewrites?.findIndex(
      (rewrite) => rewrite.destination === "/index.html"
    );

    expect(vercelConfig.rewrites).toContainEqual({
      source: "/api/dashboard/:resource",
      destination: "/api/dashboard/[resource]",
    });

    expect(vercelConfig.rewrites).toContainEqual({
      source: "/api/comments/:path*",
      destination: "/api/comments/[...path]",
    });
    expect(vercelConfig.rewrites).toContainEqual({
      source: "/api/admin/:resource",
      destination: "/api/admin/[resource]",
    });
    expect(dashboardRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(adminRewriteIndex).toBeGreaterThan(dashboardRewriteIndex ?? -1);
    expect(fallbackRewriteIndex).toBeGreaterThan(dashboardRewriteIndex ?? -1);
  });
});
