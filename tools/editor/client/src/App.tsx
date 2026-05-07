import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar.tsx';
import { LeftPanel } from './components/panels/LeftPanel.tsx';
import { Canvas } from './components/panels/Canvas.tsx';
import { RightPanel } from './components/panels/RightPanel.tsx';
import { ImportDialog } from './components/dialogs/ImportDialog.tsx';
import { PreviewDialog } from './components/dialogs/PreviewDialog.tsx';
import { PagesOverview } from './components/overviews/PagesOverview.tsx';
import { PricingOverview } from './components/overviews/PricingOverview.tsx';
import { ProjectsOverview } from './components/overviews/ProjectsOverview.tsx';
import { ArticlesOverview } from './components/overviews/ArticlesOverview.tsx';
import { CollectionsOverview } from './components/overviews/CollectionsOverview.tsx';
import { VisionTechOverview } from './components/overviews/VisionTechOverview.tsx';
import { ServicesOverview } from './components/overviews/ServicesOverview.tsx';
import { useAIStore } from './store/ai.ts';
import { useUIStore } from './store/ui.ts';

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState { error: Error | null }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 32,
          color: '#f87171',
          fontFamily: 'monospace',
          fontSize: 13,
          background: '#1a1a1a',
          height: '100vh',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}>
          <strong style={{ fontSize: 16 }}>Editor crashed — render error</strong>
          <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </pre>
          <button
            style={{ marginTop: 16, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}
            onClick={() => this.setState({ error: null })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DIVIDER_W = 4;
const MIN_PANEL = 160;

function useDragDivider(
  initial: number,
  side: 'left' | 'right',
  containerRef: React.RefObject<HTMLDivElement>
) {
  const [width, setWidth] = useState(initial);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const dx = e.clientX - startX.current;
      const delta = side === 'left' ? dx : -dx;
      const containerW = containerRef.current.offsetWidth;
      const newW = Math.max(MIN_PANEL, Math.min(startW.current + delta, containerW / 2));
      setWidth(newW);
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [side, containerRef]);

  return { width, onMouseDown };
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--color-bg)',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  divider: {
    width: DIVIDER_W,
    flexShrink: 0,
    background: 'var(--color-border)',
    cursor: 'col-resize',
    transition: 'background 0.15s',
  },
  errorBar: {
    position: 'fixed',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--color-accent)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
    cursor: 'pointer',
  },
};

export default function App() {
  const checkServices = useAIStore((s) => s.checkServices);
  const errorMessage = useUIStore((s) => s.errorMessage);
  const setError = useUIStore((s) => s.setError);
  const isImportDialogOpen = useUIStore((s) => s.isImportDialogOpen);
  const isPreviewOpen = useUIStore((s) => s.isPreviewOpen);
  const view = useUIStore((s) => s.view);

  const bodyRef = useRef<HTMLDivElement>(null);
  const left  = useDragDivider(240, 'left',  bodyRef);
  const right = useDragDivider(280, 'right', bodyRef);

  useEffect(() => {
    checkServices();
  }, [checkServices]);

  return (
    <ErrorBoundary>
      <div style={styles.root}>
        <Toolbar />
        {view === 'editor' ? (
          <div style={styles.body} ref={bodyRef}>
            <div style={{ width: left.width, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <LeftPanel />
            </div>
            <div
              style={styles.divider}
              onMouseDown={left.onMouseDown}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-border)')}
            />
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <Canvas />
            </div>
            <div
              style={styles.divider}
              onMouseDown={right.onMouseDown}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-border)')}
            />
            <div style={{ width: right.width, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <RightPanel />
            </div>
          </div>
        ) : view === 'pages' ? (
          <PagesOverview />
        ) : view === 'pricing' ? (
          <PricingOverview />
        ) : view === 'projects' ? (
          <ProjectsOverview />
        ) : view === 'articles' ? (
          <ArticlesOverview />
        ) : view === 'services' ? (
          <ServicesOverview />
        ) : view === 'vtech' ? (
          <VisionTechOverview />
        ) : (
          <CollectionsOverview />
        )}

        {isImportDialogOpen && <ImportDialog />}
        {isPreviewOpen && <PreviewDialog />}

        {errorMessage && (
          <div style={styles.errorBar}>
            <span>{errorMessage}</span>
            <button style={styles.errorClose} onClick={() => setError(null)}>✕</button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
