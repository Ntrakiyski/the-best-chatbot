import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment and release tracking
  environment: ENVIRONMENT,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  
  // Sampling: Conservative for production, full for non-prod
  tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
  
  // Session Replay: Disabled initially as requested
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
  
  // Disable console logging integration on client (server-side only)
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // PII scrubbing and filtering
  beforeSend(event, hint) {
    // Scrub email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Scrub common secrets/tokens
    const secretRegex = /(?:token|key|secret|password|auth)["\s:=]+([^\s"',}]+)/gi;
    
    const scrubString = (str: string): string => {
      return str
        .replace(emailRegex, "[REDACTED_EMAIL]")
        .replace(secretRegex, (match, p1) => match.replace(p1, "[REDACTED]"));
    };
    
    // Scrub breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.message) {
          breadcrumb.message = scrubString(breadcrumb.message);
        }
        if (breadcrumb.data) {
          Object.keys(breadcrumb.data).forEach((key) => {
            if (typeof breadcrumb.data![key] === "string") {
              breadcrumb.data![key] = scrubString(breadcrumb.data![key]);
            }
          });
        }
        return breadcrumb;
      });
    }
    
    // Scrub exception messages
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((exception) => {
        if (exception.value) {
          exception.value = scrubString(exception.value);
        }
        return exception;
      });
    }
    
    // Scrub request data
    if (event.request) {
      if (event.request.url) {
        event.request.url = scrubString(event.request.url);
      }
      if (event.request.data) {
        event.request.data = scrubString(JSON.stringify(event.request.data));
      }
      // Remove cookies and query strings that might contain sensitive data
      delete event.request.cookies;
      delete event.request.query_string;
    }
    
    return event;
  },
  
  // Ignore common non-critical errors
  ignoreErrors: [
    // Browser extension errors
    "top.GLOBALS",
    "Can't find variable: ZiteReader",
    "jigsaw is not defined",
    "ComboSearch is not defined",
    // Network errors that are expected
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // AbortError from user cancelling requests
    "AbortError",
  ],
});

