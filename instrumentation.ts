import * as Sentry from '@sentry/nextjs';
export async function register(){if(!process.env.SENTRY_DSN)return;Sentry.init({dsn:process.env.SENTRY_DSN,tracesSampleRate:0,sendDefaultPii:false,beforeSend(event){delete event.request;delete event.user;delete event.extra;delete event.breadcrumbs;return event;}});}
export const onRequestError = Sentry.captureRequestError;
