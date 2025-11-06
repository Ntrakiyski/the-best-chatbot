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
  
  // Performance monitoring for server-side
  profilesSampleRate: 0.0, // Disabled initially; can be enabled later
  
  // Enable console logging integration to capture existing logger output
  integrations: [
    Sentry.consoleIntegration({
      // Capture console.error, console.warn, and console.log
      levels: ["error", "warn"],
    }),
  ],
  
  // PII scrubbing and filtering
  beforeSend(event, hint) {
    // Scrub email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Scrub common secrets/tokens/keys
    const secretRegex = /(?:token|key|secret|password|auth|bearer|api[-_]?key)["\s:=]+([^\s"',}]+)/gi;
    
    // Scrub chat content patterns (messages, prompts, completions)
    const chatContentRegex = /(?:message|prompt|completion|content)["\s:=]+([^\s"',}]{50,})/gi;
    
    const scrubString = (str: string): string => {
      return str
        .replace(emailRegex, "[REDACTED_EMAIL]")
        .replace(secretRegex, (match, p1) => match.replace(p1, "[REDACTED]"))
        .replace(chatContentRegex, (match, p1) => match.replace(p1, "[REDACTED_CONTENT]"));
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
        if (exception.stacktrace?.frames) {
          exception.stacktrace.frames = exception.stacktrace.frames.map((frame) => {
            if (frame.vars) {
              // Redact variable values that might contain sensitive data
              Object.keys(frame.vars).forEach((key) => {
                if (typeof frame.vars![key] === "string") {
                  frame.vars![key] = scrubString(frame.vars![key]);
                }
              });
            }
            return frame;
          });
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
        if (typeof event.request.data === "string") {
          event.request.data = scrubString(event.request.data);
        } else {
          event.request.data = scrubString(JSON.stringify(event.request.data));
        }
      }
      // Remove cookies and headers that might contain auth tokens
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
    }
    
    // Scrub contexts
    if (event.contexts) {
      Object.keys(event.contexts).forEach((contextKey) => {
        const context = event.contexts![contextKey];
        if (context && typeof context === "object") {
          Object.keys(context).forEach((key) => {
            if (typeof context[key] === "string") {
              context[key] = scrubString(context[key]);
            }
          });
        }
      });
    }
    
    return event;
  },
  
  // Ignore common non-critical errors
  ignoreErrors: [
    // Database connection errors that are expected during restarts
    "ECONNREFUSED",
    "ENOTFOUND",
    // User abort errors
    "AbortError",
    "AbortController",
    // AI SDK expected errors
    "LoadAPIKeyError",
  ],
});

