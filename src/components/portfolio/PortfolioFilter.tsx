// src/components/portfolio/PortfolioFilter.tsx
// React island — ALL filtering logic lives here
// Receives all project data as props at build time (no API calls)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { thumbUrl } from '../../lib/image-url';

// ─── Types ────────────────────────────────────────────────────────
export interface CategoryRef {
  id:    string;
  title: string;
}

export interface ProjectMeta {
  slug:        string;
  title:       string;
  year:        number;
  client?:     string;
  designer?:   string;
  city?:       string;
  country?:    string;
  description?: string;
  categories:  CategoryRef[];
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
  const allCategories = useMemo(() => {
    const seen = new Map<string, CategoryRef>();
    projects.flatMap(p => p.categories).forEach(c => { if (!seen.has(c.id)) seen.set(c.id, c); });
    return [...seen.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [projects]);
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
  const [filtersOpen,        setFiltersOpen]        = useState(false);

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
      if (selectedCategories.length && !selectedCategories.some(c => p.categories.some(pc => pc.id === c))) return false;
      if (selectedFeatures.length   && !selectedFeatures.some(f => p.features.includes(f)))     return false;
      if (p.year < yearRange[0] || p.year > yearRange[1])                                        return false;
      if (only360  && !p.has360)                                                                  return false;
      if (onlyFilm && !p.hasFilm)                                                                 return false;
      if (searchDebounced) {
        const q = searchDebounced.toLowerCase();
        const searchable = [p.title, p.client, p.city, p.country, ...p.tags].filter(Boolean).join(' ').toLowerCase();
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
    <div className="w-full">

      {/* ── Controls ── */}
      <div className="bg-surface border border-line rounded-token-sm px-6 py-4 mb-10 flex flex-col gap-4">

        {/* Search + sort + filter toggle */}
        <div className="pf-search-row flex gap-3 items-center">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none"
              viewBox="0 0 20 20" fill="none" aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              className="pf-search w-full bg-surface-2 border border-line rounded-token-sm py-[0.6rem] pr-8 pl-9 font-body text-[0.85rem] text-content transition-[border-color] duration-200"
              placeholder="Search by project, client, location…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              aria-label="Search projects"
            />
            {searchText && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-faint text-[1.1rem] cursor-pointer px-1 leading-none"
                onClick={() => setSearchText('')}
                aria-label="Clear search"
              >×</button>
            )}
          </div>

          <select
            className="pf-sort bg-surface-2 border border-line rounded-token-sm py-[0.6rem] px-4 font-body text-[0.8rem] text-muted cursor-pointer whitespace-nowrap transition-[border-color] duration-200"
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            aria-label="Sort projects"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A – Z</option>
          </select>

          <button
            className={`pf-filter-toggle flex items-center gap-[0.4rem] font-body text-[0.8rem] font-medium whitespace-nowrap flex-shrink-0 bg-surface-2 border rounded-token-sm py-[0.6rem] px-[0.9rem] cursor-pointer transition-[border-color,color] duration-200 hover:border-muted hover:text-content ${filtersOpen ? 'open border-accent text-content' : 'border-line text-muted'}`}
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
          >
            Filters
            {(hasActiveFilters && !filtersOpen) ? (
              <span className="w-[6px] h-[6px] rounded-full bg-accent flex-shrink-0" />
            ) : null}
            <svg
              className="pf-toggle-chevron w-[0.6rem] h-[0.4rem] transition-transform duration-200"
              viewBox="0 0 12 8" fill="none" aria-hidden="true"
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Collapsible filter groups */}
        {filtersOpen && (
          <div className="flex flex-col gap-5">
            {/* Category pills */}
            <div className="flex flex-col gap-[0.6rem]">
              <span className="font-body text-[0.65rem] font-medium tracking-[0.15em] uppercase text-faint">
                Category
              </span>
              <div className="flex flex-wrap gap-[0.4rem]">
                {allCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`pf-pill font-body text-[0.72rem] font-normal border rounded-token-sm py-[0.3rem] px-[0.65rem] cursor-pointer transition-all duration-200 tracking-[0.03em] ${
                      isActive(selectedCategories, cat.id)
                        ? 'border-accent text-accent'
                        : 'border-line text-muted hover:border-muted hover:text-content bg-transparent'
                    }`}
                    style={isActive(selectedCategories, cat.id) ? { background: 'rgba(218,19,19,0.08)' } : undefined}
                    onClick={() => toggle(selectedCategories, cat.id, setSelectedCategories)}
                    aria-pressed={isActive(selectedCategories, cat.id)}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-col gap-[0.6rem]">
              <span className="font-body text-[0.65rem] font-medium tracking-[0.15em] uppercase text-faint">
                Output type
              </span>
              <div className="flex flex-wrap gap-[0.4rem]">
                {allFeatures.map(feat => (
                  <button
                    key={feat}
                    className={`pf-pill font-body text-[0.72rem] font-normal border rounded-token-sm py-[0.3rem] px-[0.65rem] cursor-pointer transition-all duration-200 tracking-[0.03em] ${
                      isActive(selectedFeatures, feat)
                        ? 'border-accent text-accent'
                        : 'border-line text-muted hover:border-muted hover:text-content bg-transparent'
                    }`}
                    style={isActive(selectedFeatures, feat) ? { background: 'rgba(218,19,19,0.08)' } : undefined}
                    onClick={() => toggle(selectedFeatures, feat, setSelectedFeatures)}
                    aria-pressed={isActive(selectedFeatures, feat)}
                  >
                    {feat}
                  </button>
                ))}
              </div>
            </div>

            {/* Year range + toggles row */}
            <div className="pf-bottom-row flex items-center gap-6 flex-wrap border-t border-line pt-5">
              <div className="flex items-center gap-3">
                <span className="font-body text-[0.65rem] font-medium tracking-[0.15em] uppercase text-faint">
                  Year
                </span>
                <div className="flex items-center gap-[0.4rem]">
                  <input
                    type="number"
                    className="pf-year-input w-20 bg-surface-2 border border-line rounded-token-sm py-[0.4rem] px-2 font-mono text-[0.8rem] text-content text-center"
                    min={minYear} max={yearRange[1]}
                    value={yearRange[0]}
                    onChange={e => setYearRange([parseInt(e.target.value), yearRange[1]])}
                    aria-label="From year"
                  />
                  <span className="text-faint text-[0.8rem]">–</span>
                  <input
                    type="number"
                    className="pf-year-input w-20 bg-surface-2 border border-line rounded-token-sm py-[0.4rem] px-2 font-mono text-[0.8rem] text-content text-center"
                    min={yearRange[0]} max={maxYear}
                    value={yearRange[1]}
                    onChange={e => setYearRange([yearRange[0], parseInt(e.target.value)])}
                    aria-label="To year"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className={`font-body text-[0.72rem] font-medium border rounded-token-sm py-[0.35rem] px-3 cursor-pointer transition-all duration-200 tracking-[0.05em] ${
                    only360
                      ? 'border-accent text-accent'
                      : 'border-line text-muted bg-transparent hover:border-muted'
                  }`}
                  style={only360 ? { background: 'rgba(218,19,19,0.08)' } : undefined}
                  onClick={() => setOnly360(!only360)}
                  aria-pressed={only360}
                >
                  360° Tour
                </button>
                <button
                  className={`font-body text-[0.72rem] font-medium border rounded-token-sm py-[0.35rem] px-3 cursor-pointer transition-all duration-200 tracking-[0.05em] ${
                    onlyFilm
                      ? 'border-accent text-accent'
                      : 'border-line text-muted bg-transparent hover:border-muted'
                  }`}
                  style={onlyFilm ? { background: 'rgba(218,19,19,0.08)' } : undefined}
                  onClick={() => setOnlyFilm(!onlyFilm)}
                  aria-pressed={onlyFilm}
                >
                  Film
                </button>
              </div>

              {hasActiveFilters && (
                <div className="pf-meta flex items-center gap-4 ml-auto">
                  <button
                    className="font-body text-[0.72rem] text-accent bg-transparent border-none cursor-pointer p-0 underline underline-offset-2 hover:text-content"
                    onClick={resetAll}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results count — always visible */}
        <div className="border-t border-line pt-3">
          <span className="font-mono text-[0.75rem] text-faint">
            {filtered.length === projects.length
              ? `${projects.length} projects`
              : `${filtered.length} of ${projects.length}`}
          </span>
        </div>

      </div>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="pf-grid grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map(project => (
            <a
              key={project.slug}
              href={`/portfolio/${project.slug}/`}
              className="pf-card group flex flex-col bg-surface border rounded-token-sm overflow-hidden no-underline transition-[border-color,transform] duration-[250ms] ease-in-out hover:-translate-y-0.5"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              <div className="relative aspect-video overflow-hidden bg-surface-2">
                <img
                  src={thumbUrl(project.coverImage)}
                  alt={project.title}
                  loading="lazy"
                  decoding="async"
                  className="pf-card-img w-full h-full object-cover transition-transform duration-[400ms] ease-in-out"
                  onError={(e) => { (e.target as HTMLImageElement).src = project.coverImage; }}
                />
                <div className="absolute top-3 right-3 flex gap-[0.35rem]">
                  {project.has360  && (
                    <span className="font-body text-[0.62rem] font-medium tracking-[0.08em] text-white bg-accent py-[0.2rem] px-[0.45rem] rounded-[1px]">
                      360°
                    </span>
                  )}
                  {project.hasFilm && (
                    <span className="font-body text-[0.62rem] font-medium tracking-[0.08em] text-white bg-accent py-[0.2rem] px-[0.45rem] rounded-[1px]">
                      Film
                    </span>
                  )}
                </div>
              </div>
              <div className="px-[1.1rem] pt-4 pb-5 flex flex-col gap-[0.45rem] flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-body text-[0.64rem] font-semibold tracking-[0.1em] uppercase text-muted">
                    {project.categories[0]?.title ?? ''}
                  </span>
                  <span className="font-mono text-[0.75rem] text-faint">
                    {project.year}
                  </span>
                </div>
                <h3 className="font-display text-body font-bold text-content leading-[1.2] m-0">
                  {project.title}
                </h3>
                {(project.city || project.country) && (
                  <p className="text-[0.78rem] text-muted leading-[1.5] max-w-none m-0">
                    {[project.city, project.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="py-20 px-8 text-center border border-line">
          <p className="text-[0.9rem] text-muted m-0 mx-auto mb-6">
            No projects match those filters.
          </p>
          <button
            className="font-body text-[0.85rem] font-medium text-accent bg-transparent border border-accent rounded-token-sm py-[0.65rem] px-6 cursor-pointer transition-all duration-200 hover:bg-accent hover:text-page"
            onClick={resetAll}
          >
            Reset all filters
          </button>
        </div>
      )}

    </div>
  );
}
