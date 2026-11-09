/**
 * Optional Sentry error tracking.
 * Set VITE_SENTRY_DSN (browser) and/or SENTRY_DSN (server) to enable.
 * No-ops when DSN is missing so local/dev stays zero-config.
 */

let initialized = false;

const SENTRY_MODULE = "@sentry/react";

export async function initSentryBrowser() {
  if (initialized || typeof window === "undefined") return;
  const dsn = (import.meta.env as Record<string, string | undefined>)["VITE_SENTRY_DSN"];
  if (!dsn) return;

  try {
    // @ts-ignore - optional dynamic import
    const Sentry = await import(/* @vite-ignore */ SENTRY_MODULE);
    Sentry.init({
      dsn,
      environment: (import.meta.env as Record<string, string | undefined>)["MODE"],
      tracesSampleRate: 0.15,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
    });
    initialized = true;
  } catch (err) {
    console.warn("[Sentry] browser init skipped:", err);
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const dsn = typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)["VITE_SENTRY_DSN"]
    : undefined;

  if (dsn) {
    // @ts-ignore - optional dynamic import
    void import(/* @vite-ignore */ SENTRY_MODULE)
      .then((Sentry: any) => {
        Sentry.withScope((scope: any) => {
          if (context) {
            for (const [k, v] of Object.entries(context)) {
              scope.setExtra(k, v);
            }
          }
          Sentry.captureException(error);
        });
      })
      .catch(() => {
        console.error("[Sentry fallback]", error, context);
      });
  } else {
    console.error("[AppError]", error, context);
  }
}
