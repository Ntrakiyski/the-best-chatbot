import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

const isDev = process.env.NODE_ENV === "development";

// Bundle analyzer support
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    experimental: {
      taint: true,
      authInterrupts: true,
      // Enable parallel build processing with worker threads
      webpackBuildWorker: true,
    },
    // Optimize webpack configuration for better performance
    webpack: (config, { dev }) => {
      // Enable filesystem caching for faster incremental builds
      if (dev) {
        config.cache = {
          type: "filesystem",
          buildDependencies: {
            config: [__filename],
          },
        };
      }

      return config;
    },
    // Disable source maps in production for faster builds (no Sentry)
    productionBrowserSourceMaps: false,
    // Enable SWC minification (faster than Terser)
    swcMinify: true,
    // Remove console logs in production for smaller bundles
    compiler: {
      removeConsole: isDev
        ? false
        : {
            exclude: ["error", "warn", "info"],
          },
    },
  };

  const withNextIntl = createNextIntlPlugin();
  return withBundleAnalyzer(withNextIntl(nextConfig));
};
