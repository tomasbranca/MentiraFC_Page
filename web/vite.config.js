import { sentryVitePlugin } from "@sentry/vite-plugin";
import { cwd } from "node:process";
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
      sourcemap: shouldUploadSentrySourcemaps ? "hidden" : false,
    },
  };
})
