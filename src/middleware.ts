// src/middleware.ts
// Every page lives under src/pages/[lang]/…, so in dev (server mode) a URL
// like /nonexistent/ matches [lang]/index.astro with lang="nonexistent" and
// crashes on COPY[lang]. Rewrite anything with an unknown locale segment to
// the 404 page instead. In the static build this only runs for the paths
// getStaticPaths emits (all valid), so production behaviour is unchanged.
import { defineMiddleware } from 'astro:middleware';
import { LOCALES } from './lib/i18n';

export const onRequest = defineMiddleware((context, next) => {
  const lang = context.params.lang;
  if (lang !== undefined && !(LOCALES as readonly string[]).includes(lang)) {
    return context.rewrite('/404');
  }
  return next();
});
