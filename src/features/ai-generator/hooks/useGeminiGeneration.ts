import { useCallback, useState } from 'react';
import { generatePlan } from '../services/geminiService';
import { useAdminStore } from '../../../stores/adminStore';
import { useQuestionnaireStore } from '../../../stores/questionnaireStore';
import { usePlanStore } from '../../../stores/planStore';
import { parseObjectToData } from '../../../dataManager';
import { showAppAlert } from '../../../utils/appDialogs';
import type { QuestionnairePayload } from '../../../components/NutritionQuestionnaire';

export function useGeminiGeneration() {
  const { geminiApiKey, geminiModel, setDataVersion, setCustomData, customData } = useAdminStore();
  const { setLastGeneratedData, setGenerationError, setGenerationLoading, generationLoading, generationError, resetAll } = useQuestionnaireStore();
  const { setPerfilActivo, setDiaActivo } = usePlanStore();
  
  const [lastGenerated, setLastGenerated] = useState<unknown>(null);

  const notify = useCallback(async (title: string, message: string) => {
    await showAppAlert({ title, message });
  }, []);

  const handleGenerate = useCallback(async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationLoading(true);
    
    try {
      const result = await generatePlan(payload, geminiApiKey, geminiModel);
      
      // Guardar datos crudos para descarga
      setLastGenerated(result);
      setLastGeneratedData(result);

      // Parsear y guardar datos
      const updatedCustomData = { ...customData };
      
      try {
        if (result.elData) {
          updatedCustomData.el = parseObjectToData(result.elData, 'EL');
        }
        if (result.ellaData) {
          updatedCustomData.ella = parseObjectToData(result.ellaData, 'ELLA');
        }
      } catch (parseErr: unknown) {
        const errorMessage = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`Error en los datos generados: ${errorMessage}. La IA no generó la estructura esperada.`);
      }

      setCustomData(updatedCustomData);

      // Actualizar versiones de datos
      if (result.elData) {
        setDataVersion('el', 'custom');
      }
      if (result.ellaData) {
        setDataVersion('ella', 'custom');
      }

      await notify('Plan generado', '¡Plan generado con IA y cargado automáticamente!');
      
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al generar con IA.';
      console.error('Error en handleGenerate:', err);
      setGenerationError(errorMessage);
      throw err;
    } finally {
      setGenerationLoading(false);
    }
  }, [geminiApiKey, geminiModel, setCustomData, customData, setDataVersion, notify, setGenerationError, setGenerationLoading, setLastGeneratedData]);

  const handleViewPlan = useCallback((profile: 'el' | 'ella') => {
    setPerfilActivo(profile);
    setDiaActivo('Lunes');
  }, [setPerfilActivo, setDiaActivo]);

  return {
    handleGenerate,
    handleViewPlan,
    generationLoading,
    generationError,
    lastGenerated,
    geminiApiKey,
    geminiModel,
  };
}
