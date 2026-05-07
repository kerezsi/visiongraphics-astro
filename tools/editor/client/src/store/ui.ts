import { create } from 'zustand';

export type EditorView = 'editor' | 'pages' | 'pricing' | 'projects' | 'articles' | 'services' | 'collections' | 'vtech';

interface UIStore {
  selectedBlockId: string | null;
  leftPanelTab: 'files' | 'palette' | 'ai';
  isPreviewOpen: boolean;
  isImportDialogOpen: boolean;
  isSaving: boolean;
  lastSavedPath: string | null;
  errorMessage: string | null;
  view: EditorView;
  aiBlockSelectMode: boolean;
  aiSelectedBlockIds: string[];

  selectBlock: (id: string | null) => void;
  setTab: (tab: UIStore['leftPanelTab']) => void;
  togglePreview: () => void;
  openImportDialog: () => void;
  closeImportDialog: () => void;
  setSaving: (saving: boolean) => void;
  setLastSavedPath: (path: string | null) => void;
  setError: (msg: string | null) => void;
  setView: (view: EditorView) => void;
  setAiBlockSelectMode: (active: boolean) => void;
  toggleAiSelectedBlock: (id: string) => void;
  clearAiSelectedBlocks: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedBlockId: null,
  leftPanelTab: 'palette',
  isPreviewOpen: false,
  isImportDialogOpen: false,
  isSaving: false,
  lastSavedPath: null,
  errorMessage: null,
  view: 'editor',
  aiBlockSelectMode: false,
  aiSelectedBlockIds: [],

  selectBlock: (id) => set({ selectedBlockId: id }),
  setTab: (tab) => set({ leftPanelTab: tab }),
  togglePreview: () => set((s) => ({ isPreviewOpen: !s.isPreviewOpen })),
  openImportDialog: () => set({ isImportDialogOpen: true }),
  closeImportDialog: () => set({ isImportDialogOpen: false }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSavedPath: (path) => set({ lastSavedPath: path }),
  setError: (msg) => set({ errorMessage: msg }),
  setView: (view) => set({ view }),
  setAiBlockSelectMode: (active) => set(active
    ? { aiBlockSelectMode: true }
    : { aiBlockSelectMode: false, aiSelectedBlockIds: [] }
  ),
  toggleAiSelectedBlock: (id) => set((s) => ({
    aiSelectedBlockIds: s.aiSelectedBlockIds.includes(id)
      ? s.aiSelectedBlockIds.filter((x) => x !== id)
      : [...s.aiSelectedBlockIds, id],
  })),
  clearAiSelectedBlocks: () => set({ aiSelectedBlockIds: [], aiBlockSelectMode: false }),
}));
