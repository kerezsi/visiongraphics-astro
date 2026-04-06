import path from 'path';
import fs from 'fs';
import { PROJECT_ROOT } from './fs-utils.js';

const CONFIG_PATH = path.join(PROJECT_ROOT, 'tools', 'editor', 'editor-config.json');

export interface SwarmStyle {
  name: string;
  text: string;
}

export interface SwarmPromptItem {
  name: string;
  text: string;
}

export interface OllamaSystemPrompt {
  name: string;
  text: string;
}

export interface EditorConfig {
  ollamaBase: string;
  swarmBase: string;
  swarmModels: string[];
  swarmStyles: SwarmStyle[];
  swarmPrompts: SwarmPromptItem[];
  ollamaSystemPrompts: OllamaSystemPrompt[];
  activeSystemPromptName: string;
  ollamaTaskPrompts: Partial<Record<string, string>>;
}

const DEFAULTS: EditorConfig = {
  ollamaBase: 'http://localhost:11434',
  swarmBase: 'http://localhost:7801',
  swarmModels: [],
  swarmStyles: [],
  swarmPrompts: [],
  ollamaSystemPrompts: [],
  activeSystemPromptName: '',
  ollamaTaskPrompts: {},
};

let cache: EditorConfig | null = null;

export function getConfig(): EditorConfig {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    cache = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<EditorConfig>) };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function saveConfig(updates: Partial<EditorConfig>): EditorConfig {
  const current = getConfig();
  cache = { ...current, ...updates };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  return cache;
}
