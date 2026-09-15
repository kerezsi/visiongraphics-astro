// /pricing.json — the public price feed. Built from src/data/pricing.json via
// publicView(): list, public presets with computed totals, the AI self-serve
// subset. Internal multipliers stay out. ai.visiongraphics.eu fetches this at
// page load (CORS header in public/_headers); Cloudflare rebuilds it on every
// production promote, so a Save + Publish in the pricing admin updates both sites.
import type { APIRoute } from 'astro';
import raw from '../data/pricing.json';
import { publicView, type PricingData } from '../lib/pricing.mjs';

const data = raw as unknown as PricingData;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(publicView(data)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
