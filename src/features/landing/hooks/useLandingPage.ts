import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { usePlanStore } from '../../../stores/planStore';
import { useAdminStore } from '../../../stores/adminStore';
import { useQuestionnaireStore } from '../../../stores/questionnaireStore';
import { perfilesData as origPerfilesData } from '../../../data';

export function useLandingPage() {
  const navigate = useNavigate();
  const { 
    setPerfilActivo, 
    setDiaActivo, 
  } = usePlanStore();
  
  const { 
    dataVersions, 
    customData 
  } = useAdminStore();
  
  const {
    setTargetProfile
  } = useQuestionnaireStore();

  // Check if custom plans are ready
  const elReady = dataVersions.el === 'custom';
  const ellaReady = dataVersions.ella === 'custom';
  const hasCustomPlan = elReady || ellaReady;

  // Get profile data (custom or original)
  const perfilesData = useMemo(() => {
    const elCustom = customData.el as { perfilEL?: typeof origPerfilesData.el; planEL?: typeof origPerfilesData.el.plan } | undefined;
    const ellaCustom = customData.ella as { perfilELLA?: typeof origPerfilesData.ella; planELLA?: typeof origPerfilesData.ella.plan } | undefined;
    
    return {
      el: dataVersions.el === 'custom' && elCustom?.perfilEL 
          ? { ...elCustom.perfilEL, plan: elCustom.planEL } 
          : origPerfilesData.el,
      ella: dataVersions.ella === 'custom' && ellaCustom?.perfilELLA 
          ? { ...ellaCustom.perfilELLA, plan: ellaCustom.planELLA } 
          : origPerfilesData.ella,
    };
  }, [dataVersions, customData]);

  // IMC calculation
  const getImcData = useCallback((perfilText: string) => {
    const match = perfilText.match(/IMC\s*[:\-]?\s*([\d]+(?:[.,]\d+)?)/i);
    const imc = match ? Number(match[1].replace(',', '.')) : null;
    if (!imc || Number.isNaN(imc)) return null;
    const markerPct = Math.min(95, Math.max(5, ((imc - 16) / (35 - 16)) * 100));

    const status = imc < 18.5
      ? { label: 'Bajo', color: 'bg-sky-500', pct: 15 }
      : imc < 25
      ? { label: 'Saludable', color: 'bg-emerald-500', pct: 45 }
      : imc < 30
      ? { label: 'Sobrepeso', color: 'bg-amber-500', pct: 70 }
      : { label: 'Obesidad', color: 'bg-rose-500', pct: 90 };

    return { imc, ...status, pct: markerPct };
  }, []);

  // Format profile text for card display
  const formatProfileForCard = useCallback((perfilText: string) => {
    return perfilText
      .replace(/\((?:sobrepeso|obesidad|saludable|normal|bajo(?:\s*peso)?)\)/gi, '')
      .replace(/•?\s*IMC\s*[:\-]?\s*[\d]+(?:[.,]\d+)?\b/gi, '')
      .replace(/,\s*/g, ' • ')
      .replace(/:\s*/g, ' ')
      .replace(/•\s*(?:sobrepeso|obesidad|saludable|normal|bajo(?:\s*peso)?)\b/gi, '')
      .replace(/\(([^)]+)\)/g, '• $1')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*•\s*•\s*/g, ' • ')
      .replace(/\s*•\s*$/g, '')
      .trim();
  }, []);

  // Calculate ambos insights
  const ambosInsights = useMemo(() => {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const extractPlanData = (plan: typeof origPerfilesData.el.plan) => {
      const mealNames = new Set<string>();
      const ingredients = new Set<string>();

      Object.values(plan || {}).forEach((day) => {
        Object.values(day || {}).forEach((meals) => {
          if (!Array.isArray(meals)) return;
          meals.forEach((meal) => {
            if (meal?.nombre) mealNames.add(normalize(String(meal.nombre)));
            if (Array.isArray(meal?.super)) {
              meal.super.forEach((ingredient: string) => ingredients.add(normalize(String(ingredient))));
            }
          });
        });
      });

      return { mealNames, ingredients };
    };

    const el = extractPlanData(perfilesData.el.plan ?? {});
    const ella = extractPlanData(perfilesData.ella.plan ?? {});

    const sharedMeals = [...el.mealNames].filter((name) => ella.mealNames.has(name)).length;
    const commonIngredients = [...el.ingredients].filter((item) => ella.ingredients.has(item)).length;
    const ingredientsUnion = new Set([...el.ingredients, ...ella.ingredients]).size;
    const overlapPct = ingredientsUnion > 0 ? Math.round((commonIngredients / ingredientsUnion) * 100) : 0;

    return { sharedMeals, overlapPct };
  }, [perfilesData]);

  // IMC data for each profile
  const elImcData = useMemo(() => getImcData(perfilesData.el.perfil), [perfilesData.el.perfil, getImcData]);
  const ellaImcData = useMemo(() => getImcData(perfilesData.ella.perfil), [perfilesData.ella.perfil, getImcData]);

  // Select profile and navigate
  const selectProfile = useCallback((profile: 'el' | 'ella' | 'ambos') => {
    setPerfilActivo(profile);
    setDiaActivo('Lunes');
    navigate('/plan');
  }, [setPerfilActivo, setDiaActivo, navigate]);

  // Generate profile with AI
  const generateProfile = useCallback((profile: 'el' | 'ella' | 'ambos') => {
    setTargetProfile(profile);
    navigate('/generate');
  }, [setTargetProfile, navigate]);

  // Navigate to admin
  const goToAdmin = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  // Ambos button config
  const ambosButtonConfig = useMemo(() => {
    if (elReady && ellaReady) {
      return {
        label: 'Ver lista de compras conjunta',
        onClick: () => {
          setPerfilActivo('ambos');
          setDiaActivo('Lunes');
          navigate('/compras');
        },
        style: 'bg-white text-emerald-700 hover:bg-emerald-50 border border-white/80'
      };
    }
    if (elReady && !ellaReady) {
      return {
        label: 'Generar perfil faltante: Ella',
        onClick: () => generateProfile('ella'),
        style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
      };
    }
    if (!elReady && ellaReady) {
      return {
        label: 'Generar perfil faltante: El',
        onClick: () => generateProfile('el'),
        style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
      };
    }
    return {
      label: 'Personalizar ambos con IA',
      onClick: () => generateProfile('ambos'),
      style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
    };
  }, [elReady, ellaReady, setPerfilActivo, setDiaActivo, navigate, generateProfile]);

  return {
    elReady,
    ellaReady,
    hasCustomPlan,
    perfilesData,
    elImcData,
    ellaImcData,
    ambosInsights,
    formatProfileForCard,
    selectProfile,
    generateProfile,
    goToAdmin,
    ambosButtonConfig,
  };
}
