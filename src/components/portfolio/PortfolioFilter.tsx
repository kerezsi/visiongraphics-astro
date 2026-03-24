// src/components/portfolio/PortfolioFilter.tsx
// React island — ALL filtering logic lives here
// Receives all project data as props at build time (no API calls)

import { useState, useEffect, useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────
export interface ProjectMeta {
  slug:        string;
  title:       string;
  year:        number;
  client?:     string;
  location?:   string;
  description?: string;
  categories:  string[];
  features:    string[];
  tags:        string[];
  coverImage:  string;
  featured:    boolean;
  has360:      boolean;
  hasFilm:     boolean;
}

interface Props {
  projects: ProjectMeta[];
  minYear:  number;
  maxYear:  number;
}

// ─── Category labels (display names) ─────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  'architectural-visualization': 'Architectural',
  'residential':                 'Residential',
  'commercial':                  'Commercial',
  'office':                      'Office',
  'airport':                     'Airport',
  'infrastructure':              'Infrastructure',
  'urban':                       'Urban',
  'hospitality':                 'Hospitality',
  'industrial':                  'Industrial',
  'product-visualization':       'Product',
  'vr-experience':               'VR',
  'animation':                   'Animation',
  'exhibition':                  'Exhibition',
};

type SortOption = 'newest' | 'oldest' | 'az';

// ─── URL param helpers ────────────────────────────────────────────
function getParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function setParams(params: URLSearchParams) {
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', params.toString() ? url : window.location.pathname);
}

// ─── Main Component ───────────────────────────────────────────────
export default function PortfolioFilter({ projects, minYear, maxYear }: Props) {
  // ── Derive available filter options from data ──
  const allCategories = useMemo(() =>
    [...new Set(projects.flatMap(p => p.categories))].sort(),
    [projects]
  );
  const allFeatures = useMemo(() =>
    [...new Set(projects.flatMap(p => p.features))].sort(),
    [projects]
  );

  // ── Filter state ──
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFeatures,   setSelectedFeatures]   = useState<string[]>([]);
  const [yearRange,          setYearRange]          = useState<[number, number]>([minYear, maxYear]);
  const [searchText,         setSearchText]         = useState('');
  const [only360,            setOnly360]            = useState(false);
  const [onlyFilm,           setOnlyFilm]           = useState(false);
  const [sort,               setSort]               = useState<SortOption>('newest');
  const [searchDebounced,    setSearchDebounced]    = useState('');

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchText), 200);
    return () => clearTimeout(t);
  }, [searchText]);

  // ── Read URL params on mount ──
  useEffect(() => {
    const p = getParams();
    if (p.get('cat'))    setSelectedCategories(p.get('cat')!.split(',').filter(Boolean));
    if (p.get('feat'))   setSelectedFeatures(p.get('feat')!.split(',').filter(Boolean));
    if (p.get('q'))      setSearchText(p.get('q')!);
    if (p.get('360'))    setOnly360(true);
    if (p.get('film'))   setOnlyFilm(true);
    if (p.get('sort'))   setSort(p.get('sort') as SortOption);
    if (p.get('ymin') && p.get('ymax')) {
      setYearRange([parseInt(p.get('ymin')!), parseInt(p.get('ymax')!)]);
    }
  }, []);

  // ── Write URL params on change ──
  useEffect(() => {
    const p = new URLSearchParams();
    if (selectedCategories.length) p.set('cat',  selectedCategories.join(','));
    if (selectedFeatures.length)   p.set('feat', selectedFeatures.join(','));
    if (searchDebounced)           p.set('q',    searchDebounced);
    if (only360)                   p.set('360',  '1');
    if (onlyFilm)                  p.set('film', '1');
    if (sort !== 'newest')         p.set('sort', sort);
    if (yearRange[0] !== minYear)  p.set('ymin', String(yearRange[0]));
    if (yearRange[1] !== maxYear)  p.set('ymax', String(yearRange[1]));
    setParams(p);
  }, [selectedCategories, selectedFeatures, searchDebounced, only360, onlyFilm, sort, yearRange]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let result = projects.filter(p => {
      if (selectedCategories.length && !selectedCategories.some(c => p.categories.includes(c))) return false;
      if (selectedFeatures.length   && !selectedFeatures.some(f => p.features.includes(f)))     return false;
      if (p.year < yearRange[0] || p.year > yearRange[1])                                        return false;
      if (only360  && !p.has360)                                                                  return false;
      if (onlyFilm && !p.hasFilm)                                                                 return false;
      if (searchDebounced) {
        const q = searchDebounced.toLowerCase();
        const searchable = [p.title, p.client, p.location, ...p.tags].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sort === 'newest') return b.year - a.year;
      if (sort === 'oldest') return a.year - b.year;
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [projects, selectedCategories, selectedFeatures, yearRange, only360, onlyFilm, searchDebounced, sort]);

  // ── Helpers ──
  const isActive = useCallback((arr: string[], val: string) => arr.includes(val), []);

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const hasActiveFilters =
    selectedCategories.length || selectedFeatures.length ||
    only360 || onlyFilm || searchText ||
    yearRange[0] !== minYear || yearRange[1] !== maxYear;

  const resetAll = () => {
    setSelectedCategories([]);
    setSelectedFeatures([]);
    setYearRange([minYear, maxYear]);
    setSearchText('');
    setOnly360(false);
    setOnlyFilm(false);
    setSort('newest');
  };

  // ── Render ──
  return (
    <div className="pf-root">

      {/* ── Controls ── */}
      <div className="pf-controls">

        {/* Search */}
        <div className="pf-search-row">
          <div className="pf-search-wrap">
            <svg className="pf-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              className="pf-search"
              placeholder="Search by project, client, location…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              aria-label="Search projects"
            />
            {searchText && (
              <button className="pf-search-clear" onClick={() => setSearchText('')} aria-label="Clear search">×</button>
            )}
          </div>

          {/* Sort */}
          <select
            className="pf-sort"
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            aria-label="Sort projects"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A – Z</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="pf-filter-group">
          <span className="pf-filter-label">Category</span>
          <div className="pf-pills">
            {allCategories.map(cat => (
              <button
                key={cat}
                className={`pf-pill ${isActive(selectedCategories, cat) ? 'active' : ''}`}
                onClick={() => toggle(selectedCategories, cat, setSelectedCategories)}
                aria-pressed={isActive(selectedCategories, cat)}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <div className="pf-filter-group">
          <span className="pf-filter-label">Output type</span>
          <div className="pf-pills">
            {allFeatures.map(feat => (
              <button
                key={feat}
                className={`pf-pill ${isActive(selectedFeatures, feat) ? 'active' : ''}`}
                onClick={() => toggle(selectedFeatures, feat, setSelectedFeatures)}
                aria-pressed={isActive(selectedFeatures, feat)}
              >
                {feat}
              </button>
            ))}
          </div>
        </div>

        {/* Year range + toggles row */}
        <div className="pf-bottom-row">
          <div className="pf-year-range">
            <span className="pf-filter-label">Year</span>
            <div className="pf-year-inputs">
              <input
                type="number"
                className="pf-year-input"
                min={minYear} max={yearRange[1]}
                value={yearRange[0]}
                onChange={e => setYearRange([parseInt(e.target.value), yearRange[1]])}
                aria-label="From year"
              />
              <span className="pf-year-sep">–</span>
              <input
                type="number"
                className="pf-year-input"
                min={yearRange[0]} max={maxYear}
                value={yearRange[1]}
                onChange={e => setYearRange([yearRange[0], parseInt(e.target.value)])}
                aria-label="To year"
              />
            </div>
          </div>

          <div className="pf-toggles">
            <button
              className={`pf-toggle ${only360 ? 'active' : ''}`}
              onClick={() => setOnly360(!only360)}
              aria-pressed={only360}
            >
              360° Tour
            </button>
            <button
              className={`pf-toggle ${onlyFilm ? 'active' : ''}`}
              onClick={() => setOnlyFilm(!onlyFilm)}
              aria-pressed={onlyFilm}
            >
              Film
            </button>
          </div>

          {/* Results count + reset */}
          <div className="pf-meta">
            <span className="pf-count">
              {filtered.length === projects.length
                ? `${projects.length} projects`
                : `${filtered.length} of ${projects.length}`}
            </span>
            {hasActiveFilters && (
              <button className="pf-reset" onClick={resetAll}>
                Reset filters
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="pf-grid">
          {filtered.map(project => (
            <a key={project.slug} href={`/portfolio/${project.slug}/`} className="pf-card">
              <div className="pf-card-image">
                <img
                  src={project.coverImage}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                />
                <div className="pf-card-badges">
                  {project.has360  && <span className="pf-badge">360°</span>}
                  {project.hasFilm && <span className="pf-badge">Film</span>}
                </div>
              </div>
              <div className="pf-card-body">
                <div className="pf-card-meta">
                  <span className="pf-cat-tag">
                    {CATEGORY_LABELS[project.categories[0]] ?? project.categories[0]}
                  </span>
                  <span className="pf-card-year">{project.year}</span>
                </div>
                <h3 className="pf-card-title">{project.title}</h3>
                {(project.client || project.location) && (
                  <p className="pf-card-sub">{project.client || project.location}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="pf-empty">
          <p>No projects match those filters.</p>
          <button className="pf-reset-large" onClick={resetAll}>
            Reset all filters
          </button>
        </div>
      )}

    </div>
  );
}

// ─── Styles (injected as a style tag — Astro will extract) ────────
const styles = `
.pf-root { width: 100%; }

/* Controls */
.pf-controls {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pf-search-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.pf-search-wrap {
  position: relative;
  flex: 1;
}

.pf-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-text-faint);
  pointer-events: none;
}

.pf-search {
  width: 100%;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 2rem 0.6rem 2.25rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 200ms ease;
}

.pf-search::placeholder { color: var(--color-text-faint); }
.pf-search:focus { border-color: var(--color-accent); }
.pf-search::-webkit-search-cancel-button { display: none; }

.pf-search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-faint);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.pf-sort {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 1rem;
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--color-text-muted);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  transition: border-color 200ms ease;
}

.pf-sort:focus { border-color: var(--color-accent); }

/* Filter groups */
.pf-filter-group { display: flex; flex-direction: column; gap: 0.6rem; }

.pf-filter-label {
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

.pf-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pf-pill {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  transition: all 200ms ease;
  letter-spacing: 0.03em;
}

.pf-pill:hover { border-color: var(--color-text-muted); color: var(--color-text); }
.pf-pill.active { border-color: var(--color-accent); color: var(--color-accent); background: rgba(200,169,110,0.08); }

/* Bottom row */
.pf-bottom-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.pf-year-range { display: flex; align-items: center; gap: 0.75rem; }
.pf-year-inputs { display: flex; align-items: center; gap: 0.4rem; }

.pf-year-input {
  width: 5rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text);
  text-align: center;
  outline: none;
}

.pf-year-input:focus { border-color: var(--color-accent); }
.pf-year-sep { color: var(--color-text-faint); font-size: 0.8rem; }

.pf-toggles { display: flex; gap: 0.5rem; }

.pf-toggle {
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 200ms ease;
  letter-spacing: 0.05em;
}

.pf-toggle:hover { border-color: var(--color-text-muted); }
.pf-toggle.active { border-color: var(--color-accent-2); color: var(--color-accent-2); background: rgba(232,93,58,0.08); }

.pf-meta { display: flex; align-items: center; gap: 1rem; margin-left: auto; }

.pf-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-faint);
}

.pf-reset {
  font-family: var(--font-body);
  font-size: 0.72rem;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.pf-reset:hover { color: var(--color-text); }

/* Grid — matches vt-grid */
.pf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Portfolio card — white border */
.pf-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  overflow: hidden;
  text-decoration: none;
  transition: border-color 250ms ease, transform 250ms ease;
}

.pf-card:hover { border-color: rgba(255, 255, 255, 0.35); transform: translateY(-2px); }

.pf-card-image {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: var(--color-surface-2);
}

.pf-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.pf-card:hover .pf-card-image img { transform: scale(1.04); }

.pf-card-badges {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.35rem;
}

.pf-badge {
  font-family: var(--font-body);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #fff;
  background: var(--color-accent);
  padding: 0.2rem 0.45rem;
  border-radius: 1px;
}

.pf-card-body { padding: 1rem 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 0.45rem; flex: 1; }

.pf-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pf-cat-tag {
  font-family: var(--font-body);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.pf-card-year {
  font-size: 0.75rem;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
}

.pf-card-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0;
}

.pf-card-sub {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  max-width: none;
  margin: 0;
}

/* Empty state */
.pf-empty {
  padding: 5rem 2rem;
  text-align: center;
  border: 1px solid var(--color-border);
}

.pf-empty p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0 auto 1.5rem;
}

.pf-reset-large {
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-accent);
  background: transparent;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1.5rem;
  cursor: pointer;
  transition: all 200ms ease;
}

.pf-reset-large:hover {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* Responsive */
@media (max-width: 640px) {
  .pf-search-row { flex-direction: column; align-items: stretch; }
  .pf-bottom-row { flex-direction: column; align-items: flex-start; }
  .pf-meta { margin-left: 0; }
  .pf-grid { grid-template-columns: 1fr; gap: 1rem; }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const el = document.getElementById('pf-styles');
  if (!el) {
    const s = document.createElement('style');
    s.id = 'pf-styles';
    s.textContent = styles;
    document.head.appendChild(s);
  }
}
