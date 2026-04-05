import React, { useEffect, useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar.tsx';
import { LeftPanel } from './components/panels/LeftPanel.tsx';
import { Canvas } from './components/panels/Canvas.tsx';
import { RightPanel } from './components/panels/RightPanel.tsx';
import { ImportDialog } from './components/dialogs/ImportDialog.tsx';
import { PreviewDialog } from './components/dialogs/PreviewDialog.tsx';
import { PagesOverview } from './components/overviews/PagesOverview.tsx';
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

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--color-bg)',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr 280px',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
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

  useEffect(() => {
    checkServices();
  }, [checkServices]);

  return (
    <ErrorBoundary>
      <div style={styles.root}>
        <Toolbar />
        {view === 'editor' ? (
          <div style={styles.body}>
            <LeftPanel />
            <Canvas />
            <RightPanel />
          </div>
        ) : view === 'pages' ? (
          <PagesOverview />
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
