import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

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
    },
  };
  
  const withNextIntl = createNextIntlPlugin();
  const configWithIntl = withNextIntl(nextConfig);
  
  // Wrap with Sentry config for error tracking and performance monitoring
  return withSentryConfig(configWithIntl, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    
    // Only upload source maps in CI/production builds
    silent: !process.env.CI,
    
    // Upload source maps during production build for better error tracking
    widenClientFileUpload: true,
    
    // Automatically annotate React components for better error messages
    reactComponentAnnotation: {
      enabled: true,
    },
    
    // Upload source maps during production builds for better error tracking
    // Note: Source maps will be deleted after upload for security
    sourcemaps: {
      assets: ["**/*.map"],
      deleteSourcemapsAfterUpload: true,
    },
    
    // Disable Sentry telemetry in development
    disableLogger: process.env.NODE_ENV === "development",
  });
};
