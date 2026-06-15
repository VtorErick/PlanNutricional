import { getGeminiModelLabel } from './geminiModels';

export const DEFAULT_AI_MODEL = 'deepseek-v4-flash';
export const DEFAULT_AI_FALLBACK_MODELS = ['deepseek-v4-pro'];

const AI_MODEL_LABELS: Record<string, string> = {
  'deepseek-v4-flash': 'DeepSeek V4 Flash',
  'deepseek-v4-pro': 'DeepSeek V4 Pro',
};

export function normalizeAiModelName(modelName: string) {
  return String(modelName || '').replace(/^models\//, '').trim();
}

export function getAiModelLabel(modelName: string) {
  const normalized = normalizeAiModelName(modelName);
  return AI_MODEL_LABELS[normalized] || getGeminiModelLabel(normalized);
}
