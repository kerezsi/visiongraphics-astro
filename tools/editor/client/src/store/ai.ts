import { create } from 'zustand';
import * as api from '../lib/api-client.ts';

// Persistent form state for the SwarmUI panel — survives tab/page switches
export interface SwarmFormState {
  swarmModel: string;
  swarmSize: number;
  swarmFormat: string;
  swarmStyleName: string;
  swarmPrompt: string;
  swarmImageCount: number;
}

interface AIStore extends SwarmFormState {
  ollamaAvailable: boolean;
  ollamaModels: string[];
  selectedModel: string;
  swarmAvailable: boolean;
  isCheckingServices: boolean;

  checkServices: () => Promise<void>;
  setSelectedModel: (model: string) => void;
  generateText: (prompt: string, context?: string) => Promise<string>;
  generateAltText: (imageUrl: string) => Promise<string>;
  generateExcerpt: (title: string, body: string) => Promise<string>;
  setSwarmForm: (patch: Partial<SwarmFormState>) => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  ollamaAvailable: false,
  ollamaModels: [],
  selectedModel: '',
  swarmAvailable: false,
  isCheckingServices: false,

  // SwarmUI form — persists across tab/page switches
  swarmModel: '',
  swarmSize: 1024,
  swarmFormat: '16:9',
  swarmStyleName: '',
  swarmPrompt: '',
  swarmImageCount: 1,

  checkServices: async () => {
    set({ isCheckingServices: true });
    try {
      const [ollamaResult, swarmResult] = await Promise.allSettled([
        api.getOllamaModels(),
        api.getSwarmStatus(),
      ]);

      const ollamaData =
        ollamaResult.status === 'fulfilled'
          ? ollamaResult.value
          : { available: false, models: [] };

      const swarmData =
        swarmResult.status === 'fulfilled'
          ? swarmResult.value
          : { available: false };

      set({
        ollamaAvailable: ollamaData.available,
        ollamaModels: ollamaData.models ?? [],
        selectedModel: ollamaData.models?.[0] ?? '',
        swarmAvailable: swarmData.available,
      });
    } catch {
      set({ ollamaAvailable: false, swarmAvailable: false });
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

  setSwarmForm: (patch) => set(patch),
}));
