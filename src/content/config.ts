import { defineCollection, reference, z } from 'astro:content';

// ─── Taxonomy collections ─────────────────────────────────────────
const categories = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

const designers = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

const clients = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

const clientTypes = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

const cities = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

const countries = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() }),
});

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
    technique:   z.enum(['Digital', 'AI-Enhanced', 'AI-Only', 'Hybrid', 'Traditional']).optional(),
    cost:        z.enum(['€', '€€', '€€€', '€€€€', '€€€€€']),
    model3d:     z.enum(['Output from 3D Model', 'Creation of 3D Model', 'Enhancement of 3D Model', 'No 3D Model Required']),
    complexity:  z.enum(['1 - Basic', '2 - Intermediate', '3 - Advanced', '4 - Expert', '5 - Cutting-Edge']),
    reality:     z.enum(['Pure Reality', 'Conceptual Reality', 'Hybrid Reality-Vision', 'Pure Vision']),
    purpose:     z.array(z.enum(['Communication', 'Decision Support', 'Documentation', 'Design Development', 'Technical Analysis'])),
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
    published: z.boolean().default(true),
  }),
});

// ─── Projects collection ─────────────────────────────────────────
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title:        z.string(),
    displayTitle: z.string().optional(), // pretty combined title e.g. "KÖKI FoodPort"
    year:         z.number().int().min(1990).max(2030),
    client:       reference('clients').optional(), // client company
    designer:     reference('designers').optional(), // architect / designer firm
    clientType:   reference('client-types').optional(),
    city:         reference('cities').optional(),
    country:      reference('countries').optional(),
    description:  z.string().optional(), // short, for cards + meta (SEO only)
    // Legacy fields — kept optional for pre-migration files; migration script moves them to MDX body
    story:        z.string().optional(),
    tasks:        z.string().optional(),

    categories: z.array(reference('categories')).min(1),

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
    // Connected service slugs (links project → service pages)
    services: z.array(z.string()).optional().default([]),
    // Ordered content blocks (text + media, interleaved)
    blocks: z.array(contentBlock).optional(),

    // Filter detection flags (manually set in editor, or populated by migration script)
    has360:  z.boolean().default(false),
    hasFilm: z.boolean().default(false),

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

// ─── Services collection ─────────────────────────────────────────
const services = defineCollection({
  type: 'content',
  schema: z.object({
    title:             z.string(),
    description:       z.string(),
    tagline:           z.string().optional(),
    bannerImage:       z.string().optional(),
    order:             z.number().optional(),
    published:         z.boolean().default(true),
    startRequirements: z.string().optional(), // sidebar "What you need to start"
    pricing:           z.string().optional(), // sidebar pricing info
    sidebarLabel:      z.string().optional(), // sidebar alternative label
    sidebarContent:    z.string().optional(), // sidebar alternative content
    // Linked vision-tech technique slugs — shown as chip row above related projects
    techniques:        z.array(z.string()).optional().default([]),
    // Connected service slugs (Keystatic writes this field; accepted here to avoid schema errors)
    services:          z.array(z.string()).optional().default([]),
    // Legacy blocks kept for compatibility during migration
    blocks:            z.array(z.any()).optional(),
  }),
});

// ─── Exports ─────────────────────────────────────────────────────
export const collections = {
  projects,
  articles,
  services,
  'vision-tech': visionTech,
  categories,
  designers,
  clients,
  'client-types': clientTypes,
  cities,
  countries,
};
