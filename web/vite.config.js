import { sentryVitePlugin } from "@sentry/vite-plugin";
import { Buffer } from "node:buffer";
import { cwd } from "node:process";
import process from "node:process";
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isEnabled = (value) => /^(1|true|yes)$/i.test(value ?? "");

const createNodeRequestBody = async (request) => {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

const writeWebResponse = async (response, nodeResponse) => {
  nodeResponse.statusCode = response.status;

  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  nodeResponse.end(body);
};

const createDashboardApiDevPlugin = (env) => ({
  name: "dashboard-api-dev",
  configureServer(server) {
    Object.assign(process.env, env);

    server.middlewares.use("/api/dashboard/news", async (request, response) => {
      try {
        const relativePath = request.url ?? "/";
        const requestUrl = new URL(
          `/api/dashboard/news${relativePath === "/" ? "" : relativePath}`,
          "http://localhost"
        );
        const routeModulePath =
          relativePath === "/"
            ? "/api/dashboard/news/index.ts"
            : "/api/dashboard/news/[id].ts";
        const routeModule = await server.ssrLoadModule(routeModulePath);
        const routeHandler =
          routeModule.default?.fetch ?? routeModule.default;

        if (typeof routeHandler !== "function") {
          throw new Error("Invalid dashboard API route handler.");
        }

        const body = await createNodeRequestBody(request);
        const headers = new Headers();

        Object.entries(request.headers).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => headers.append(key, item));
            return;
          }

          if (typeof value === "string") {
            headers.set(key, value);
          }
        });
        const webRequest = new Request(requestUrl, {
          method: request.method,
          headers,
          body,
        });
        const webResponse = await routeHandler(webRequest);

        await writeWebResponse(webResponse, response);
      } catch {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            error: "No pudimos ejecutar la API local del dashboard.",
          })
        );
      }
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), "");
  const sentryOrg = env.SENTRY_ORG || "tomas-brancatisano";
  const sentryProject = env.SENTRY_PROJECT || "mentira-fc";
  const sentryRelease = env.SENTRY_RELEASE || env.VERCEL_GIT_COMMIT_SHA;
  const shouldUploadSentrySourcemaps = Boolean(
    env.SENTRY_AUTH_TOKEN &&
      sentryOrg &&
      sentryProject &&
      sentryRelease
  );
  const shouldGenerateSourcemaps =
    shouldUploadSentrySourcemaps || isEnabled(env.VITE_BUILD_SOURCEMAP);

  return {
    plugins: [
      react(),
      tailwindcss(),
      createDashboardApiDevPlugin(env),
      ...(shouldUploadSentrySourcemaps
        ? [
            sentryVitePlugin({
              org: sentryOrg,
              project: sentryProject,
              authToken: env.SENTRY_AUTH_TOKEN,
              release: {
                name: sentryRelease,
                setCommits: {
                  auto: true,
                },
              },
              sourcemaps: {
                assets: "./dist/assets/**",
                filesToDeleteAfterUpload: "./dist/**/*.map",
              },
              telemetry: false,
            }),
          ]
        : []),
    ],

    build: {
      sourcemap: shouldUploadSentrySourcemaps
        ? "hidden"
        : shouldGenerateSourcemaps,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, "/");

            if (id.includes("vite/preload-helper")) return "runtime";
            if (!id.includes("node_modules")) return;

            if (id.includes("@sentry")) return "sentry";
            if (
              id.includes("@portabletext/editor") ||
              id.includes("@portabletext/html") ||
              id.includes("@portabletext/keyboard-shortcuts") ||
              id.includes("@portabletext/markdown") ||
              id.includes("@portabletext/patches") ||
              id.includes("@portabletext/schema") ||
              id.includes("@portabletext/to-html") ||
              id.includes("@xstate/react") ||
              id.includes("scroll-into-view-if-needed") ||
              id.includes("xstate")
            ) {
              return "dashboard-editor";
            }
            if (
              id.includes("@sanity") ||
              id.includes("event-source-polyfill") ||
              id.includes("eventsource") ||
              id.includes("get-it") ||
              id.includes("rxjs")
            ) {
              return "sanity";
            }
            if (id.includes("zod")) return "validation-vendor";
            if (id.includes("react-icons")) return "icons";
            if (id.includes("@vercel/analytics") || id.includes("@vercel/speed-insights")) {
              return "analytics";
            }
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("@tanstack/query-core")
            ) {
              return "query";
            }
            if (id.includes("react-router")) return "router";
            if (
              normalizedId.includes("/node_modules/react/") ||
              normalizedId.includes("/node_modules/react-dom/") ||
              normalizedId.includes("/node_modules/scheduler/")
            ) {
              return "react-vendor";
            }

            return "vendor";
          },
        },
      },
    },
  };
})
