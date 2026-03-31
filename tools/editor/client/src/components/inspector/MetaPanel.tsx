import React from 'react';
import { useDocumentStore } from '../../store/document.ts';
import { TextField } from './fields/TextField.tsx';
import { TextareaField } from './fields/TextareaField.tsx';
import { ImagePickerField } from './fields/ImagePickerField.tsx';
import { ArrayField } from './fields/ArrayField.tsx';
import { ReferenceField } from './fields/ReferenceField.tsx';
import { MultiReferenceField } from './fields/MultiReferenceField.tsx';

const sectionStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
  padding: '10px 12px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  marginBottom: 8,
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionLabel}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function BooleanField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: 12, height: 12 }} />
      {label}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--color-text-faint)', display: 'block', marginBottom: 3 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '4px 8px', fontSize: 11, boxSizing: 'border-box' }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiSelectField({ label, value, options, onChange }: {
  label: string;
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--color-text-faint)', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            style={{
              background: value.includes(o) ? 'var(--color-accent)' : 'var(--color-surface-2)',
              border: '1px solid ' + (value.includes(o) ? 'var(--color-accent)' : 'var(--color-border)'),
              color: value.includes(o) ? '#fff' : 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 7px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Project meta form
// ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'architectural-visualization', 'residential', 'commercial', 'office',
  'airport', 'infrastructure', 'urban', 'hospitality', 'industrial',
  'product-visualization', 'vr-experience', 'animation', 'exhibition',
];

function ProjectMetaForm() {
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const setMeta = useDocumentStore((s) => s.setMeta);

  function set(key: string, value: unknown) {
    setMeta({ [key]: value });
  }

  const categories  = (meta.categories  as string[]) ?? [];
  const features    = (meta.features    as string[]) ?? [];
  const tags        = (meta.tags        as string[]) ?? [];
  const techniques  = (meta.techniques  as string[]) ?? [];

  return (
    <>
      <Section label="Identity">
        <TextField label="Title" value={(meta.title as string) ?? ''} onChange={(v) => set('title', v)} />
        <TextField label="Display Title" value={(meta.displayTitle as string) ?? ''} onChange={(v) => set('displayTitle', v || undefined)} />
        <TextField label="Year" value={String(meta.year ?? '')} onChange={(v) => set('year', Number(v) || meta.year)} />
        <ImagePickerField label="Cover Image" value={(meta.coverImage as string) ?? ''} onChange={(v) => set('coverImage', v)} />
      </Section>

      <Section label="Client & Location">
        <ReferenceField label="Client" collection="clients" value={(meta.client as string) ?? undefined} onChange={(v) => set('client', v)} />
        <ReferenceField label="Designer" collection="designers" value={(meta.designer as string) ?? undefined} onChange={(v) => set('designer', v)} />
        <ReferenceField label="Client Type" collection="client-types" value={(meta.clientType as string) ?? undefined} onChange={(v) => set('clientType', v)} />
        <ReferenceField label="City" collection="cities" value={(meta.city as string) ?? undefined} onChange={(v) => set('city', v)} />
        <ReferenceField label="Country" collection="countries" value={(meta.country as string) ?? undefined} onChange={(v) => set('country', v)} />
      </Section>

      <Section label="Description">
        <TextareaField label="Short description" value={(meta.description as string) ?? ''} onChange={(v) => set('description', v || undefined)} rows={2} />
        <TextareaField label="Story / Background" value={(meta.story as string) ?? ''} onChange={(v) => set('story', v || undefined)} rows={3} />
        <TextareaField label="Tasks (what VG did)" value={(meta.tasks as string) ?? ''} onChange={(v) => set('tasks', v || undefined)} rows={3} />
      </Section>

      <Section label="Taxonomy">
        <MultiSelectField label="Categories" value={categories} options={CATEGORIES} onChange={(v) => set('categories', v)} />
        <ArrayField label="Features" items={features} onChange={(items) => set('features', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
        <ArrayField label="Tags" items={tags} onChange={(items) => set('tags', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
        <ArrayField label="Techniques (vision-tech slugs)" items={techniques} onChange={(items) => set('techniques', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
      </Section>

      <Section label="Flags">
        <BooleanField label="Published" value={(meta.published as boolean) ?? false} onChange={(v) => set('published', v)} />
        <BooleanField label="Featured" value={(meta.featured as boolean) ?? false} onChange={(v) => set('featured', v)} />
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Article meta form
// ─────────────────────────────────────────────────────────────────

function ArticleMetaForm() {
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const setMeta = useDocumentStore((s) => s.setMeta);

  function set(key: string, value: unknown) {
    setMeta({ [key]: value });
  }

  const tags = (meta.tags as string[]) ?? [];

  return (
    <>
      <Section label="Identity">
        <TextField label="Title" value={(meta.title as string) ?? ''} onChange={(v) => set('title', v)} />
        <TextField label="Date (YYYY-MM-DD)" value={(meta.date as string) ?? ''} onChange={(v) => set('date', v)} />
        <ImagePickerField label="Cover Image" value={(meta.coverImage as string) ?? ''} onChange={(v) => set('coverImage', v)} />
      </Section>

      <Section label="Content">
        <TextareaField label="Excerpt" value={(meta.excerpt as string) ?? ''} onChange={(v) => set('excerpt', v)} rows={3} />
        <ArrayField label="Tags" items={tags} onChange={(items) => set('tags', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
      </Section>

      <Section label="Flags">
        <BooleanField label="Published" value={(meta.published as boolean) ?? false} onChange={(v) => set('published', v)} />
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Service meta form
// ─────────────────────────────────────────────────────────────────

function ServiceMetaForm() {
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const setMeta = useDocumentStore((s) => s.setMeta);

  function set(key: string, value: unknown) {
    setMeta({ [key]: value });
  }

  return (
    <>
      <Section label="Identity">
        <TextField label="Title" value={(meta.title as string) ?? ''} onChange={(v) => set('title', v)} />
        <TextField label="Tagline" value={(meta.tagline as string) ?? ''} onChange={(v) => set('tagline', v || undefined)} />
        <TextField label="Order" value={String(meta.order ?? '')} onChange={(v) => set('order', v ? Number(v) : undefined)} />
        <ImagePickerField label="Banner Image" value={(meta.bannerImage as string) ?? ''} onChange={(v) => set('bannerImage', v || undefined)} />
      </Section>

      <Section label="Content">
        <TextareaField label="Description" value={(meta.description as string) ?? ''} onChange={(v) => set('description', v)} rows={3} />
      </Section>

      <Section label="Sidebar">
        <TextField label="Sidebar Label" value={(meta.sidebarLabel as string) ?? ''} onChange={(v) => set('sidebarLabel', v || undefined)} />
        <TextareaField label="Sidebar Content" value={(meta.sidebarContent as string) ?? ''} onChange={(v) => set('sidebarContent', v || undefined)} rows={2} />
        <TextareaField label="Start Requirements" value={(meta.startRequirements as string) ?? ''} onChange={(v) => set('startRequirements', v || undefined)} rows={2} />
        <TextareaField label="Pricing" value={(meta.pricing as string) ?? ''} onChange={(v) => set('pricing', v || undefined)} rows={2} />
      </Section>

      <Section label="Flags">
        <BooleanField label="Published" value={(meta.published as boolean) ?? false} onChange={(v) => set('published', v)} />
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Vision-tech meta form
// ─────────────────────────────────────────────────────────────────

const VT_TECHNIQUE   = ['Digital', 'AI-Enhanced', 'AI-Only', 'Hybrid', 'Traditional'];
const VT_COST        = ['€', '€€', '€€€', '€€€€', '€€€€€'];
const VT_MODEL3D     = ['Output from 3D Model', 'Creation of 3D Model', 'Enhancement of 3D Model', 'No 3D Model Required'];
const VT_COMPLEXITY  = ['1 - Basic', '2 - Intermediate', '3 - Advanced', '4 - Expert', '5 - Cutting-Edge'];
const VT_REALITY     = ['Pure Reality', 'Conceptual Reality', 'Hybrid Reality-Vision', 'Pure Vision'];
const VT_PURPOSE     = ['Communication', 'Decision Support', 'Documentation', 'Design Development', 'Technical Analysis'];
const VT_CATEGORIES  = [
  'architectural-visualization', 'residential', 'commercial', 'office',
  'airport', 'infrastructure', 'urban', 'hospitality', 'industrial',
  'product-visualization', 'vr-experience', 'animation', 'exhibition',
];

function VisionTechMetaForm() {
  const meta = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const setMeta = useDocumentStore((s) => s.setMeta);

  function set(key: string, value: unknown) {
    setMeta({ [key]: value });
  }

  const purpose           = (meta.purpose           as string[]) ?? [];
  const gallery           = (meta.gallery           as string[]) ?? [];
  const relatedCategories = (meta.relatedCategories as string[]) ?? [];
  const relatedFeatures   = (meta.relatedFeatures   as string[]) ?? [];

  return (
    <>
      <Section label="Identity">
        <TextField label="Title" value={(meta.title as string) ?? ''} onChange={(v) => set('title', v)} />
        <TextareaField label="Description" value={(meta.description as string) ?? ''} onChange={(v) => set('description', v)} rows={2} />
        <ImagePickerField label="Hero Image" value={(meta.image as string) ?? ''} onChange={(v) => set('image', v)} />
      </Section>

      <Section label="Classification">
        <SelectField label="Technique" value={(meta.technique as string) ?? VT_TECHNIQUE[0]} options={VT_TECHNIQUE} onChange={(v) => set('technique', v)} />
        <SelectField label="Cost" value={(meta.cost as string) ?? '€'} options={VT_COST} onChange={(v) => set('cost', v)} />
        <SelectField label="3D Model" value={(meta.model3d as string) ?? VT_MODEL3D[0]} options={VT_MODEL3D} onChange={(v) => set('model3d', v)} />
        <SelectField label="Complexity" value={(meta.complexity as string) ?? VT_COMPLEXITY[0]} options={VT_COMPLEXITY} onChange={(v) => set('complexity', v)} />
        <SelectField label="Reality" value={(meta.reality as string) ?? VT_REALITY[0]} options={VT_REALITY} onChange={(v) => set('reality', v)} />
        <MultiSelectField label="Purpose" value={purpose} options={VT_PURPOSE} onChange={(v) => set('purpose', v)} />
      </Section>

      <Section label="Gallery">
        <ArrayField label="Gallery Images (paths)" items={gallery} onChange={(items) => set('gallery', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
      </Section>

      <Section label="Related">
        <MultiSelectField label="Related Categories" value={relatedCategories} options={VT_CATEGORIES} onChange={(v) => set('relatedCategories', v)} />
        <ArrayField label="Related Features" items={relatedFeatures} onChange={(items) => set('relatedFeatures', items)}
          renderItem={(item, onChange) => <TextField label="" value={item as string} onChange={onChange} />}
          defaultItem=""
        />
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Static .astro page meta form
// ─────────────────────────────────────────────────────────────────

function PageMetaForm() {
  const meta    = useDocumentStore((s) => s.meta) as Record<string, unknown>;
  const setMeta = useDocumentStore((s) => s.setMeta);
  const slug    = useDocumentStore((s) => s.slug);
  const filePath = useDocumentStore((s) => s.filePath);

  return (
    <>
      <Section label="Page">
        <TextField
          label="Title / Slug"
          value={(meta.title as string) ?? slug}
          onChange={(v) => setMeta({ title: v })}
        />
        <div style={{ fontSize: 10, color: 'var(--color-text-faint)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text-muted)' }}>File:</strong>{' '}
          {filePath || '—'}
        </div>
      </Section>

      <Section label="Notes">
        <p style={{ fontSize: 10, color: 'var(--color-text-faint)', lineHeight: 1.6, margin: 0 }}>
          This is a static <code style={{ fontSize: 10 }}>.astro</code> page.
          The script section, layout wrapper, and any HTML outside the block
          zone are preserved on save.
        </p>
        <p style={{ fontSize: 10, color: 'var(--color-text-faint)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--color-text-muted)' }}>SectionBanner</strong> blocks
          are editable (image, label, title, and other props).
          HTML sections between banners appear as{' '}
          <strong style={{ color: 'var(--color-text-muted)' }}>Rich Text</strong> blocks —
          edit them in the inspector to change the raw markup.
        </p>
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main export — picks the right form by pageType
// ─────────────────────────────────────────────────────────────────

export function MetaPanel() {
  const pageType = useDocumentStore((s) => s.pageType);

  switch (pageType) {
    case 'project':     return <ProjectMetaForm />;
    case 'article':     return <ArticleMetaForm />;
    case 'service':     return <ServiceMetaForm />;
    case 'vision-tech': return <VisionTechMetaForm />;
    case 'page':        return <PageMetaForm />;
    default:            return <ArticleMetaForm />;
  }
}
