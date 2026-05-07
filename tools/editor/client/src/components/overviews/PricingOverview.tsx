import React, { useEffect, useState } from 'react';
import {
  getPricingPackages,
  putPricingPackages,
  getPricingReference,
  putPricingReference,
  type PricingPackage,
  type PricingReference,
  type PricingRefCategory,
  type PricingRefRow,
} from '../../lib/api-client.ts';
import { useUIStore } from '../../store/ui.ts';

// ─── Styles ────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '24px 32px',
  background: 'var(--color-bg)',
};

const heading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 4,
};

const helpText: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
  marginBottom: 20,
  maxWidth: 720,
  lineHeight: 1.5,
};

const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 16,
  marginBottom: 16,
  maxWidth: 720,
};

const cardHighlight: React.CSSProperties = {
  ...card,
  borderColor: 'var(--color-accent)',
  borderWidth: 1,
  boxShadow: '0 0 0 1px var(--color-accent) inset',
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--color-border)',
};

const fieldRow: React.CSSProperties = {
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
  padding: '6px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 60,
  resize: 'vertical',
  lineHeight: 1.5,
};

const includesRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
};

const smallBtn: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 10px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const dangerBtn: React.CSSProperties = {
  ...smallBtn,
  color: '#f87171',
  borderColor: 'rgba(248, 113, 113, 0.3)',
};

const accentBtn: React.CSSProperties = {
  background: 'var(--color-accent)',
  border: 'none',
  color: '#fff',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 16px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const ghostBtn: React.CSSProperties = {
  ...smallBtn,
  padding: '6px 12px',
  fontSize: 12,
};

// ─── Empty factories ───────────────────────────────────────────────────────

function emptyPackage(): PricingPackage {
  return {
    name: 'New Package',
    price: 'Custom',
    desc: '',
    includes: [],
    cta: 'Get a Quote',
    href: '/contact/',
    highlight: false,
  };
}

function emptyRow(): PricingRefRow {
  return { code: '', item: '', value: '' };
}

function emptyCategory(): PricingRefCategory {
  return { title: 'New category', rows: [] };
}

// ─── Main component ────────────────────────────────────────────────────────

export function PricingOverview() {
  return (
    <div style={wrap}>
      <PackagesSection />
      <div style={{ height: 1, background: 'var(--color-border)', margin: '32px 0', maxWidth: 720 }} />
      <ReferenceSection />
    </div>
  );
}

// ─── Section 1: Packages (was the whole component before) ──────────────────

function PackagesSection() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [original, setOriginal] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const setError = useUIStore((s) => s.setError);

  useEffect(() => {
    getPricingPackages()
      .then((data) => {
        setPackages(data);
        setOriginal(data);
      })
      .catch(() => setError('Could not load pricing packages'))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(packages) !== JSON.stringify(original);

  function update(index: number, field: keyof PricingPackage, value: any) {
    setPackages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function updateInclude(pkgIndex: number, itemIndex: number, value: string) {
    setPackages((prev) =>
      prev.map((p, i) => {
        if (i !== pkgIndex) return p;
        const includes = [...p.includes];
        includes[itemIndex] = value;
        return { ...p, includes };
      })
    );
  }

  function addInclude(pkgIndex: number) {
    setPackages((prev) =>
      prev.map((p, i) => (i === pkgIndex ? { ...p, includes: [...p.includes, ''] } : p))
    );
  }

  function removeInclude(pkgIndex: number, itemIndex: number) {
    setPackages((prev) =>
      prev.map((p, i) =>
        i === pkgIndex ? { ...p, includes: p.includes.filter((_, j) => j !== itemIndex) } : p
      )
    );
  }

  function moveInclude(pkgIndex: number, itemIndex: number, dir: -1 | 1) {
    setPackages((prev) =>
      prev.map((p, i) => {
        if (i !== pkgIndex) return p;
        const includes = [...p.includes];
        const target = itemIndex + dir;
        if (target < 0 || target >= includes.length) return p;
        [includes[itemIndex], includes[target]] = [includes[target], includes[itemIndex]];
        return { ...p, includes };
      })
    );
  }

  function addPackage() {
    setPackages((prev) => [...prev, emptyPackage()]);
  }

  function removePackage(index: number) {
    if (!confirm(`Remove package "${packages[index].name}"? This cannot be undone (until you reload without saving).`)) return;
    setPackages((prev) => prev.filter((_, i) => i !== index));
  }

  function movePackage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= packages.length) return;
    setPackages((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await putPricingPackages(packages);
      setOriginal(packages);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save pricing packages');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!confirm('Discard unsaved changes?')) return;
    setPackages(original);
  }

  if (loading) {
    return <div style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>Loading packages…</div>;
  }

  return (
    <div>
      <div style={heading}>Pricing Packages</div>
      <p style={helpText}>
        The three cards at the top of <code>/pricing/</code>. Saved to <code>src/data/pricing-packages.json</code>.
        {' '}<strong>Tip:</strong> the layout is a 3-column grid — adding a 4th package will compress the cards on desktop.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <button
          style={{ ...accentBtn, opacity: isDirty && !saving ? 1 : 0.45, cursor: isDirty && !saving ? 'pointer' : 'default' }}
          onClick={handleSave}
          disabled={!isDirty || saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          style={{ ...ghostBtn, opacity: isDirty ? 1 : 0.5, cursor: isDirty ? 'pointer' : 'default' }}
          onClick={handleReset}
          disabled={!isDirty}
        >
          Reset
        </button>
        {savedFlash && (
          <span style={{ color: '#22c55e', fontSize: 11 }}>Saved</span>
        )}
        {isDirty && !saving && (
          <span style={{ color: '#f59e0b', fontSize: 11 }}>Unsaved changes</span>
        )}
      </div>

      {packages.map((pkg, idx) => (
        <div key={idx} style={pkg.highlight ? cardHighlight : card}>
          <div style={cardHeader}>
            <input
              style={{ ...inputStyle, fontSize: 14, fontWeight: 600, flex: 1 }}
              value={pkg.name}
              onChange={(e) => update(idx, 'name', e.target.value)}
              placeholder="Package name"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={pkg.highlight}
                onChange={(e) => update(idx, 'highlight', e.target.checked)}
              />
              Highlight
            </label>
            <button
              style={ghostBtn}
              onClick={() => movePackage(idx, -1)}
              disabled={idx === 0}
              title="Move up"
            >
              ↑
            </button>
            <button
              style={ghostBtn}
              onClick={() => movePackage(idx, 1)}
              disabled={idx === packages.length - 1}
              title="Move down"
            >
              ↓
            </button>
            <button style={dangerBtn} onClick={() => removePackage(idx)} title="Delete this package">
              Delete
            </button>
          </div>

          <div style={fieldRow}>
            <label style={labelStyle}>Price</label>
            <input
              style={inputStyle}
              value={pkg.price}
              onChange={(e) => update(idx, 'price', e.target.value)}
              placeholder='e.g. "from €5,000" or "Custom"'
            />
          </div>

          <div style={fieldRow}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={textareaStyle}
              value={pkg.desc}
              onChange={(e) => update(idx, 'desc', e.target.value)}
              placeholder="Short description shown under the price"
            />
          </div>

          <div style={fieldRow}>
            <label style={labelStyle}>Includes ({pkg.includes.length})</label>
            {pkg.includes.map((item, j) => (
              <div key={j} style={includesRow}>
                <input
                  style={inputStyle}
                  value={item}
                  onChange={(e) => updateInclude(idx, j, e.target.value)}
                  placeholder="Bullet point"
                />
                <button
                  style={ghostBtn}
                  onClick={() => moveInclude(idx, j, -1)}
                  disabled={j === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  style={ghostBtn}
                  onClick={() => moveInclude(idx, j, 1)}
                  disabled={j === pkg.includes.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button style={dangerBtn} onClick={() => removeInclude(idx, j)} title="Remove">
                  ✕
                </button>
              </div>
            ))}
            <button style={{ ...smallBtn, alignSelf: 'flex-start', marginTop: 4 }} onClick={() => addInclude(idx)}>
              + Add bullet
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...fieldRow, flex: 1 }}>
              <label style={labelStyle}>CTA Button Text</label>
              <input
                style={inputStyle}
                value={pkg.cta}
                onChange={(e) => update(idx, 'cta', e.target.value)}
                placeholder='e.g. "Get a Quote"'
              />
            </div>
            <div style={{ ...fieldRow, flex: 1 }}>
              <label style={labelStyle}>CTA Link (href)</label>
              <input
                style={inputStyle}
                value={pkg.href}
                onChange={(e) => update(idx, 'href', e.target.value)}
                placeholder="/contact/"
              />
            </div>
          </div>
        </div>
      ))}

      <button style={{ ...smallBtn, marginTop: 8 }} onClick={addPackage}>
        + Add package
      </button>
    </div>
  );
}

// ─── Section 2: Reference Pricing (line-item table) ────────────────────────

function ReferenceSection() {
  const [data, setData] = useState<PricingReference | null>(null);
  const [original, setOriginal] = useState<PricingReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const setError = useUIStore((s) => s.setError);

  useEffect(() => {
    getPricingReference()
      .then((d) => { setData(d); setOriginal(d); })
      .catch(() => setError('Could not load reference pricing'))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(data) !== JSON.stringify(original);

  function updateField(field: 'intro' | 'note', value: string) {
    setData((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateCategoryTitle(catIdx: number, value: string) {
    setData((prev) => prev ? {
      ...prev,
      categories: prev.categories.map((c, i) => i === catIdx ? { ...c, title: value } : c),
    } : prev);
  }

  function updateRow(catIdx: number, rowIdx: number, field: keyof PricingRefRow, value: string) {
    setData((prev) => prev ? {
      ...prev,
      categories: prev.categories.map((c, i) => {
        if (i !== catIdx) return c;
        return { ...c, rows: c.rows.map((r, j) => j === rowIdx ? { ...r, [field]: value } : r) };
      }),
    } : prev);
  }

  function addRow(catIdx: number) {
    setData((prev) => prev ? {
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIdx ? { ...c, rows: [...c.rows, emptyRow()] } : c
      ),
    } : prev);
  }

  function removeRow(catIdx: number, rowIdx: number) {
    setData((prev) => prev ? {
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIdx ? { ...c, rows: c.rows.filter((_, j) => j !== rowIdx) } : c
      ),
    } : prev);
  }

  function moveRow(catIdx: number, rowIdx: number, dir: -1 | 1) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((c, i) => {
          if (i !== catIdx) return c;
          const target = rowIdx + dir;
          if (target < 0 || target >= c.rows.length) return c;
          const rows = [...c.rows];
          [rows[rowIdx], rows[target]] = [rows[target], rows[rowIdx]];
          return { ...c, rows };
        }),
      };
    });
  }

  function addCategory() {
    setData((prev) => prev ? { ...prev, categories: [...prev.categories, emptyCategory()] } : prev);
  }

  function removeCategory(catIdx: number) {
    if (!data) return;
    if (!confirm(`Remove category "${data.categories[catIdx].title}" and all ${data.categories[catIdx].rows.length} rows?`)) return;
    setData((prev) => prev ? { ...prev, categories: prev.categories.filter((_, i) => i !== catIdx) } : prev);
  }

  function moveCategory(catIdx: number, dir: -1 | 1) {
    setData((prev) => {
      if (!prev) return prev;
      const target = catIdx + dir;
      if (target < 0 || target >= prev.categories.length) return prev;
      const categories = [...prev.categories];
      [categories[catIdx], categories[target]] = [categories[target], categories[catIdx]];
      return { ...prev, categories };
    });
  }

  function toggleCollapse(catIdx: number) {
    setCollapsed((prev) => ({ ...prev, [catIdx]: !prev[catIdx] }));
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      await putPricingReference(data);
      setOriginal(data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save reference pricing');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!confirm('Discard unsaved changes?')) return;
    setData(original);
  }

  if (loading) {
    return <div style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>Loading reference pricing…</div>;
  }
  if (!data) return null;

  return (
    <div>
      <div style={heading}>Reference Pricing</div>
      <p style={helpText}>
        The line-item price table below the package cards. Saved to <code>src/data/pricing-reference.json</code>.
        Each row has a code (e.g. <code>B1</code>), a description, and a price string.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <button
          style={{ ...accentBtn, opacity: isDirty && !saving ? 1 : 0.45, cursor: isDirty && !saving ? 'pointer' : 'default' }}
          onClick={handleSave}
          disabled={!isDirty || saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          style={{ ...ghostBtn, opacity: isDirty ? 1 : 0.5, cursor: isDirty ? 'pointer' : 'default' }}
          onClick={handleReset}
          disabled={!isDirty}
        >
          Reset
        </button>
        {savedFlash && <span style={{ color: '#22c55e', fontSize: 11 }}>Saved</span>}
        {isDirty && !saving && <span style={{ color: '#f59e0b', fontSize: 11 }}>Unsaved changes</span>}
      </div>

      {/* Intro */}
      <div style={{ ...card, padding: 12 }}>
        <div style={fieldRow}>
          <label style={labelStyle}>Intro paragraph (above the table)</label>
          <textarea
            style={textareaStyle}
            value={data.intro}
            onChange={(e) => updateField('intro', e.target.value)}
            placeholder="Short intro shown before the price table"
          />
        </div>
      </div>

      {/* Categories */}
      {data.categories.map((cat, catIdx) => {
        const isCollapsed = !!collapsed[catIdx];
        return (
          <div key={catIdx} style={card}>
            <div style={cardHeader}>
              <button
                onClick={() => toggleCollapse(catIdx)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14, padding: 0, width: 16 }}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? '▸' : '▾'}
              </button>
              <input
                style={{ ...inputStyle, fontSize: 13, fontWeight: 600, flex: 1 }}
                value={cat.title}
                onChange={(e) => updateCategoryTitle(catIdx, e.target.value)}
                placeholder="Category title"
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                {cat.rows.length} {cat.rows.length === 1 ? 'row' : 'rows'}
              </span>
              <button
                style={ghostBtn}
                onClick={() => moveCategory(catIdx, -1)}
                disabled={catIdx === 0}
                title="Move category up"
              >
                ↑
              </button>
              <button
                style={ghostBtn}
                onClick={() => moveCategory(catIdx, 1)}
                disabled={catIdx === data.categories.length - 1}
                title="Move category down"
              >
                ↓
              </button>
              <button style={dangerBtn} onClick={() => removeCategory(catIdx)} title="Delete this category">
                Delete
              </button>
            </div>

            {!isCollapsed && (
              <>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px auto auto auto', gap: 6, marginBottom: 4 }}>
                  <span style={labelStyle}>Code</span>
                  <span style={labelStyle}>Item</span>
                  <span style={labelStyle}>Value</span>
                  <span />
                  <span />
                  <span />
                </div>

                {/* Data rows */}
                {cat.rows.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 140px auto auto auto',
                      gap: 6,
                      marginBottom: 4,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                      value={row.code}
                      onChange={(e) => updateRow(catIdx, rowIdx, 'code', e.target.value)}
                      placeholder="A1"
                    />
                    <input
                      style={inputStyle}
                      value={row.item}
                      onChange={(e) => updateRow(catIdx, rowIdx, 'item', e.target.value)}
                      placeholder="Description"
                    />
                    <input
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                      value={row.value}
                      onChange={(e) => updateRow(catIdx, rowIdx, 'value', e.target.value)}
                      placeholder="€500"
                    />
                    <button
                      style={ghostBtn}
                      onClick={() => moveRow(catIdx, rowIdx, -1)}
                      disabled={rowIdx === 0}
                      title="Move row up"
                    >
                      ↑
                    </button>
                    <button
                      style={ghostBtn}
                      onClick={() => moveRow(catIdx, rowIdx, 1)}
                      disabled={rowIdx === cat.rows.length - 1}
                      title="Move row down"
                    >
                      ↓
                    </button>
                    <button style={dangerBtn} onClick={() => removeRow(catIdx, rowIdx)} title="Remove row">
                      ✕
                    </button>
                  </div>
                ))}

                <button style={{ ...smallBtn, marginTop: 6 }} onClick={() => addRow(catIdx)}>
                  + Add row
                </button>
              </>
            )}
          </div>
        );
      })}

      <button style={{ ...smallBtn, marginBottom: 16 }} onClick={addCategory}>
        + Add category
      </button>

      {/* Note */}
      <div style={{ ...card, padding: 12 }}>
        <div style={fieldRow}>
          <label style={labelStyle}>Footer note (below the table)</label>
          <textarea
            style={textareaStyle}
            value={data.note}
            onChange={(e) => updateField('note', e.target.value)}
            placeholder="Notes shown below the price table (VAT, payment terms, etc.)"
          />
        </div>
      </div>
    </div>
  );
}
