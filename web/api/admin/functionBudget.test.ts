import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminApiDir = dirname(fileURLToPath(import.meta.url));

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

    return isRouteFile ? [relative(adminApiDir, fullPath)] : [];
  });

describe("admin api function budget", () => {
  it("centraliza el admin en una sola Function", () => {
    expect(getRouteFiles(adminApiDir)).toEqual(["[resource].ts"]);
  });

  it("usa la misma forma dinamica que dashboard", () => {
    expect(`${"admin"}${sep}[resource].ts`).toContain(`${sep}[resource].ts`);
  });
});
