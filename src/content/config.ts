import { defineCollection, z } from 'astro:content';

// ─── Category enum ───────────────────────────────────────────────
const categoryEnum = z.enum([
  'architectural-visualization',
  'residential',
  'commercial',
  'office',
  'airport',
  'infrastructure',
  'urban',
  'hospitality',
  'industrial',
  'product-visualization',
  'vr-experience',
  'animation',
  'exhibition',
  // Added to match WP projekt_topic taxonomy
  'education',
  'healthcare',
  'sports',
  'civic',
  'agriculture',
  'renovation',
  'transportation',
]);

// ─── Content blocks ───────────────────────────────────────────────
// Ordered array of interleaved text + media blocks for rich page body
const contentBlock = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    html: z.string(),
  }),
  z.object({
    type: z.literal('tour360'),
    url: z.string(),
    title: z.string().optional().default(''),
  }),
  z.object({
    type: z.literal('gallery'),
    title: z.string().optional().default(''),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional().default(''),
    })).default([]),
  }),
  z.object({
    type: z.literal('film'),
    vimeoId: z.string(),
    title: z.string().optional().default(''),
    duration: z.string().optional(),
  }),
  z.object({
    type: z.literal('youtube'),
    url: z.string(),
    title: z.string().optional().default(''),
  }),
]);

// ─── Vision-Tech collection ───────────────────────────────────────
const visionTech = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    image:       z.string(),            // /vision-tech/<slug>.jpg
    technique:   z.string().optional().default(''),  // Digital | AI-Enhanced | AI-Only | Hybrid | Traditional | '' = unassigned
    cost:        z.string(),            // €  €€  €€€  €€€€  €€€€€
    model3d:     z.string(),            // Output from 3D Model | etc.
    complexity:  z.string(),            // 1 - Basic | 2 - Intermediate | etc.
    reality:     z.string(),            // Pure Vision | Conceptual Reality | etc.
    purpose:     z.array(z.string()),   // Communication | Decision Support | etc.
    // Extended body paragraphs (scraped from dev site)
    body:        z.array(z.string()).default([]),
    // Gallery images for detail page
    gallery:     z.array(z.string()).default([]),
    // Categories of portfolio projects that typically use this technique
    relatedCategories: z.array(z.string()).default([]),
    // Feature tags used in portfolio filter
    relatedFeatures: z.array(z.string()).default([]),
    // Ordered content blocks (text + media, interleaved)
    blocks: z.array(contentBlock).optional(),
  }),
});

// ─── Projects collection ─────────────────────────────────────────
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title:        z.string(),
    displayTitle: z.string().optional(), // pretty combined title e.g. "KÖKI FoodPort"
    year:         z.number().int().min(1990).max(2030),
    client:       z.string().optional(), // client company name
    designer:     z.string().optional(), // architect / designer firm
    clientType:   z.string().optional(), // developer | architect | inventor | etc.
    location:     z.string().optional(),
    description:  z.string().optional(), // short, for cards + meta
    story:        z.string().optional(), // background narrative (multi-paragraph)
    tasks:        z.string().optional(), // what VG specifically did

    categories: z.array(categoryEnum).min(1),

    // Freeform strings — shown as filter pills
    // e.g. "360° Tour", "4K Animation", "AI-Enhanced", "VR Experience"
    features: z.array(z.string()).default([]),

    // Additional searchable tags (client sector, country, keywords)
    tags: z.array(z.string()).default([]),

    // Cover image path (relative to /public/)
    coverImage: z.string(),

    // Gallery images shown on detail page
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })).default([]),

    // Pano2VR 360 tours (hosted on visiongraphics.eu/PANO/...)
    tour360: z.array(z.object({
      title: z.string(),
      url:   z.string().url(),
    })).optional(),

    // YouTube / Vimeo video link
    video: z.string().optional(),

    // Vimeo films (structured)
    films: z.array(z.object({
      title:    z.string(),
      vimeoId:  z.string(),
      duration: z.string().optional(), // "3:42"
    })).optional(),

    // Connected vision-tech technique slugs
    techniques: z.array(z.string()).optional(),
    // Ordered content blocks (text + media, interleaved)
    blocks: z.array(contentBlock).optional(),

    featured:  z.boolean().default(false),
    published: z.boolean().default(true),
  }),
});

// ─── Articles (blog) collection ──────────────────────────────────
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    date:        z.date(),
    excerpt:     z.string(),
    tags:        z.array(z.string()).default([]),
    coverImage:  z.string().optional(),
    published:   z.boolean().default(true),
  }),
});

// ─── Exports ─────────────────────────────────────────────────────
export const collections = { projects, articles, 'vision-tech': visionTech };
