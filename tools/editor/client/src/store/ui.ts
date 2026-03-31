import { create } from 'zustand';

interface UIStore {
  selectedBlockId: string | null;
  leftPanelTab: 'files' | 'palette' | 'ai';
  isPreviewOpen: boolean;
  isImportDialogOpen: boolean;
  isSaving: boolean;
  lastSavedPath: string | null;
  errorMessage: string | null;

  selectBlock: (id: string | null) => void;
  setTab: (tab: UIStore['leftPanelTab']) => void;
  togglePreview: () => void;
  openImportDialog: () => void;
  closeImportDialog: () => void;
  setSaving: (saving: boolean) => void;
  setLastSavedPath: (path: string | null) => void;
  setError: (msg: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedBlockId: null,
  leftPanelTab: 'palette',
  isPreviewOpen: false,
  isImportDialogOpen: false,
  isSaving: false,
  lastSavedPath: null,
  errorMessage: null,

  selectBlock: (id) => set({ selectedBlockId: id }),
  setTab: (tab) => set({ leftPanelTab: tab }),
  togglePreview: () => set((s) => ({ isPreviewOpen: !s.isPreviewOpen })),
  openImportDialog: () => set({ isImportDialogOpen: true }),
  closeImportDialog: () => set({ isImportDialogOpen: false }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSavedPath: (path) => set({ lastSavedPath: path }),
  setError: (msg) => set({ errorMessage: msg }),
}));
