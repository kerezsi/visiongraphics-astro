import React from 'react';
import type { BlockData } from '../../types/blocks.ts';
import { useDocumentStore } from '../../store/document.ts';
import { TextField } from './fields/TextField.tsx';
import { TextareaField } from './fields/TextareaField.tsx';
import { SelectField } from './fields/SelectField.tsx';
import { ImagePickerField } from './fields/ImagePickerField.tsx';
import { ArrayField } from './fields/ArrayField.tsx';
import { LocalizedTextField } from './fields/LocalizedTextField.tsx';
import type { LocalizedValue } from '../../lib/localized.ts';

interface Props {
  block: BlockData;
}

export function Inspector({ block }: Props) {
  const updateBlock = useDocumentStore((s) => s.updateBlock);

  function update(field: string, value: unknown) {
    updateBlock(block.id, { [field]: value });
  }

  const p = block.props as Record<string, unknown>;

  switch (block.type) {
    case 'SectionBanner':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ImagePickerField label="Image" value={p.image as string} onChange={(v) => update('image', v)} />
          <LocalizedTextField label="Label" value={p.label as LocalizedValue | undefined} onChange={(v) => update('label', v)} />
          <LocalizedTextField label="Title" value={p.title as LocalizedValue | undefined} onChange={(v) => update('title', v)} />
          <LocalizedTextField label="Image Alt" value={p.imageAlt as LocalizedValue | undefined} onChange={(v) => update('imageAlt', v)} />
          <SelectField
            label="Size"
            value={(p.size as string) ?? 'section'}
            options={[{ value: 'section', label: 'Section' }, { value: 'page', label: 'Page' }]}
            onChange={(v) => update('size', v)}
          />
          <SelectField
            label="Align"
            value={(p.align as string) ?? 'left'}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]}
            onChange={(v) => update('align', v)}
          />
          <SelectField
            label="Heading Level"
            value={(p.headingLevel as string) ?? 'h2'}
            options={[{ value: 'h1', label: 'H1' }, { value: 'h2', label: 'H2' }]}
            onChange={(v) => update('headingLevel', v)}
          />
        </div>
      );

    case 'heading':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="Text" value={p.text as string} onChange={(v) => update('text', v)} />
          <SelectField
            label="Level"
            value={p.level as string}
            options={[{ value: 'h2', label: 'H2' }, { value: 'h3', label: 'H3' }]}
            onChange={(v) => update('level', v)}
          />
          <TextField label="CSS Class" value={(p.className as string) ?? ''} onChange={(v) => update('className', v)} />
        </div>
      );

    case 'body-lead':
    case 'body-text':
    case 'section-label':
      return (
        <div style={{ padding: 12 }}>
          <TextareaField label="Text" value={p.text as string} onChange={(v) => update('text', v)} />
        </div>
      );

    case 'rich-text':
      return (
        <div style={{ padding: 12 }}>
          <TextareaField label="HTML" value={p.html as string} onChange={(v) => update('html', v)} rows={8} mono />
        </div>
      );

    case 'results-list':
      return (
        <div style={{ padding: 12 }}>
          <ArrayField
            label="Items"
            items={(p.items as string[]) ?? []}
            onChange={(items) => update('items', items)}
            renderItem={(item, onChange) => (
              <TextField label="" value={item as string} onChange={onChange} />
            )}
            defaultItem=""
          />
        </div>
      );

    case 'deliverable-grid':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SelectField
            label="Columns"
            value={String(p.columns ?? 2)}
            options={[{ value: '2', label: '2' }, { value: '3', label: '3' }]}
            onChange={(v) => update('columns', Number(v))}
          />
          <ArrayField
            label="Items"
            items={(p.items as Array<{ title: string; desc: string }>) ?? []}
            onChange={(items) => update('items', items)}
            renderItem={(item, onChange) => {
              const obj = item as { title: string; desc: string };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <TextField label="Title" value={obj.title} onChange={(v) => onChange({ ...obj, title: v })} />
                  <TextareaField label="Desc" value={obj.desc} onChange={(v) => onChange({ ...obj, desc: v })} />
                </div>
              );
            }}
            defaultItem={{ title: '', desc: '' }}
          />
        </div>
      );

    case 'timeline-table':
      return (
        <div style={{ padding: 12 }}>
          <ArrayField
            label="Rows"
            items={(p.rows as Array<{ scope: string; deliverables: string }>) ?? []}
            onChange={(rows) => update('rows', rows)}
            renderItem={(item, onChange) => {
              const obj = item as { scope: string; deliverables: string };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <TextField label="Scope" value={obj.scope} onChange={(v) => onChange({ ...obj, scope: v })} />
                  <TextField label="Deliverables" value={obj.deliverables} onChange={(v) => onChange({ ...obj, deliverables: v })} />
                </div>
              );
            }}
            defaultItem={{ scope: '', deliverables: '' }}
          />
        </div>
      );

    case 'notable-grid':
      return (
        <div style={{ padding: 12 }}>
          <ArrayField
            label="Items"
            items={(p.items as Array<{ name: string; year: string }>) ?? []}
            onChange={(items) => update('items', items)}
            renderItem={(item, onChange) => {
              const obj = item as { name: string; year: string };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <TextField label="Name" value={obj.name} onChange={(v) => onChange({ ...obj, name: v })} />
                  <TextField label="Year" value={obj.year} onChange={(v) => onChange({ ...obj, year: v })} />
                </div>
              );
            }}
            defaultItem={{ name: '', year: '' }}
          />
        </div>
      );

    case 'single-image':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ImagePickerField label="Image" value={p.src as string} onChange={(v) => update('src', v)} />
          <LocalizedTextField label="Alt Text" value={p.alt as LocalizedValue | undefined} onChange={(v) => update('alt', v)} />
          <LocalizedTextField label="Caption" value={p.caption as LocalizedValue | undefined} onChange={(v) => update('caption', v)} />
        </div>
      );

    case 'image-gallery': {
      const images = (p.images as Array<{ src: string; alt: string }>) ?? [];
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LocalizedTextField label="Title" value={p.title as LocalizedValue | undefined} onChange={(v) => update('title', v)} />
          <ArrayField
            label="Images"
            items={images}
            onChange={(items) => update('images', items)}
            renderItem={(item, onChange) => {
              const obj = item as { src: string; alt: string };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ImagePickerField label="Src" value={obj.src} onChange={(v) => onChange({ ...obj, src: v })} />
                  <TextField label="Alt" value={obj.alt} onChange={(v) => onChange({ ...obj, alt: v })} />
                </div>
              );
            }}
            defaultItem={{ src: '', alt: '' }}
          />
        </div>
      );
    }

    case 'image-compare': {
      const before = p.before as { src: string; alt: string; label?: string };
      const after = p.after as { src: string; alt: string; label?: string };
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 6, textTransform: 'uppercase' }}>Before</div>
            <ImagePickerField label="Src" value={before?.src ?? ''} onChange={(v) => update('before', { ...before, src: v })} />
            <div style={{ marginTop: 6 }}>
              <TextField label="Alt" value={before?.alt ?? ''} onChange={(v) => update('before', { ...before, alt: v })} />
            </div>
            <div style={{ marginTop: 6 }}>
              <TextField label="Label" value={before?.label ?? ''} onChange={(v) => update('before', { ...before, label: v })} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-faint)', marginBottom: 6, textTransform: 'uppercase' }}>After</div>
            <ImagePickerField label="Src" value={after?.src ?? ''} onChange={(v) => update('after', { ...after, src: v })} />
            <div style={{ marginTop: 6 }}>
              <TextField label="Alt" value={after?.alt ?? ''} onChange={(v) => update('after', { ...after, alt: v })} />
            </div>
            <div style={{ marginTop: 6 }}>
              <TextField label="Label" value={after?.label ?? ''} onChange={(v) => update('after', { ...after, label: v })} />
            </div>
          </div>
          <TextField label="Aspect Ratio" value={(p.aspectRatio as string) ?? '16 / 9'} onChange={(v) => update('aspectRatio', v)} />
        </div>
      );
    }

    case 'film-embed':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="Vimeo ID" value={p.vimeoId as string} onChange={(v) => update('vimeoId', v)} />
          <LocalizedTextField label="Title" value={p.title as LocalizedValue | undefined} onChange={(v) => update('title', v)} />
        </div>
      );

    case 'tour-360':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="URL" value={p.url as string} onChange={(v) => update('url', v)} />
          <LocalizedTextField label="Title" value={p.title as LocalizedValue | undefined} onChange={(v) => update('title', v)} />
          <ImagePickerField label="Cover Image" value={(p.coverImage as string) ?? ''} onChange={(v) => update('coverImage', v)} />
        </div>
      );

    case 'youtube-embed':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="URL" value={p.url as string} onChange={(v) => update('url', v)} />
          <LocalizedTextField label="Title" value={p.title as LocalizedValue | undefined} onChange={(v) => update('title', v)} />
        </div>
      );

    case 'button-group':
      return (
        <div style={{ padding: 12 }}>
          <ArrayField
            label="Buttons"
            items={(p.buttons as Array<{ label: string; href: string; variant: string }>) ?? []}
            onChange={(buttons) => update('buttons', buttons)}
            renderItem={(item, onChange) => {
              const obj = item as { label: string; href: string; variant: string };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <TextField label="Label" value={obj.label} onChange={(v) => onChange({ ...obj, label: v })} />
                  <TextField label="Href" value={obj.href} onChange={(v) => onChange({ ...obj, href: v })} />
                  <SelectField
                    label="Variant"
                    value={obj.variant}
                    options={[
                      { value: 'btn-primary', label: 'Primary' },
                      { value: 'btn-secondary', label: 'Secondary' },
                      { value: 'btn-ghost', label: 'Ghost' },
                    ]}
                    onChange={(v) => onChange({ ...obj, variant: v })}
                  />
                </div>
              );
            }}
            defaultItem={{ label: 'Button', href: '#', variant: 'btn-primary' }}
          />
        </div>
      );

    case 'sidebar-block':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="Label" value={p.label as string} onChange={(v) => update('label', v)} />
          <TextareaField label="Content" value={p.content as string} onChange={(v) => update('content', v)} />
        </div>
      );

    case 'diff-block':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="Label" value={p.label as string} onChange={(v) => update('label', v)} />
          <TextareaField label="Text" value={p.text as string} onChange={(v) => update('text', v)} />
        </div>
      );

    case 'cta-section':
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TextField label="Heading" value={p.heading as string} onChange={(v) => update('heading', v)} />
          <TextareaField label="Subtext" value={p.subtext as string} onChange={(v) => update('subtext', v)} />
          <TextField label="Button Label" value={p.buttonLabel as string} onChange={(v) => update('buttonLabel', v)} />
          <TextField label="Button Href" value={p.buttonHref as string} onChange={(v) => update('buttonHref', v)} />
        </div>
      );

    case 'section-container':
    case 'two-col':
    case 'service-body-grid':
      return (
        <div style={{ padding: 12, color: 'var(--color-text-faint)', fontSize: 12 }}>
          <p>This is a container block. Edit its children blocks by selecting them on the canvas.</p>
        </div>
      );

    default:
      return (
        <div style={{ padding: 12, color: 'var(--color-text-faint)', fontSize: 12 }}>
          No inspector for this block type.
        </div>
      );
  }
}
