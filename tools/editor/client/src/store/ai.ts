import { create } from 'zustand';
import * as api from '../lib/api-client.ts';

interface ComfyJob {
  id: string;
  progress: number;
  status: 'pending' | 'complete' | 'error';
  outputUrl?: string;
}

interface AIStore {
  ollamaAvailable: boolean;
  ollamaModels: string[];
  selectedModel: string;
  comfyAvailable: boolean;
  activeJob: ComfyJob | null;
  isCheckingServices: boolean;

  checkServices: () => Promise<void>;
  setSelectedModel: (model: string) => void;
  generateText: (prompt: string, context?: string) => Promise<string>;
  generateAltText: (imageUrl: string) => Promise<string>;
  generateExcerpt: (title: string, body: string) => Promise<string>;
  startComfyJob: (workflow: object, pageType: string, slug: string) => Promise<string>;
  updateJob: (job: Partial<ComfyJob>) => void;
  clearJob: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  ollamaAvailable: false,
  ollamaModels: [],
  selectedModel: '',
  comfyAvailable: false,
  activeJob: null,
  isCheckingServices: false,

  checkServices: async () => {
    set({ isCheckingServices: true });
    try {
      const [ollamaResult, comfyResult] = await Promise.allSettled([
        api.getOllamaModels(),
        api.getComfyStatus(),
      ]);

      const ollamaData =
        ollamaResult.status === 'fulfilled'
          ? ollamaResult.value
          : { available: false, models: [] };

      const comfyData =
        comfyResult.status === 'fulfilled'
          ? comfyResult.value
          : { available: false };

      set({
        ollamaAvailable: ollamaData.available,
        ollamaModels: ollamaData.models ?? [],
        selectedModel: ollamaData.models?.[0] ?? '',
        comfyAvailable: comfyData.available,
      });
    } catch {
      set({ ollamaAvailable: false, comfyAvailable: false });
    } finally {
      set({ isCheckingServices: false });
    }
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  generateText: async (prompt, context) => {
    const { selectedModel } = get();
    if (!selectedModel) throw new Error('No model selected');
    const messages: { role: 'user' | 'system'; content: string }[] = [];
    if (context) {
      messages.push({ role: 'system', content: context });
    }
    messages.push({ role: 'user', content: prompt });
    return api.chatWithOllama(selectedModel, messages);
  },

  generateAltText: async (imageUrl) => {
    return api.generateAltText(imageUrl);
  },

  generateExcerpt: async (title, body) => {
    return api.generateExcerpt(title, body);
  },

  startComfyJob: async (workflow, pageType, slug) => {
    const { jobId } = await api.startComfyGenerate(
      workflow as Record<string, unknown>,
      pageType,
      slug
    );
    set({ activeJob: { id: jobId, progress: 0, status: 'pending' } });
    return jobId;
  },

  updateJob: (patch) => {
    set((s) => ({
      activeJob: s.activeJob ? { ...s.activeJob, ...patch } : null,
    }));
  },

  clearJob: () => set({ activeJob: null }),
}));
