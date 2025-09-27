import * as Sentry from "@sentry/browser";

export const sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN;

if (sentryEnabled) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN as string,
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        release: import.meta.env.VITE_COMMIT_SHA as string | undefined,
        environment: import.meta.env.MODE,
    });
}

export { Sentry };
