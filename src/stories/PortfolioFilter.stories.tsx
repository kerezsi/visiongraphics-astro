import type { Meta, StoryObj } from '@storybook/react';
import PortfolioFilter from '../components/portfolio/PortfolioFilter';
import type { ProjectMeta } from '../components/portfolio/PortfolioFilter';

// ─── Sample project data ──────────────────────────────────────────
const placeholder = (label: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='315'%3E%3Crect width='560' height='315' fill='%23121212'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%237a7a7a'%3E${encodeURIComponent(label)}%3C/text%3E%3C/svg%3E`;

const SAMPLE_PROJECTS: ProjectMeta[] = [
  {
    slug: 'antalya-airport-t2',
    title: 'Antalya Airport T2',
    year: 2023,
    client: 'Fraport TAV',
    location: 'Antalya, Turkey',
    description: 'Full visualization package for the new terminal expansion.',
    categories: ['airport', 'architectural-visualization'],
    features: ['Exterior', '4K Animation', 'Aerial Integration'],
    tags: ['airport', 'terminal', 'turkey'],
    coverImage: placeholder('Antalya Airport T2'),
    featured: true,
    has360: false,
    hasFilm: true,
  },
  {
    slug: 'mol-campus',
    title: 'Mol Campus',
    year: 2022,
    client: 'Mol Group',
    location: 'Budapest, Hungary',
    description: 'Corporate campus visualization across multiple phases.',
    categories: ['commercial', 'office', 'architectural-visualization'],
    features: ['Exterior', 'Interior', 'AI-Enhanced'],
    tags: ['campus', 'office', 'corporate'],
    coverImage: placeholder('Mol Campus'),
    featured: true,
    has360: true,
    hasFilm: true,
  },
  {
    slug: 'hungexpo-vr',
    title: 'Hungexpo VR Experience',
    year: 2021,
    client: 'BIF',
    location: 'Budapest, Hungary',
    description: 'Interactive VR walkthrough of the new expo centre.',
    categories: ['exhibition', 'vr-experience', 'architectural-visualization'],
    features: ['Interior', 'VR Experience', 'Real-time'],
    tags: ['expo', 'vr', 'interactive'],
    coverImage: placeholder('Hungexpo VR'),
    featured: true,
    has360: true,
    hasFilm: false,
  },
  {
    slug: 'bud-airport-t2b',
    title: 'BUD Airport T2B Expansion',
    year: 2020,
    client: 'Budapest Airport',
    location: 'Budapest, Hungary',
    description: 'Terminal expansion visualization for planning approval.',
    categories: ['airport', 'infrastructure', 'architectural-visualization'],
    features: ['Exterior', 'Interior', 'Photo Integration'],
    tags: ['airport', 'terminal', 'budapest'],
    coverImage: placeholder('BUD Airport T2B'),
    featured: false,
    has360: false,
    hasFilm: false,
  },
  {
    slug: 'central-park-budapest',
    title: 'Central Park Budapest',
    year: 2019,
    client: 'Central Park Ingatlan',
    location: 'Budapest, Hungary',
    description: 'Residential tower complex full visualization.',
    categories: ['residential', 'urban', 'architectural-visualization'],
    features: ['Exterior', '4K Animation', 'Marketing Materials'],
    tags: ['residential', 'tower', 'urban'],
    coverImage: placeholder('Central Park Budapest'),
    featured: false,
    has360: false,
    hasFilm: true,
  },
  {
    slug: 'opera-eiffel-art-studios',
    title: 'Opera / Eiffel Art Studios',
    year: 2018,
    client: 'Liget Budapest',
    location: 'Budapest, Hungary',
    description: 'Cultural venue renovation and new build visualization.',
    categories: ['commercial', 'architectural-visualization'],
    features: ['Exterior', 'Interior', 'Historical Reconstruction'],
    tags: ['cultural', 'opera', 'heritage'],
    coverImage: placeholder('Opera / Eiffel Art Studios'),
    featured: false,
    has360: false,
    hasFilm: false,
  },
  {
    slug: 'k-h-bank-headquarters',
    title: 'K&H Bank HQ',
    year: 2016,
    client: 'K&H Bank',
    location: 'Budapest, Hungary',
    description: 'Corporate headquarters full exterior and interior package.',
    categories: ['commercial', 'office', 'architectural-visualization'],
    features: ['Exterior', 'Interior'],
    tags: ['bank', 'corporate', 'office'],
    coverImage: placeholder('K&H Bank HQ'),
    featured: false,
    has360: false,
    hasFilm: false,
  },
  {
    slug: 'agora-budapest',
    title: 'Agora Budapest',
    year: 2015,
    client: 'HB Reavis',
    location: 'Budapest, Hungary',
    description: 'Large-scale mixed-use development visualization.',
    categories: ['commercial', 'urban', 'architectural-visualization'],
    features: ['Exterior', 'Aerial Integration', 'Marketing Materials'],
    tags: ['mixed-use', 'office', 'urban'],
    coverImage: placeholder('Agora Budapest'),
    featured: false,
    has360: false,
    hasFilm: false,
  },
];

const meta: Meta<typeof PortfolioFilter> = {
  title: 'Components / Portfolio / PortfolioFilter',
  component: PortfolioFilter,
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen',
    docs: {
      description: {
        component: `React island for filtering the portfolio grid.
All project data is passed as props at build time — no API calls.
Filter state is reflected in URL parameters for shareability.
Filters are AND logic: a project must match all active filters.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', background: '#1a1a1a', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PortfolioFilter>;

export const Default: Story = {
  name: 'All Projects (default state)',
  args: {
    projects: SAMPLE_PROJECTS,
    minYear: 2015,
    maxYear: 2024,
  },
};

export const WithFewProjects: Story = {
  name: 'Small Dataset (3 projects)',
  args: {
    projects: SAMPLE_PROJECTS.slice(0, 3),
    minYear: 2021,
    maxYear: 2023,
  },
};

export const EmptyResults: Story = {
  name: 'No Projects (empty state)',
  args: {
    projects: [],
    minYear: 1996,
    maxYear: 2025,
  },
};
