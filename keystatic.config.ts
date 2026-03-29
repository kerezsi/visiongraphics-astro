import { config, collection, fields, component } from '@keystatic/core';

// ---------------------------------------------------------------------------
// Reusable MDX component schemas
// ---------------------------------------------------------------------------

const sectionBannerComponent = component({
  label: 'Section Banner',
  schema: {
    image: fields.text({ label: 'Image URL' }),
    label: fields.text({ label: 'Label (small caps above title)' }),
    title: fields.text({ label: 'Title' }),
  },
  preview: (props) => null,
});

const imageGalleryComponent = component({
  label: 'Image Gallery',
  schema: {
    images: fields.array(
      fields.object({
        src: fields.text({ label: 'Image URL' }),
        alt: fields.text({ label: 'Alt Text' }),
      }),
      { label: 'Images', itemLabel: (p) => p.fields.alt.value || 'Image' }
    ),
  },
  preview: (props) => null,
});

const imageCompareComponent = component({
  label: 'Image Compare (Before/After)',
  schema: {
    before: fields.text({ label: 'Before Image URL' }),
    after: fields.text({ label: 'After Image URL' }),
    label: fields.text({ label: 'Caption' }),
  },
  preview: (props) => null,
});

const tour360Component = component({
  label: '360° Tour',
  schema: {
    url: fields.text({ label: 'Tour URL' }),
    title: fields.text({ label: 'Title' }),
  },
  preview: (props) => null,
});

const filmEmbedComponent = component({
  label: 'Film (Vimeo)',
  schema: {
    vimeoId: fields.text({ label: 'Vimeo ID' }),
    title: fields.text({ label: 'Title' }),
    duration: fields.text({ label: 'Duration (e.g. 3:42)' }),
  },
  preview: (props) => null,
});

const youtubeEmbedComponent = component({
  label: 'YouTube Video',
  schema: {
    url: fields.text({ label: 'YouTube URL' }),
    title: fields.text({ label: 'Title' }),
  },
  preview: (props) => null,
});

// ---------------------------------------------------------------------------
// Keystatic config
// ---------------------------------------------------------------------------

export default config({
  storage: { kind: 'local' },

  collections: {
    // ─── Articles ─────────────────────────────────────────────────────────
    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/articles/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: (p) => p.value }
        ),
        coverImage: fields.text({ label: 'Cover Image URL' }),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
        content: fields.mdx({
          label: 'Content',
          components: {
            SectionBanner: sectionBannerComponent,
            ImageGallery: imageGalleryComponent,
            ImageCompare: imageCompareComponent,
          },
        }),
      },
    }),

    // ─── Services ─────────────────────────────────────────────────────────
    services: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/services/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Short Description', multiline: true }),
        tagline: fields.text({ label: 'Tagline' }),
        bannerImage: fields.text({ label: 'Banner Image URL' }),
        order: fields.integer({ label: 'Nav Order (1–7)', validation: { isRequired: true } }),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
        startRequirements: fields.text({ label: 'Sidebar: What You Need to Start', multiline: true }),
        pricing: fields.text({ label: 'Sidebar: Pricing', multiline: true }),
        sidebarLabel: fields.text({ label: 'Sidebar: Alternative Label' }),
        sidebarContent: fields.text({ label: 'Sidebar: Alternative Content', multiline: true }),
        content: fields.mdx({
          label: 'Body Content',
          components: {
            SectionBanner: sectionBannerComponent,
            ImageGallery: imageGalleryComponent,
          },
        }),
      },
    }),

    // ─── Projects ─────────────────────────────────────────────────────────
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        displayTitle: fields.text({ label: 'Display Title (optional combined title)' }),
        year: fields.integer({ label: 'Year', validation: { isRequired: true } }),
        description: fields.text({ label: 'Short Description', multiline: true }),
        story: fields.text({ label: 'Background Story', multiline: true }),
        tasks: fields.text({ label: 'What We Did', multiline: true }),
        coverImage: fields.text({ label: 'Cover Image URL' }),
        categories: fields.multiselect({
          label: 'Categories',
          options: [
            { label: 'Architectural Visualization', value: 'architectural-visualization' },
            { label: 'Residential', value: 'residential' },
            { label: 'Commercial', value: 'commercial' },
            { label: 'Office', value: 'office' },
            { label: 'Airport', value: 'airport' },
            { label: 'Infrastructure', value: 'infrastructure' },
            { label: 'Urban', value: 'urban' },
            { label: 'Hospitality', value: 'hospitality' },
            { label: 'Industrial', value: 'industrial' },
            { label: 'Product Visualization', value: 'product-visualization' },
            { label: 'VR Experience', value: 'vr-experience' },
            { label: 'Animation', value: 'animation' },
            { label: 'Exhibition', value: 'exhibition' },
          ],
        }),
        features: fields.array(
          fields.text({ label: 'Feature' }),
          { label: 'Features (filter tags)', itemLabel: (p) => p.value }
        ),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Additional Tags', itemLabel: (p) => p.value }
        ),
        // Reference fields
        client: fields.relationship({ label: 'Client', collection: 'clients' }),
        designer: fields.relationship({ label: 'Designer / Architect', collection: 'designers' }),
        city: fields.relationship({ label: 'City', collection: 'cities' }),
        country: fields.relationship({ label: 'Country', collection: 'countries' }),
        clientType: fields.relationship({ label: 'Client Type', collection: 'clientTypes' }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        published: fields.checkbox({ label: 'Published', defaultValue: true }),
        // MDX body: additional text, gallery images, 360 tours, films, video
        content: fields.mdx({
          label: 'Additional Content (images, tours, films)',
          components: {
            ImageGallery: imageGalleryComponent,
            Tour360: tour360Component,
            FilmEmbed: filmEmbedComponent,
            YoutubeEmbed: youtubeEmbedComponent,
          },
        }),
      },
    }),

    // ─── Vision-Tech ───────────────────────────────────────────────────────
    visionTech: collection({
      label: 'Technologies (Vision-Tech)',
      slugField: 'title',
      path: 'src/content/vision-tech/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        description: fields.text({ label: 'Short Description', multiline: true }),
        image: fields.text({ label: 'Image URL (/vision-tech/<slug>.jpg)' }),
        technique: fields.select({
          label: 'Technique',
          options: [
            { label: 'Digital', value: 'Digital' },
            { label: 'AI-Enhanced', value: 'AI-Enhanced' },
            { label: 'AI-Only', value: 'AI-Only' },
            { label: 'Hybrid', value: 'Hybrid' },
            { label: 'Traditional', value: 'Traditional' },
          ],
          defaultValue: 'Digital',
        }),
        cost: fields.select({
          label: 'Cost',
          options: [
            { label: '€', value: '€' },
            { label: '€€', value: '€€' },
            { label: '€€€', value: '€€€' },
            { label: '€€€€', value: '€€€€' },
            { label: '€€€€€', value: '€€€€€' },
          ],
          defaultValue: '€€',
        }),
        model3d: fields.select({
          label: '3D Model',
          options: [
            { label: 'Output from 3D Model', value: 'Output from 3D Model' },
            { label: 'Creation of 3D Model', value: 'Creation of 3D Model' },
            { label: 'Enhancement of 3D Model', value: 'Enhancement of 3D Model' },
            { label: 'No 3D Model Required', value: 'No 3D Model Required' },
          ],
          defaultValue: 'Output from 3D Model',
        }),
        complexity: fields.select({
          label: 'Complexity',
          options: [
            { label: '1 - Basic', value: '1 - Basic' },
            { label: '2 - Intermediate', value: '2 - Intermediate' },
            { label: '3 - Advanced', value: '3 - Advanced' },
            { label: '4 - Expert', value: '4 - Expert' },
            { label: '5 - Cutting-Edge', value: '5 - Cutting-Edge' },
          ],
          defaultValue: '2 - Intermediate',
        }),
        reality: fields.select({
          label: 'Reality',
          options: [
            { label: 'Pure Reality', value: 'Pure Reality' },
            { label: 'Conceptual Reality', value: 'Conceptual Reality' },
            { label: 'Hybrid Reality-Vision', value: 'Hybrid Reality-Vision' },
            { label: 'Pure Vision', value: 'Pure Vision' },
          ],
          defaultValue: 'Conceptual Reality',
        }),
        purpose: fields.multiselect({
          label: 'Purpose',
          options: [
            { label: 'Communication', value: 'Communication' },
            { label: 'Decision Support', value: 'Decision Support' },
            { label: 'Documentation', value: 'Documentation' },
            { label: 'Design Development', value: 'Design Development' },
            { label: 'Technical Analysis', value: 'Technical Analysis' },
          ],
        }),
        relatedCategories: fields.array(
          fields.text({ label: 'Category' }),
          { label: 'Related Categories', itemLabel: (p) => p.value }
        ),
        relatedFeatures: fields.array(
          fields.text({ label: 'Feature' }),
          { label: 'Related Features', itemLabel: (p) => p.value }
        ),
        content: fields.mdx({
          label: 'Body Content',
          components: {
            ImageGallery: imageGalleryComponent,
          },
        }),
      },
    }),

    // ─── Reference Collections ─────────────────────────────────────────────
    clients: collection({
      label: 'Clients',
      slugField: 'title',
      path: 'src/content/clients/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),

    designers: collection({
      label: 'Designers / Architects',
      slugField: 'title',
      path: 'src/content/designers/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),

    cities: collection({
      label: 'Cities',
      slugField: 'title',
      path: 'src/content/cities/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),

    countries: collection({
      label: 'Countries',
      slugField: 'title',
      path: 'src/content/countries/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),

    clientTypes: collection({
      label: 'Client Types',
      slugField: 'title',
      path: 'src/content/client-types/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),

    categories: collection({
      label: 'Categories',
      slugField: 'title',
      path: 'src/content/categories/*',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ name: { label: 'Name' } }),
      },
    }),
  },
});
