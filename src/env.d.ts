/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Active locale for the request, set by page templates from Astro.params.lang. */
    lang?: import('./lib/i18n').Locale;
    /** Content collection type — used by media components to pick default labels. */
    pageType?: 'portfolio' | 'service' | 'article' | 'vision-tech';
  }
}
