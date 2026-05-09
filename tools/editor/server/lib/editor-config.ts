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
  /**
   * @deprecated Kept for backward compatibility. Read swarmBases() for the
   * actual list of backends — that helper falls back to [swarmBase] if the
   * array is empty.
   */
  swarmBase: string;
  /** Multiple SwarmUI backend URLs for parallel generation across machines. */
  swarmBases: string[];
  swarmModels: string[];
  swarmStyles: SwarmStyle[];
  swarmPrompts: SwarmPromptItem[];
  ollamaSystemPrompts: OllamaSystemPrompt[];
  activeSystemPromptName: string;
  ollamaTaskPrompts: Partial<Record<string, string>>;

  /** Translation engine for the editor's ✦ Translate buttons. */
  translationEngine?: 'ollama' | 'claude';
  /** Ollama model used for translation (overrides task-prompt resolveModel). */
  translationOllamaModel?: string;
  /** Claude model identifier (e.g. "claude-sonnet-4-5"). */
  translationClaudeModel?: string;
  /** Custom translation system prompt (overrides the built-in default). */
  translationPrompt?: string;
  // Note: ANTHROPIC_API_KEY is read from process.env, NOT stored in this JSON
  // file (editor-config.json is checked into the repo). Set it in your shell
  // environment or in a .env file consumed by the editor's start script.
}

const DEFAULTS: EditorConfig = {
  ollamaBase: 'http://localhost:11434',
  swarmBase: 'http://localhost:7801',
  swarmBases: [],
  swarmModels: [],
  swarmStyles: [],
  swarmPrompts: [],
  ollamaSystemPrompts: [],
  activeSystemPromptName: '',
  ollamaTaskPrompts: {},
  translationEngine: 'ollama',
  translationClaudeModel: 'claude-sonnet-4-5',
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
  // Keep swarmBase in sync with first entry of swarmBases so old code paths
  // that still read swarmBase keep working (and so the legacy field reflects
  // the user's primary backend).
  if (updates.swarmBases !== undefined && updates.swarmBases.length > 0) {
    cache = { ...cache, swarmBase: updates.swarmBases[0] };
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cache, null, 2), 'utf-8');
  return cache;
}

/**
 * Returns the active list of SwarmUI backend URLs.
 * Migration order: prefer swarmBases (new); fall back to [swarmBase] (legacy);
 * fall back to a single entry of the default; never returns an empty list
 * unless every URL field is empty.
 */
export function getSwarmBases(): string[] {
  const cfg = getConfig();
  const list = (cfg.swarmBases ?? []).filter((s) => typeof s === 'string' && s.trim().length > 0);
  if (list.length > 0) return list;
  if (cfg.swarmBase && cfg.swarmBase.trim().length > 0) return [cfg.swarmBase];
  return [];
}
