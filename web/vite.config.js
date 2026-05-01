import { sentryVitePlugin } from "@sentry/vite-plugin";
import { cwd } from "node:process";
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isEnabled = (value) => /^(1|true|yes)$/i.test(value ?? "");

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
            if (id.includes("vite/preload-helper")) return "runtime";
            if (!id.includes("node_modules")) return;

            if (id.includes("@sentry")) return "sentry";
            if (id.includes("@sanity")) return "sanity";
            if (id.includes("react-icons")) return "icons";
            if (id.includes("@vercel/analytics") || id.includes("@vercel/speed-insights")) {
              return "analytics";
            }
            if (id.includes("@tanstack/react-query")) return "query";
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }

            return "vendor";
          },
        },
      },
    },
  };
})
