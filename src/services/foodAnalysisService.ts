export interface FoodAnalysis {
  nombre: string;
  detalle: string;
  porciones: string;
  caloriasKcal: number;
  proteinaG: number;
  grasasG: number;
  carbohidratosG?: number;
  confianza?: 'alta' | 'media' | 'baja';
  necesitaRevision?: boolean;
  supuestos?: string[];
  super: string[];
  tags: string[];
}

export interface FoodAnalysisResponse {
  ok: boolean;
  source: 'image' | 'text';
  analysis: FoodAnalysis;
  modelUsed?: string;
  providerUsed?: 'deepseek' | 'gemini' | 'qwen' | 'zhipu' | string;
}

export class FoodAnalysisError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FoodAnalysisError';
  }
}

interface AnalyzeFoodParams {
  imageBase64?: string;
  imageMimeType?: string;
  description?: string;
  customApiKey?: string;
}

export async function analyzeFood(params: AnalyzeFoodParams): Promise<FoodAnalysisResponse> {
  let response: Response;

  try {
    response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: params.description || undefined,
        imageBase64: params.imageBase64 || undefined,
        imageMimeType: params.imageMimeType || undefined,
        customApiKey: params.customApiKey || undefined,
      }),
    });
  } catch {
    throw new FoodAnalysisError(
      'NETWORK',
      'Sin conexion con el servidor. Revisa tu internet e intenta de nuevo.'
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.ok) {
    throw new FoodAnalysisError(
      data?.code || 'PROVIDER_ERROR',
      data?.error || 'No se pudo analizar la comida. Intenta de nuevo.'
    );
  }

  return data as FoodAnalysisResponse;
}
