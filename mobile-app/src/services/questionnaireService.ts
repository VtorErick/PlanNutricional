import { mealsDatabase } from '../data/mealsDB';
import { buildQuestionnaireSupplementsCatalog } from '../data/supplementsDB';
import { buildOptimizedMealsCatalog } from '../utils/mealCatalogBuilder';
import type { QuestionnairePayload } from '../types/questionnaire';
import type { PlanRevisionRequest, PlanRevisionResponse } from './aiService';
import { callGeminiDirectly } from './aiService';
import {
  API_BASE,
  AI_BACKEND_REQUIRED_MESSAGE,
  DIRECT_GEMINI_API_KEY,
  HAS_API_BASE,
  HAS_DIRECT_GEMINI_KEY,
} from './apiBase';

async function postToServer(path: string, body: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Platform': 'android',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(response.ok ? 'La API devolvio una respuesta no JSON.' : `Error ${response.status} del backend.`);
  }

  if (!response.ok) {
    throw new Error(json?.error || `Error ${response.status} del backend.`);
  }

  return json;
}

function resolvePreferredModel(preferredModel?: string) {
  return typeof preferredModel === 'string' ? preferredModel : '';
}

export async function requestAiPlan(payload: QuestionnairePayload, preferredModel?: string) {
  const questionnaireContext = payload;
  const catalogResult = await buildOptimizedMealsCatalog(mealsDatabase, questionnaireContext, {
    useRotation: false,
    recentMealIds: [],
    varietyWindow: 14,
    targetProfile: payload.targetProfile === 'ella' ? 'ella' : 'el',
    allowFallback: true,
  });

  const payloadWithKey = {
    ...payload,
    preferredModel: resolvePreferredModel(preferredModel),
    mealsCatalog: catalogResult.catalog,
    supplementsCatalog: buildQuestionnaireSupplementsCatalog(questionnaireContext),
  };

  if (HAS_API_BASE) {
    const json = await postToServer('/api/generate-plan', payloadWithKey);
    return { json, payloadWithKey };
  }

  if (HAS_DIRECT_GEMINI_KEY) {
    const json = await callGeminiDirectly(
      payloadWithKey,
      DIRECT_GEMINI_API_KEY,
      resolvePreferredModel(preferredModel)
    );
    return { json, payloadWithKey };
  }

  throw new Error(AI_BACKEND_REQUIRED_MESSAGE);
}

export async function requestAiPlanRevision(
  payload: PlanRevisionRequest,
  preferredModel?: string
) {
  const payloadWithKey = {
    ...payload,
    preferredModel: resolvePreferredModel(preferredModel),
  };

  if (HAS_API_BASE) {
    const json = await postToServer('/api/generate-plan', payloadWithKey);
    return { json: json as PlanRevisionResponse, payloadWithKey };
  }

  if (HAS_DIRECT_GEMINI_KEY) {
    const json = await callGeminiDirectly(
      payloadWithKey,
      DIRECT_GEMINI_API_KEY,
      resolvePreferredModel(preferredModel)
    );
    return { json: json as PlanRevisionResponse, payloadWithKey };
  }

  throw new Error(AI_BACKEND_REQUIRED_MESSAGE);
}
