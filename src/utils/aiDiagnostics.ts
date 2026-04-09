import { downloadJsonFile } from '../dataManager';

export const AI_GENERIC_ERROR_MESSAGE =
  'No se pudo completar la solicitud con IA. Descarga los logs para revisar el detalle.';

export interface AiDebugLog {
  id: string;
  occurredAt: string;
  flow: 'questionnaire-submit' | 'plan-revision' | 'model-discovery';
  transport: 'serverless' | 'direct-browser';
  stage: 'models-list' | 'generate-content' | 'response-parse';
  targetProfile?: 'el' | 'ella' | 'ambos';
  profilePrefix?: 'EL' | 'ELLA';
  requestMode?: 'generate' | 'adjust' | 'regenerate';
  requestedModel?: string;
  selectedModel?: string;
  apiKeySource?: 'custom-browser' | 'custom-server' | 'server-env';
  requestPayload?: unknown;
  geminiRequest?: unknown;
  geminiResponse?: {
    status?: number;
    body?: unknown;
  };
  error: {
    message: string;
    rawMessage?: string;
  };
}

export interface AiErrorWithLog extends Error {
  aiDebugLog?: AiDebugLog | null;
  statusCode?: number;
  userMessage?: string;
}

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function buildAiLogFileName(log: AiDebugLog) {
  const timestamp = sanitizeFileSegment(log.occurredAt.replace(/[:.]/g, '-').toLowerCase());
  const flow = sanitizeFileSegment(log.flow);
  return `ia-log-${flow}-${timestamp || Date.now()}.json`;
}

export function downloadAiDebugLog(log: AiDebugLog) {
  downloadJsonFile(buildAiLogFileName(log), JSON.stringify(log, null, 2));
}

export function extractAiDebugLog(error: unknown): AiDebugLog | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = (error as AiErrorWithLog).aiDebugLog;
  return candidate && typeof candidate === 'object' ? candidate : null;
}

export function resolveAiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const candidate = error as AiErrorWithLog;
  if (candidate.aiDebugLog) {
    return candidate.userMessage || AI_GENERIC_ERROR_MESSAGE;
  }

  if (typeof candidate.userMessage === 'string' && candidate.userMessage.trim()) {
    return candidate.userMessage;
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  return fallback;
}
