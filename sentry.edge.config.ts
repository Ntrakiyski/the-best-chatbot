import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment and release tracking
  environment: ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
  
  // Sampling: Conservative for production, full for non-prod
  tracesSampleRate: ENVIRONMENT === "production" ? 0.1 : 1.0,
  
  // PII scrubbing and filtering (same as server config)
  beforeSend(event, hint) {
    // Scrub email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Scrub common secrets/tokens/keys
    const secretRegex = /(?:token|key|secret|password|auth|bearer|api[-_]?key)["\s:=]+([^\s"',}]+)/gi;
    
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
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
    }
    
    return event;
  },
  
  // Ignore common non-critical errors
  ignoreErrors: [
    "AbortError",
    "NetworkError",
    "Failed to fetch",
  ],
});

