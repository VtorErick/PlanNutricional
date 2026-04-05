import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, CheckCircle2, TrendingDown, Calendar,
  BookOpen, Zap, Shield, Lightbulb, BarChart3, ArrowLeft,
  Sun, Coffee, UtensilsCrossed, Moon, Apple, AlertTriangle,
  Heart, ChevronDown, ChevronUp, ShoppingCart, FileText, Settings, X, KeyRound
} from 'lucide-react';
import MealSelector from './components/MealSelector';
import EquivalenciasCard from './components/EquivalenciasCard';
import AdminPanel from './components/AdminPanel';
import NutritionQuestionnaire, { QuestionnairePayload, TargetProfile } from './components/NutritionQuestionnaire';
import { perfilesData as origPerfilesData, equivalenciasData as origEquivData, rawData, iconsMap, Profile, Equivalencia } from './data';
import { downloadDaySelectionPdf, parseObjectToData } from './dataManager';
import { showAppAlert, showAppConfirm } from './utils/appDialogs';

// Función auxiliar para llamar directamente a Gemini API en desarrollo local
async function callGeminiDirectly(payload: any, apiKey: string, modelName: string) {
  const buildSystemPrompt = (prefix: string) => {
    const lowerPrefix = prefix.toLowerCase();
    return `Eres un nutricionista clínico experto. Genera un plan semanal COMPLETO y VARIADO con comidas reales.

ESTRUCTURA REQUERIDA - DEBES SEGUIR ESTA ESTRUCTURA EXACTA:

1. perfil${prefix}: {
    id: "${lowerPrefix}",
    nombre: "${prefix === 'VO' ? 'El' : 'Ella'}",
    perfil: string (edad, peso, altura, IMC),
    meta: string,
    descripcion: string,
    edad: number,
    horariosTexto: string,
    momentos: [{ key: "desayuno", label: "Desayuno", hora: "8:00 am" }, { key: "colacion_am", label: "Colación mañana", hora: "..." }, { key: "comida", label: "Comida", hora: "..." }, { key: "colacion_pm", label: "Colación tarde", hora: "..." }, { key: "cena", label: "Cena", hora: "..." }],
    objetivosPorMomento: {
      desayuno: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      colacion_am: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      comida: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      colacion_pm: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number },
      cena: { frutas: number, verduras: number, cereales: number, leguminosas: number, leche: number, proteina: number, grasas: number }
    },
    distribucionDiaria: [
      { grupo: "Frutas", total: number, detalle: "ej: 1 en desayuno + 1 en colación" },
      { grupo: "Verduras", total: number, detalle: "ej: 2 desayuno + 2 comida" },
      { grupo: "Cereales", total: number, detalle: "ej: 1 desayuno + 1 comida" },
      { grupo: "Proteína", total: number, detalle: "ej: 3 desayuno + 4 comida" },
      { grupo: "Grasas", total: number, detalle: "ej: 2 desayuno + 2 col. AM" },
      { grupo: "Leche", total: number, detalle: "ej: 1 en cena" },
      { grupo: "Leguminosas", total: number, detalle: "ej: 3 veces por semana" }
    ],
    resumenPersonal: string[] (5-7 puntos clave específicos del plan),
    notaSalud: string (nota sobre salud específica, requerida)
  }

2. equivalencias${prefix}: array con MINIMO 6-7 objetos, cada uno con:
    { titulo: string, icon: enum[Carrot, Apple, Wheat, Bean, Milk, Beef, Droplets, Candy, AlertTriangle, Heart], items: string[] (5-10 items detallados con cantidad y gramos, formato: "1 manzana mediana (150g)", "1 taza de brócoli cocido (150g)", "30g de pechuga de pollo cocida") }
   
   Categorías requeridas: Frutas, Verduras, Cereales, Proteínas, Grasas, Leguminosas, Lácteos, y opcionalmente "Alimentos libres", "Antojos saludables", "Notas especiales"
   
   EJEMPLO de items para Frutas: ["1 manzana mediana (150g)", "1 pera mediana (150g)", "1 taza de fresas (150g)", "1 naranja mediana (180g)", "1 plátano pequeño (100g)"]
   EJEMPLO de items para Verduras: ["1 taza de brócoli cocido (150g)", "1 taza de espinacas crudas (30g)", "1 tomate grande (180g)", "1/2 pimiento morrón (100g)", "1 taza de pepino rallado (150g)"]

3. plan${prefix}: objeto con 7 días (Lunes-Domingo), cada día con 5 momentos (desayuno, colacion_am, comida, colacion_pm, cena)

REGLAS CRÍTICAS:
- OBLIGATORIO: id debe ser "${lowerPrefix}" y nombre debe ser "${prefix === 'VO' ? 'El' : 'Ella'}" - NO usar otros nombres
- OBLIGATORIO: objetivosPorMomento debe incluir TODOS los grupos: frutas, verduras, cereales, leguminosas, leche, proteina, grasas
- OBLIGATORIO: distribucionDiaria debe calcular los totales correctamente sumando objetivosPorMomento
- OBLIGATORIO: equivalencias debe tener MINIMO 6-7 categorías diferentes con items detallados
- Cada momento debe tener 3 opciones de comidas REALES y variadas
- Cada comida debe tener: nombre (específico), porciones (cantidad real), detalle (descripción), tags (array), super (ingredientes para comprar)
- Responde SOLO con JSON válido, sin markdown \`\`\`json`;
  };

  const buildUserPrompt = (p: any, prefix: string) => {
    return JSON.stringify({
      profilePrefix: prefix,
      questionnaire: p,
      outputContract: {
        rootKeys: [`perfil${prefix}`, `equivalencias${prefix}`, `plan${prefix}`],
        fixedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        momentsSource: 'questionnaire.planConfig.selectedMoments',
        mealsRequiredKeys: ['nombre', 'porciones', 'detalle', 'tags', 'super']
      }
    });
  };

  const generateForProfile = async (prefix: string, profilePayload: any) => {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: buildSystemPrompt(prefix) },
            { text: buildUserPrompt(profilePayload, prefix) }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    
    if (!res.ok) {
      let errorMsg = `Error ${res.status}`;
      try {
        const errJson = JSON.parse(text);
        errorMsg = errJson?.error?.message || errorMsg;
      } catch {}
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }

    const json = JSON.parse(text);
    const generatedText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Sanitizar y parsear
    const cleaned = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1) {
      throw new Error('Respuesta de IA no contiene JSON válido');
    }
    const sanitized = cleaned.slice(first, last + 1);
    
    return JSON.parse(sanitized);
  };

  const target = payload?.targetProfile || 'ambos';
  let voData = null;
  let vaData = null;

  // Preparar payloads por perfil
  const buildProfilePayload = (profileData: any) => ({
    ...payload,
    profileContext: profileData?.profileContext,
    healthContext: profileData?.healthContext,
    preferences: profileData?.preferences,
    routine: profileData?.routine,
  });

  if (target === 'vo' || target === 'ambos') {
    const voPayload = target === 'ambos' && payload.vo ? buildProfilePayload(payload.vo) : payload;
    voData = await generateForProfile('VO', voPayload);
  }

  if (target === 'va' || target === 'ambos') {
    // Delay para evitar rate limit
    if (target === 'ambos') {
      await new Promise(r => setTimeout(r, 4500));
    }
    const vaPayload = target === 'ambos' && payload.va ? buildProfilePayload(payload.va) : payload;
    vaData = await generateForProfile('VA', vaPayload);
  }

  return { voData, vaData };
}

const momentoIcons: Record<string, any> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

const macroPortionCategories = [
  { key: 'frutas', label: 'Frutas', icon: '🍎' },
  { key: 'verduras', label: 'Verduras', icon: '🥦' },
  { key: 'cereales', label: 'Cereales', icon: '🌾' },
  { key: 'proteina', label: 'Proteína', icon: '🥩' },
  { key: 'grasas', label: 'Grasas', icon: '🥑' },
  { key: 'leche', label: 'Leche', icon: '🥛' },
  { key: 'leguminosas', label: 'Leguminosas', icon: '🫘' },
] as const;

const getMomentMacroPortions = (profile: Profile, momentoKey: string) => {
  const objetivoMomento = (profile.objetivosPorMomento?.[momentoKey] || {}) as Record<string, number>;
  return macroPortionCategories
    .map((cat) => ({
      ...cat,
      cantidad: objetivoMomento[cat.key] || 0,
    }))
    .filter((item) => item.cantidad > 0);
};

export default function App() {
  // Siempre iniciar en home (null), no restaurar perfil de localStorage
  const [perfilActivo, setPerfilActivo] = useState<'vo' | 'va' | 'ambos' | null>(null);

  const [dataVersions, setDataVersions] = useState<{ vo: 'original' | 'custom', va: 'original' | 'custom' }>(() => {
    try {
      const saved = localStorage.getItem('dataVersions');
      return saved ? JSON.parse(saved) : { vo: 'original', va: 'original' };
    } catch { return { vo: 'original', va: 'original' }; }
  });

  const [customData, setCustomData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('customData');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('dataVersions', JSON.stringify(dataVersions));
  }, [dataVersions]);

  useEffect(() => {
    localStorage.setItem('customData', JSON.stringify(customData));
  }, [customData]);

  const perfilesData: Record<string, Profile> = useMemo(() => {
    return {
      vo: dataVersions.vo === 'custom' && customData.vo?.perfilVO 
          ? { ...customData.vo.perfilVO, plan: customData.vo.planVO } 
          : origPerfilesData.vo,
      va: dataVersions.va === 'custom' && customData.va?.perfilVA 
          ? { ...customData.va.perfilVA, plan: customData.va.planVA } 
          : origPerfilesData.va,
    };
  }, [dataVersions, customData, origPerfilesData]);

  const equivalenciasData: Record<string, Equivalencia[]> = useMemo(() => {
    const mapEquiv = (equivs: any) => {
      if (!Array.isArray(equivs)) return [];
      return equivs.map((eq: any) => {
        // Transform AI structure (categoria, ejemplos) to UI structure (titulo, items)
        const titulo = eq.categoria || eq.titulo || 'Sin título';
        const items = eq.items || (eq.ejemplos ? [eq.ejemplos] : []);
        return { 
          titulo, 
          items, 
          icon: iconsMap[eq.icon] || Heart 
        };
      });
    };
    return {
      vo: dataVersions.vo === 'custom' && customData.vo?.equivalenciasVO ? mapEquiv(customData.vo.equivalenciasVO) : origEquivData.vo,
      va: dataVersions.va === 'custom' && customData.va?.equivalenciasVA ? mapEquiv(customData.va.equivalenciasVA) : origEquivData.va,
    };
  }, [dataVersions, customData, origEquivData]);
  const [diaActivo, setDiaActivo] = useState(() => {
    try {
      return localStorage.getItem('diaActivo') || 'Lunes';
    } catch { return 'Lunes'; }
  });
  const [selecciones, setSelecciones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('seleccionesDieta');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [momentosColapsados, setMomentosColapsados] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'plan' | 'equivalencias' | 'resumen' | 'compras'>('plan');
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [momentosEnEdicion, setMomentosEnEdicion] = useState<Record<string, boolean>>({});
  const [comprasCheck, setComprasCheck] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('comprasCheck');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [ambosSubTab, setAmbosSubTab] = useState<'vo' | 'va'>('vo');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [lastGeneratedData, setLastGeneratedData] = useState<any>(null); // Para descarga de JSON
  
  const [showAdmin, setShowAdmin] = useState(false);
  const voReady = dataVersions.vo === 'custom';
  const vaReady = dataVersions.va === 'custom';
  const hasCustomPlan = voReady || vaReady;
  const notify = useCallback((title: string, message: string) => showAppAlert({ title, message }), []);
  const confirmAction = useCallback((title: string, message: string) => showAppConfirm({ title, message }), []);

  const getImcData = (perfilText: string) => {
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
  };

  const formatProfileForCard = (perfilText: string) => {
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
  };

  const ambosInsights = useMemo(() => {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const extractPlanData = (plan: Profile['plan']) => {
      const mealNames = new Set<string>();
      const ingredients = new Set<string>();

      Object.values(plan || {}).forEach((day) => {
        Object.values(day || {}).forEach((meals) => {
          if (!Array.isArray(meals)) return;
          meals.forEach((meal: any) => {
            if (meal?.nombre) mealNames.add(normalize(String(meal.nombre)));
            if (Array.isArray(meal?.super)) {
              meal.super.forEach((ingredient: string) => ingredients.add(normalize(String(ingredient))));
            }
          });
        });
      });

      return { mealNames, ingredients };
    };

    const vo = extractPlanData(perfilesData.vo.plan);
    const va = extractPlanData(perfilesData.va.plan);

    const sharedMeals = [...vo.mealNames].filter((name) => va.mealNames.has(name)).length;
    const commonIngredients = [...vo.ingredients].filter((item) => va.ingredients.has(item)).length;
    const ingredientsUnion = new Set([...vo.ingredients, ...va.ingredients]).size;
    const overlapPct = ingredientsUnion > 0 ? Math.round((commonIngredients / ingredientsUnion) * 100) : 0;

    return {
      sharedMeals,
      overlapPct
    };
  }, [perfilesData.vo.plan, perfilesData.va.plan]);

  const voImcData = getImcData(perfilesData.vo.perfil);
  const vaImcData = getImcData(perfilesData.va.perfil);

  const ambosButtonConfig = (() => {
    if (voReady && vaReady) {
      return {
        label: 'Ver lista de compras conjunta',
        onClick: () => {
          setPerfilActivo('ambos');
          setDiaActivo('Lunes');
          setTab('compras');
        },
        style: 'bg-white text-emerald-700 hover:bg-emerald-50 border border-white/80'
      };
    }
    if (voReady && !vaReady) {
      return {
        label: 'Generar perfil faltante: Ella',
        onClick: () => {
          setQuestionnaireTargetProfile('va');
          setShowQuestionnaire(true);
        },
        style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
      };
    }
    if (!voReady && vaReady) {
      return {
        label: 'Generar perfil faltante: El',
        onClick: () => {
          setQuestionnaireTargetProfile('vo');
          setShowQuestionnaire(true);
        },
        style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
      };
    }
    return {
      label: 'Personalizar ambos con IA',
      onClick: () => {
        setQuestionnaireTargetProfile('ambos');
        setShowQuestionnaire(true);
      },
      style: 'bg-white/20 hover:bg-white/30 text-white border border-white/30 animate-pulse'
    };
  })();
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try { 
      // Intentar leer desde localStorage primero, luego desde .env
      const saved = localStorage.getItem('geminiApiKey') || '';
      const fromEnv = (import.meta as any).env?.GEMINI_API_KEY || '';
      return saved || fromEnv;
    } catch { 
      return ''; 
    }
  });
  const [geminiModel, setGeminiModel] = useState(() => {
    try { 
      const saved = localStorage.getItem('geminiModel');
      // Modelos válidos disponibles
      const validModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'];
      // Si el modelo guardado no es válido o es el viejo 1.5-flash, migrar a 2.5-flash
      if (!saved || saved === 'gemini-1.5-flash' || !validModels.includes(saved)) {
        localStorage.setItem('geminiModel', 'gemini-2.5-flash');
        return 'gemini-2.5-flash'; 
      }
      return saved;
    } catch { 
      return 'gemini-2.5-flash'; 
    }
  });

  const [adminTab, setAdminTab] = useState<'manual' | 'settings'>('manual');

  // Estado del cuestionario - persiste entre tabs del Admin Panel
  const [questionnaireTargetProfile, setQuestionnaireTargetProfile] = useState<TargetProfile>('ambos');
  const [questionnaireStepIdx, setQuestionnaireStepIdx] = useState(0);
  const [questionnaireVo, setQuestionnaireVo] = useState<any>({
    age: '', currentWeightKg: '70', heightCm: '165', targetWeightKg: '',
    objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
    medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
    dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
    wakeTime: '', sleepTime: '', trainingFrequency: ''
  });
  const [questionnaireVa, setQuestionnaireVa] = useState<any>({
    age: '', currentWeightKg: '60', heightCm: '160', targetWeightKg: '',
    objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
    medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
    dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
    wakeTime: '', sleepTime: '', trainingFrequency: ''
  });
  const [questionnairePortionMode, setQuestionnairePortionMode] = useState<'auto' | 'manual'>('auto');
  const [questionnaireManualPortions, setQuestionnaireManualPortions] = useState<Record<string, Record<string, number>>>({});
  const [questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes] = useState('');

  // Resetear cuestionario al salir de las vistas de configuración/generación
  useEffect(() => {
    if (!showAdmin && !showQuestionnaire) {
      setQuestionnaireTargetProfile('ambos');
      setQuestionnaireStepIdx(0);
      setQuestionnaireVo({
        age: '', currentWeightKg: '70', heightCm: '165', targetWeightKg: '',
        objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
        medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
        dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
        wakeTime: '', sleepTime: '', trainingFrequency: ''
      });
      setQuestionnaireVa({
        age: '', currentWeightKg: '60', heightCm: '160', targetWeightKg: '',
        objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
        medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
        dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
        wakeTime: '', sleepTime: '', trainingFrequency: ''
      });
      setQuestionnairePortionMode('auto');
      setQuestionnaireManualPortions({});
      setQuestionnaireAdditionalNotes('');
    }
  }, [showAdmin, showQuestionnaire]);

  // Limpiar estado de generación al abrir el cuestionario en paso inicial
  useEffect(() => {
    if (showQuestionnaire && !questionnaireStepIdx) {
      // Solo limpiar si está en paso 0 (cuestionario nuevo)
      setLastGeneratedData(null);
      setGenerationError('');
    }
  }, [showQuestionnaire, questionnaireStepIdx]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem('geminiModel', geminiModel);
  }, [geminiModel]);

  // Guardar en LocalStorage cada que cambian
  useEffect(() => {
    localStorage.setItem('comprasCheck', JSON.stringify(comprasCheck));
  }, [comprasCheck]);

  useEffect(() => {
    if (perfilActivo) localStorage.setItem('perfilActivo', perfilActivo);
  }, [perfilActivo]);

  useEffect(() => {
    localStorage.setItem('diaActivo', diaActivo);
  }, [diaActivo]);

  useEffect(() => {
    localStorage.setItem('seleccionesDieta', JSON.stringify(selecciones));
  }, [selecciones]);

  // Refs to handle auto-scrolling to each meal section
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMomento = useCallback((momentoKey: string, isExpanded: boolean) => {
    const doScroll = () => {
      const el = mealSectionRefs.current[momentoKey];
      if (!el) return;
      // Offset = header (~56px) + dias (~48px) + progreso (~44px) + margen (12px)
      const offset = 56 + 48 + 44 + 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    if (isExpanded) {
      // Close expanded panel first and wait for the animation to finish
      setProgressExpanded(false);
      setTimeout(doScroll, 260); // 260ms delay to account for the 0.25s animation
    } else {
      doScroll();
    }
  }, []);

  const isAmbos = perfilActivo === 'ambos';
  const isVo = perfilActivo === 'vo';
  // perfilBase is used to extract days and general structure (both share identical days and moments)
  const perfilBase = perfilActivo && perfilActivo !== 'ambos' ? perfilesData[perfilActivo as 'vo' | 'va'] : perfilesData.vo;
  const perfil = perfilBase;
  const diasDisponibles = perfilActivo ? Object.keys(perfilBase.plan) : [];
  const equivalencias = (perfilActivo && perfilActivo !== 'ambos') ? equivalenciasData[perfilActivo as 'vo' | 'va'] : [];

  const toggleSeleccion = (perfilId: string, dia: string, momento: string, nombre: string) => {
    const key = `${perfilId}-${dia}-${momento}-${nombre}`;
    setSelecciones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const momentoCompletadoVo = useMemo(() => {
    if (!perfilActivo) return {};
    const result: Record<string, boolean> = {};
    perfilesData.vo.momentos.forEach((m) => {
      const comidas = perfilesData.vo.plan[diaActivo]?.[m.key] || [];
      result[m.key] = comidas.some((item) => selecciones[`vo-${diaActivo}-${m.key}-${item.nombre}`]);
    });
    return result;
  }, [diaActivo, perfilActivo, selecciones]);

  const momentoCompletadoVa = useMemo(() => {
    if (!perfilActivo) return {};
    const result: Record<string, boolean> = {};
    perfilesData.va.momentos.forEach((m) => {
      const comidas = perfilesData.va.plan[diaActivo]?.[m.key] || [];
      result[m.key] = comidas.some((item) => selecciones[`va-${diaActivo}-${m.key}-${item.nombre}`]);
    });
    return result;
  }, [diaActivo, perfilActivo, selecciones]);

  const momentoCompletado = useMemo(() => {
    if (!perfilActivo) return {} as Record<string, boolean>;
    if (isAmbos) {
      // In "both" mode, it's better for global progress to track exactly 10 meals (5 per profile)
      // Visual checks at the top-level indicate completion only when both profiles complete the meal
      const result: Record<string, boolean> = {};
      perfilBase.momentos.forEach((m) => {
        result[m.key] = momentoCompletadoVo[m.key] && momentoCompletadoVa[m.key];
      });
      return result;
    }
    return isVo ? momentoCompletadoVo : momentoCompletadoVa;
  }, [isAmbos, isVo, momentoCompletadoVo, momentoCompletadoVa, perfilBase]);

  const progresoDia = useMemo(() => {
    if (!perfilActivo) return 0;
    if (isAmbos) {
      const cVo = Object.values(momentoCompletadoVo).filter(Boolean).length;
      const cVa = Object.values(momentoCompletadoVa).filter(Boolean).length;
      const total = perfilesData.vo.momentos.length * 2;
      return Math.round(((cVo + cVa) / total) * 100);
    }
    const total = perfilBase.momentos.length;
    const completados = Object.values(momentoCompletado).filter(Boolean).length;
    return Math.round((completados / total) * 100);
  }, [perfilActivo, isAmbos, perfilBase, momentoCompletado, momentoCompletadoVo, momentoCompletadoVa]);
  const handleDownloadDayPdf = useCallback(() => {
    if (!perfilActivo) return;

    if (perfilActivo === 'ambos') {
      downloadDaySelectionPdf(
        diaActivo, 
        [
          { perfilData: perfilesData.vo, color: [37, 99, 235], planObj: perfilesData.vo.plan, perfilId: 'vo' },
          { perfilData: perfilesData.va, color: [225, 29, 72], planObj: perfilesData.va.plan, perfilId: 'va' }
        ],
        selecciones
      );
    } else {
      const isVA = perfilActivo === 'va';
      downloadDaySelectionPdf(
        diaActivo, 
        [
          { 
            perfilData: perfilesData[perfilActivo], 
            color: isVA ? [225, 29, 72] : [37, 99, 235], 
            planObj: perfilesData[perfilActivo].plan, 
            perfilId: perfilActivo 
          }
        ],
        selecciones
      );
    }
  }, [perfilActivo, diaActivo, perfilesData, selecciones]);

  const completadosCount = isAmbos 
    ? Object.values(momentoCompletadoVo).filter(Boolean).length + Object.values(momentoCompletadoVa).filter(Boolean).length
    : Object.values(momentoCompletado).filter(Boolean).length;
    
  const totalMomentosProgress = isAmbos ? perfilBase.momentos.length * 2 : perfilBase.momentos.length;

  // Collapse progress when tab changes or day changes
  useEffect(() => {
    setProgressExpanded(false);
    setMomentosColapsados({});
    setMomentosEnEdicion({});
  }, [tab, diaActivo, perfilActivo]);

  const listaCompras = useMemo(() => {
    const map: Record<string, { texto: string, perfil: string }[]> = {};
    Object.entries(selecciones).forEach(([key, isSelected]) => {
      if (!isSelected) return;
      const parts = key.split('-');
      if (parts.length < 4) return;
      const [p, d, m, ...nParts] = parts;

      if (perfilActivo !== 'ambos' && p !== perfilActivo) return;

      const nombre = nParts.join('-'); // in case nombre had a dash
      
      const perfilObj = perfilesData[p as 'vo' | 'va'];
      if (!perfilObj) return;

      const comidas = perfilObj.plan[d]?.[m] || [];
      const comida = comidas.find(c => c.nombre === nombre);
      if (comida) {
        comida.super.forEach(ing => {
          if (!map[ing]) map[ing] = [];
          const label = `${d} - ${m.replace('colacion_am', 'Col. AM').replace('colacion_pm', 'Col. PM')} (${perfilObj.nombre}): ${comida.nombre}`;
          map[ing].push({ texto: label, perfil: p });
        });
      }
    });

    // Sort alphabetically
    return Object.keys(map).sort().map(ing => ({
      ingrediente: ing,
      usos: map[ing]
    }));
  }, [selecciones, perfilActivo]);


  const handleGenerateWithAi = useCallback(async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationLoading(true);
    try {
      const payloadWithKey = { ...payload, customApiKey: geminiApiKey, preferredModel: geminiModel };
      
      let json;
      let usedDirectApi = false;
      
      // Intentar llamar al endpoint /api primero
      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithKey),
        });

        // Obtener texto crudo primero para validación
        const responseText = await res.text();
        
        // Verificar si la respuesta está vacía
        if (!responseText || responseText.trim() === '') {
          throw new Error('SERVER_UNAVAILABLE');
        }

        // Verificar si parece HTML (error del servidor)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          throw new Error('SERVER_UNAVAILABLE');
        }

        // Intentar parsear JSON
        try {
          json = JSON.parse(responseText);
        } catch (parseErr: any) {
          throw new Error('SERVER_UNAVAILABLE');
        }

        if (!res.ok) {
          throw new Error(json?.error || `Error ${res.status}`);
        }
      } catch (serverErr: any) {
        // Si el servidor no está disponible (desarrollo local sin Vercel), usar API directa
        console.log('Server error caught:', serverErr.message);
        console.log('API Key available:', geminiApiKey ? 'YES (length: ' + geminiApiKey.length + ')' : 'NO');
        
        const isServerUnavailable = serverErr.message === 'SERVER_UNAVAILABLE' || 
            serverErr.message?.includes('fetch') ||
            serverErr.message?.includes('Failed to fetch') ||
            serverErr.message?.includes('NetworkError');
        
        if (isServerUnavailable) {
          // En desarrollo, permitir usar API key desde .env via import.meta.env
          const envApiKey = (import.meta as any).env?.GEMINI_API_KEY || '';
          
          if (!envApiKey && !geminiApiKey) {
            throw new Error('En desarrollo local, configura tu GEMINI_API_KEY en el archivo .env o en el panel de Administración (Ajustes IA) para generar planes con IA.');
          }
          
          usedDirectApi = true;
          const keyToUse = geminiApiKey || envApiKey;
          console.log('Using direct API with key length:', keyToUse.length);
          json = await callGeminiDirectly(payloadWithKey, keyToUse, geminiModel);
        } else {
          throw serverErr;
        }
      }

      // Validar que tengamos datos
      if (!json.voData && !json.vaData) {
        throw new Error('La respuesta no contiene datos del plan. Intenta de nuevo.');
      }

      console.log('=== DATOS GENERADOS POR IA ===');
      console.log('voData:', json.voData ? 'EXISTS' : 'null', json.voData ? Object.keys(json.voData) : '');
      console.log('vaData:', json.vaData ? 'EXISTS' : 'null', json.vaData ? Object.keys(json.vaData) : '');
      
      // Guardar datos crudos para descarga
      setLastGeneratedData(json);

      setCustomData((prev: any) => {
        const updated = { ...prev };

        try {
          if (json.voData) {
            console.log('Parseando voData...');
            updated.vo = parseObjectToData(json.voData, 'VO');
            console.log('voData parseado correctamente');
          }
          if (json.vaData) {
            console.log('Parseando vaData...');
            updated.va = parseObjectToData(json.vaData, 'VA');
            console.log('vaData parseado correctamente');
          }
        } catch (parseErr: any) {
          console.error('Error parseando datos de IA:', parseErr);
          throw new Error(`Error en los datos generados: ${parseErr.message}. La IA no generó la estructura esperada.`);
        }
        console.log('=== DATOS GUARDADOS EN CUSTOMDATA ===', updated);
        return updated;
      });

      setDataVersions((prev) => ({
        vo: json.voData ? 'custom' : prev.vo,
        va: json.vaData ? 'custom' : prev.va,
      }));

      setShowQuestionnaire(false);
      await notify('Plan generado', usedDirectApi ? '¡Plan generado con IA (modo directo)!' : '¡Plan generado con IA y cargado automáticamente!');
    } catch (err: any) {
      console.error('Error en handleGenerateWithAi:', err);
      setGenerationError(err?.message || 'Error desconocido al generar con IA.');
    } finally {
      setGenerationLoading(false);
    }
  }, [geminiApiKey, geminiModel]);

  // ─── AI Generator View ─────────────────────────────────────────────────────
  if (showQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white text-base">🪄</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Generar plan con IA</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Completa el formulario para crear y aplicar un plan personalizado.</p>
            </div>
          </div>
          <button onClick={() => setShowQuestionnaire(false)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NutritionQuestionnaire
              onCancel={() => setShowQuestionnaire(false)}
              onGenerate={handleGenerateWithAi}
              onViewPlan={(profile) => {
                setShowQuestionnaire(false);
                setPerfilActivo(profile);
                setDiaActivo('Lunes');
                setTab('plan');
              }}
              loading={generationLoading}
              errorMessage={generationError}
              geminiModel={geminiModel}
              setGeminiModel={setGeminiModel}
              lastGeneratedData={lastGeneratedData}
              targetProfile={questionnaireTargetProfile}
              setTargetProfile={setQuestionnaireTargetProfile}
              stepIdx={questionnaireStepIdx}
              setStepIdx={setQuestionnaireStepIdx}
              vo={questionnaireVo}
              setVo={setQuestionnaireVo}
              va={questionnaireVa}
              setVa={setQuestionnaireVa}
              portionMode={questionnairePortionMode}
              setPortionMode={setQuestionnairePortionMode}
              manualPortions={questionnaireManualPortions}
              setManualPortions={setQuestionnaireManualPortions}
              additionalNotes={questionnaireAdditionalNotes}
              setAdditionalNotes={setQuestionnaireAdditionalNotes}
            />
          </section>
        </main>
      </div>
    );
  }

  // ─── Admin View ───────────────────────────────────────────────────────────
  if (showAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Admin Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">Panel de Administración</h1>
                  <p className="text-[11px] text-slate-400 hidden sm:block">Gestiona respaldos y configura el motor de IA</p>
            </div>
          </div>
          <button onClick={() => setShowAdmin(false)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Admin Tab Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
            {([
              { key: 'manual', label: 'Backup', shortLabel: 'Backup', emoji: '💾' },
              { key: 'settings', label: 'Ajustes IA', shortLabel: 'Ajustes', emoji: '⚙️' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setAdminTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                  adminTab === t.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}>
                <span className="block text-sm mb-0.5">{t.emoji}</span>
                <span className="hidden sm:block">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">

          {/* ── SETTINGS TAB ── */}
          {adminTab === 'settings' && (
            <div className="space-y-5 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center pb-2">
                <h2 className="text-lg font-bold text-slate-800">⚙️ Ajustes de Inteligencia Artificial</h2>
                <p className="text-sm text-slate-500">Configura tu clave y el modelo de Gemini a utilizar.</p>
              </div>

              {/* API Key */}
              <section className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Clave de API Gemini</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Se guarda en tu navegador. Evita el límite de solicitudes compartido (Error 429).
                    </p>
                  </div>
                </div>
                <div className="relative mb-3">
                  <input
                    type="password"
                    id="admin-api-key"
                    placeholder="Ingresa tu API key de Gemini (AIzaSy...)"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                  {geminiApiKey && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">✓</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (geminiApiKey) {
                        // Guardar la nueva API key
                        localStorage.setItem('geminiApiKey', geminiApiKey);
                        setGeminiApiKey(''); // Limpiar input para mostrar botón de cargar default
                        await notify('Configuración guardada', '✅ API Key guardada exitosamente');
                      } else {
                        // Cargar la predeterminada del .env
                        const envKey = (import.meta as any).env?.GEMINI_API_KEY || '';
                        localStorage.setItem('geminiApiKey', envKey);
                        setGeminiApiKey(envKey);
                        if (envKey) {
                          await notify('Configuración actualizada', '✅ API Key predeterminada cargada desde configuración');
                        } else {
                          await notify('Configuración actualizada', '🗑️ API Key eliminada (no hay predeterminada en .env)');
                        }
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md"
                  >
                    {geminiApiKey ? '💾 Guardar API Key' : '🔄 Cargar predeterminada'}
                  </button>
                  {geminiApiKey && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-lg">
                      ✅ Configurada
                    </span>
                  )}
                </div>
              </section>

              {/* Model Select */}
              <section className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Motor de Gemini</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Selecciona qué versión de Gemini usará el generador de planes.</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-600 mb-2">Selecciona tu modelo preferido (ya hay uno preseleccionado):</p>
                <div className="grid gap-2">
                  {[
                    { val: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: '⚡ Más reciente', desc: 'Versión más nueva y rápida de 2.5', badgeColor: 'bg-emerald-100 text-emerald-700' },
                    { val: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Recomendado', desc: 'Velocidad óptima y calidad alta', badgeColor: 'bg-blue-100 text-blue-700' },
                    { val: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', badge: '🆓 Gratuito', desc: 'Ideal para cuentas sin cuota pagada', badgeColor: 'bg-slate-100 text-slate-700' },
                    { val: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', badge: '🧠 Pro', desc: 'Razonamiento complejo, más lento', badgeColor: 'bg-violet-100 text-violet-700' },
                    { val: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: '🚀 Máx. potencia', desc: 'El modelo más avanzado disponible', badgeColor: 'bg-amber-100 text-amber-700' },
                  ].map(m => (
                    <button key={m.val} type="button" onClick={() => setGeminiModel(m.val)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        geminiModel === m.val
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        geminiModel === m.val ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'
                      }`}>
                        {geminiModel === m.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{m.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                        </div>
                        <p className="text-xs text-slate-400">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ── MANUAL BACKUP TAB ── */}
          {adminTab === 'manual' && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">💾 Backup y Restauración</h2>
                <p className="text-sm text-slate-500">Descarga tu plan como respaldo o restaura una versión anterior desde archivo JSON.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminPanel
                  perfilId="vo"
                  title="Datos El"
                  themeColor="blue"
                  rawDataText={rawData.vo}
                  customData={customData}
                  setCustomData={setCustomData}
                  dataVersion={dataVersions.vo}
                  setDataVersion={(ver) => setDataVersions(prev => ({ ...prev, vo: ver }))}
                  perfilesDataObj={origPerfilesData.vo}
                  notify={notify}
                  confirmAction={confirmAction}
                />
                <AdminPanel
                  perfilId="va"
                  title="Datos Ella"
                  themeColor="rose"
                  rawDataText={rawData.va}
                  customData={customData}
                  setCustomData={setCustomData}
                  dataVersion={dataVersions.va}
                  setDataVersion={(ver) => setDataVersions(prev => ({ ...prev, va: ver }))}
                  perfilesDataObj={origPerfilesData.va}
                  notify={notify}
                  confirmAction={confirmAction}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  // ─── Landing / Profile selector ───────────────────────────────────────────
  if (!perfilActivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/hero.png" alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-5 text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm mb-4 border border-white/50"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-wide text-slate-700 uppercase">Bienvenido a su plan</span>
              </motion.div>
              <div className="mb-4">
                <button
                  onClick={() => setShowAdmin(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>Mi perfil</span>
                </button>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]">
                Nutrición inteligente,<br className="hidden sm:block"/>
                <span className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
                  sin complicaciones.
                </span>
              </h1>
              <p className="text-sm md:text-lg text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
                Elige tu plan individual o armen su lista de compras juntos de forma automática.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="flex-1 max-w-4xl mx-auto px-4 md:px-6 pb-12 w-full z-10 relative -mt-2">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">✅ Plan editable</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">🛒 Lista de compras</span>
          </div>
          <div className="mb-3 sm:mb-4 text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-semibold tracking-wide uppercase">Selecciona un perfil para comenzar</p>
          </div>
          {!hasCustomPlan && (
            <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 sm:px-4 sm:py-3 text-center shadow-sm">
              <p className="text-xs sm:text-sm text-sky-900 font-semibold leading-snug">
                Selecciona un perfil para personalizar tu plan con IA.
              </p>
            </div>
          )}
          {voReady !== vaReady && (
            <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50/80 px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
              <p className="text-xs sm:text-sm text-violet-900 font-semibold leading-snug text-center">
                {voReady ? '¡Genial! El plan de Él está listo. ¿Personalizamos el de Ella ahora?' : '¡Genial! El plan de Ella está listo. ¿Personalizamos el de Él ahora?'}
              </p>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setQuestionnaireTargetProfile(voReady ? 'va' : 'vo');
                    setShowQuestionnaire(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                >
                  <span>✨</span>
                  <span>{voReady ? 'Generar plan de Ella' : 'Generar plan de Él'}</span>
                </button>
              </div>
            </div>
          )}
          {voReady && vaReady && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 sm:px-4 sm:py-3 text-center shadow-sm">
              <p className="text-xs sm:text-sm text-emerald-800 font-semibold leading-snug">
                ✅ ¡Todo listo! Los planes personalizados para ambos han sido generados.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-stretch">
            <motion.button
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setPerfilActivo('vo'); setDiaActivo('Lunes'); setTab('plan'); }}
              className="h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
            >
              {voReady && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-emerald-500/95 text-white text-[10px] font-bold shadow-sm">
                  ✅ Listo
                </div>
              )}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
              <div className="relative h-full flex flex-col">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                  <span className="text-sm sm:text-base font-semibold tracking-wide text-white">El</span>
                </div>
                <p className="text-blue-100 text-sm mb-4 leading-relaxed min-h-[72px]">{formatProfileForCard(perfilesData.vo.perfil)}</p>
                {voImcData && (
                  <div className="mb-3 min-h-[70px]">
                    <div className="h-4 mb-1 flex items-center justify-between text-[11px] text-blue-100 font-semibold">
                      <span>IMC {voImcData.imc}</span>
                      <span>{voImcData.label}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/25 overflow-hidden">
                      <div
                        className={`h-full ${voImcData.color}`}
                        style={{ width: `${voImcData.pct}%` }}
                      />
                      <span
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-blue-300/80"
                        style={{ left: `${voImcData.pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-blue-100/90">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Normal</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" />Sobrepeso</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Obesidad</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-blue-200 text-xs sm:text-sm mt-auto mb-2 min-h-[88px]">
                  <TrendingDown className="w-4 h-4" /><span>{perfilesData.vo.meta}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuestionnaireTargetProfile('vo');
                    setShowQuestionnaire(true);
                  }}
                  className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${voReady ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-white/35 shadow-[0_6px_20px_rgba(255,255,255,0.18)]' : 'bg-white/20 hover:bg-white/30 text-white border-white/30 animate-pulse'}`}
                >
                  <span>{voReady ? '✅' : '✨'}</span>
                  <span>{voReady ? 'Actualizar El con IA' : 'Personalizar El con IA'}</span>
                </button>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.15 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setPerfilActivo('va'); setDiaActivo('Lunes'); setTab('plan'); }}
              className="h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-5 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
            >
              {vaReady && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-emerald-500/95 text-white text-[10px] font-bold shadow-sm">
                  ✅ Listo
                </div>
              )}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" />
              <div className="relative h-full flex flex-col">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                  <span className="text-sm sm:text-base font-semibold tracking-wide text-white">Ella</span>
                </div>
                <p className="text-rose-50 text-sm mb-4 leading-relaxed min-h-[72px]">{formatProfileForCard(perfilesData.va.perfil)}</p>
                {vaImcData && (
                  <div className="mb-3 min-h-[70px]">
                    <div className="h-4 mb-1 flex items-center justify-between text-[11px] text-rose-50 font-semibold">
                      <span>IMC {vaImcData.imc}</span>
                      <span>{vaImcData.label}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/25 overflow-hidden">
                      <div
                        className={`h-full ${vaImcData.color}`}
                        style={{ width: `${vaImcData.pct}%` }}
                      />
                      <span
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-rose-300/80"
                        style={{ left: `${vaImcData.pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-rose-50/90">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Normal</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" />Sobrepeso</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Obesidad</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-rose-100 text-xs sm:text-sm mt-auto mb-2 min-h-[88px]">
                  <TrendingDown className="w-4 h-4" /><span>{perfilesData.va.meta}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuestionnaireTargetProfile('va');
                    setShowQuestionnaire(true);
                  }}
                  className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${vaReady ? 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-white/35 shadow-[0_6px_20px_rgba(255,255,255,0.18)]' : 'bg-white/20 hover:bg-white/30 text-white border-white/30 animate-pulse'}`}
                >
                  <span>{vaReady ? '✅' : '✨'}</span>
                  <span>{vaReady ? 'Actualizar Ella con IA' : 'Personalizar Ella con IA'}</span>
                </button>
              </div>
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setPerfilActivo('ambos'); setDiaActivo('Lunes'); setTab('plan'); }}
              className="col-span-2 h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 sm:p-5 md:p-7 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />
              <div className="relative h-full flex flex-col">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                  <span className="text-sm sm:text-base font-semibold tracking-wide text-white">Ambos</span>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm leading-relaxed">
                    Ve y selecciona platillos de ambos perfiles en una sola vista para organizar comidas y compras fácilmente.
                  </p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-100/80">Adelanto IA</p>
                      <p className="text-sm font-semibold text-white">{ambosInsights.sharedMeals} comidas compartidas detectadas</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-100/80">Sinergia</p>
                      <p className="text-sm font-semibold text-white">{ambosInsights.overlapPct}% de ingredientes en común</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    ambosButtonConfig.onClick();
                  }}
                  className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${ambosButtonConfig.style}`}
                >
                  <span>{voReady && vaReady ? '🛒' : '✨'}</span>
                  <span>{ambosButtonConfig.label}</span>
                </button>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main app ────────────────────────────────────────────────────────────────
  const ac = {
    color500: isAmbos ? '#10b981' : isVo ? '#3b82f6' : '#f43f5e',
    bg: isAmbos ? 'bg-emerald-500' : isVo ? 'bg-blue-500' : 'bg-rose-500',
    bgLight: isAmbos ? 'bg-emerald-50' : isVo ? 'bg-blue-50' : 'bg-rose-50',
    bgGradient: isAmbos ? 'from-emerald-500 to-teal-600' : isVo ? 'from-blue-500 to-indigo-600' : 'from-rose-500 to-pink-600',
    bgGradientLight: isAmbos ? 'from-emerald-50 to-teal-50' : isVo ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
    text: isAmbos ? 'text-emerald-600' : isVo ? 'text-blue-600' : 'text-rose-600',
    textDark: isAmbos ? 'text-emerald-900' : isVo ? 'text-blue-900' : 'text-rose-900',
    border: isAmbos ? 'border-emerald-200' : isVo ? 'border-blue-200' : 'border-rose-200',
    borderAccent: isAmbos ? 'border-emerald-500' : isVo ? 'border-blue-500' : 'border-rose-500',
    tagBg: isAmbos ? 'bg-emerald-100' : isVo ? 'bg-blue-100' : 'bg-rose-100',
    tagText: isAmbos ? 'text-emerald-700' : isVo ? 'text-blue-700' : 'text-rose-700',
    progressBg: isAmbos ? 'from-emerald-50 via-teal-50 to-emerald-100' : isVo ? 'from-blue-50 via-sky-50 to-indigo-100' : 'from-rose-50 via-pink-50 to-rose-100',
    progressFill: isAmbos ? 'from-emerald-300 via-teal-400 to-emerald-600' : isVo ? 'from-sky-300 via-blue-400 to-indigo-600' : 'from-pink-300 via-rose-400 to-pink-600',
    btnActive: isAmbos 
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
      : isVo
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
      : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: isAmbos ? 'bg-emerald-500' : isVo ? 'bg-blue-500' : 'bg-rose-500',
    cardDone: isAmbos 
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-200'
      : isVo
      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-blue-200'
      : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400 shadow-rose-200',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: isAmbos ? 'bg-emerald-50 border border-emerald-100' : isVo ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100',
    iconColorPending: isAmbos ? 'text-emerald-400' : isVo ? 'text-blue-400' : 'text-rose-400',
    momentoIconBgDone: isAmbos ? 'bg-emerald-50 border border-emerald-100' : isVo ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100',
    momentoIconColorDone: isAmbos ? 'text-emerald-600' : isVo ? 'text-blue-600' : 'text-rose-600',
    momentoIconBgPending: 'bg-slate-100 border border-slate-200',
    momentoIconColorPending: 'text-slate-500',
    headerBg: isAmbos ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : isVo
      ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
      : 'bg-gradient-to-r from-rose-500 to-pink-600',
  };

  const accentColors = {
    bg: ac.bg, bgLight: ac.bgLight, bgGradient: ac.bgGradient,
    text: ac.text, border: ac.border, borderAccent: ac.borderAccent,
    tagBg: ac.tagBg, tagText: ac.tagText,
  };

  const totalMomentos = perfil!.momentos.length;

  // Header height approx: 52px mobile, 56px desktop
  // Progress bar sticky height: ~56px (compact) or ~auto (expanded)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" data-profile={perfilActivo}>

      {/* ── Main sticky header (z-50) ──────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setPerfilActivo(null)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center shadow-md flex-shrink-0 hidden sm:flex`}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 items-center">
            {(['vo', 'va', 'ambos'] as const).map((p) => (
              <button key={p}
                onClick={() => { setPerfilActivo(p); setDiaActivo('Lunes'); setTab('plan'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${perfilActivo === p ? ac.btnActive : ac.btnInactive}`}
              >
                {p === 'ambos' ? 'Ambos' : perfilesData[p].nombre}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ── DAILY PROGRESS — Sticky right below the header (only in tab=plan) ── */}
      <AnimatePresence>
        {tab === 'plan' && (
          <motion.div
            key={`progress-${perfilActivo}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={`sticky top-[52px] sm:top-[56px] z-40 bg-white/97 backdrop-blur-xl border-b ${ac.border} shadow-md`}
          >
            {/* ── Day selector (Unified) ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100/60">
              <div className="flex gap-1.5 overflow-x-auto snap-x scrollbar-none items-center">
                {diasDisponibles.map((dia) => (
                  <button key={dia} onClick={(e) => { e.stopPropagation(); setDiaActivo(dia); }}
                    className={`py-1.5 px-3 rounded-xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${diaActivo === dia ? `${ac.btnActive} shadow-sm` : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'}`}>
                    <span className="sm:hidden">{dia.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{dia}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Always visible compact bar ── */}
            <div
              className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setProgressExpanded((e) => !e)}
            >
              {/* Active day icon */}
              <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${ac.bgGradient} flex-shrink-0 shadow-sm`}>
                <TrendingDown className="w-3 h-3 text-white" />
              </div>

              {/* Moment indicators — clickable to navigate to that section */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {perfil!.momentos.map((momento) => {
                  const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                  const done = momentoCompletado[momento.key];
                  return (
                    <button
                      key={momento.key}
                      title={`Ir a ${momento.label}`}
                      onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, progressExpanded); }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                        done
                          ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-80`
                          : `${ac.bgLight} border ${ac.border} hover:opacity-70`
                      }`}
                    >
                      {done
                        ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        : <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${ac.iconColorPending}`} />
                      }
                    </button>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className={`flex-1 h-2 bg-gradient-to-r ${ac.progressBg} rounded-full overflow-hidden shadow-inner shadow-slate-200/70`}>
                <motion.div
                  className={`h-full bg-gradient-to-r ${ac.progressFill} rounded-full shadow-[0_0_12px_rgba(15,23,42,0.25)]`}
                  animate={{ width: `${progresoDia}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
              </div>

              {/* Percentage */}
              <span className={`text-[11px] sm:text-xs font-bold ${progresoDia === 100 ? 'text-emerald-600' : ac.text} flex-shrink-0 tabular-nums w-7 sm:w-8 text-right`}>
                {progresoDia}%
              </span>

              {/* Toggle expand */}
              <button
                className={`flex-shrink-0 p-1 rounded-full hover:${ac.bgLight} transition-colors`}
                onClick={(e) => { e.stopPropagation(); setProgressExpanded((x) => !x); }}
                aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
              >
                {progressExpanded
                  ? <ChevronUp className={`w-4 h-4 ${ac.text}`} />
                  : <ChevronDown className={`w-4 h-4 ${ac.text}`} />
                }
              </button>
            </div>

            {/* ── Expanded panel with moment cards ── */}
            <AnimatePresence>
              {progressExpanded && (
                <motion.div
                  key="progress-expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="overflow-hidden"
                >
                  <div className={`max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] text-slate-500">
                        {completadosCount} de {totalMomentos} momentos completados
                      </p>
                      {progresoDia === 100 && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Día completo! 🎉
                        </span>
                      )}
                    </div>

                    {/* Moment cards — clickable to navigate to section */}
                    <div className="grid grid-cols-5 gap-2">
                      {perfil!.momentos.map((momento) => {
                        const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                        const done = momentoCompletado[momento.key];
                        const shortLabel = momento.label
                          .replace('Colación ', 'Col. ')
                          .replace('mañana', 'AM')
                          .replace('tarde', 'PM');
                        return (
                          <motion.button
                            key={momento.key}
                            animate={{ scale: done ? 1.03 : 1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key, true); }}
                            className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                              done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`
                            }`}
                          >
                            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${done ? ac.iconDone : ac.iconPending}`}>
                              {done
                                ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                : <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${ac.iconColorPending}`} />
                              }
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight ${done ? 'text-white' : 'text-slate-700'}`}>
                              {shortLabel}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] text-center leading-tight ${done ? 'text-white/70' : 'text-slate-400'}`}>
                              {momento.hora}
                            </span>
                            {done && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center shadow"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28 sm:pb-8 space-y-4">

        {/* Health note */}
        {perfil!.notaSalud && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">{perfil!.notaSalud}</p>
          </motion.div>
        )}

        {/* ── Desktop Tab Nav (Hidden on Mobile) */}
        <div className="hidden sm:block">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl">
            {([
              { key: 'plan' as const, label: 'Mi Plan', icon: Calendar },
              { key: 'equivalencias' as const, label: 'Equivalencias', icon: BookOpen },
              { key: 'compras' as const, label: 'Compras', icon: ShoppingCart }, 
              { key: 'resumen' as const, label: 'Resumen', icon: Lightbulb },
            ]).map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] font-bold text-sm transition-all duration-300 active:scale-95 ${tab === t.key ? `bg-white shadow-sm ${ac.text}` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{t.label}</span>
                </button>
            ))}
          </motion.div>
        </div>

        {/* ── Mobile Bottom Tab Nav (Docked) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_30px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-around items-center max-w-sm mx-auto pt-1.5 pb-1.5">
            {([
              { key: 'plan' as const, label: 'Plan', icon: Calendar },
              { key: 'equivalencias' as const, label: 'Extras', icon: BookOpen },
              { key: 'compras' as const, label: 'Compras', icon: ShoppingCart }, 
              { key: 'resumen' as const, label: 'Resumen', icon: Lightbulb },
            ]).map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`relative flex flex-col items-center justify-center gap-1 w-[72px] py-1 transition-all duration-200 active:scale-95 ${active ? ac.text : 'text-slate-400 hover:text-slate-500'}`}>
                  <div className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${active ? `bg-gradient-to-br ${ac.bgGradientLight} shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-${ac.border.split('-')[1]}-100` : 'bg-transparent'}`}>
                    <t.icon className={`w-[18px] h-[18px] ${active ? `fill-current opacity-20 absolute` : ''}`} />
                    <t.icon className="w-[18px] h-[18px] relative z-10" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] tracking-wide ${active ? `font-extrabold ${ac.textDark}` : 'font-medium'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content */}
        <AnimatePresence mode="wait">

          {/* ════ PLAN ════ */}
          {tab === 'plan' && (
            <motion.div key="plan"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="space-y-4">

              {/* ── Meal cards ─────────────────────────────────────────────── */}
              <div className="space-y-4">
                {perfilBase.momentos.map((momento) => {
                  const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                  const done = momentoCompletado[momento.key];
                  const estaEnEdicionVo = Boolean(momentosEnEdicion[`${momento.key}-vo`]);
                  const estaEnEdicionVa = Boolean(momentosEnEdicion[`${momento.key}-va`]);
                  const estaEnEdicionSingle = Boolean(momentosEnEdicion[momento.key]);
                  const estaEnEdicion = isAmbos ? (estaEnEdicionVo || estaEnEdicionVa) : estaEnEdicionSingle;
                  const mealsSingleAll = perfilBase.plan[diaActivo]?.[momento.key] || [];
                  const mealsVOAll = perfilesData.vo.plan[diaActivo]?.[momento.key] || [];
                  const mealsVAAll = perfilesData.va.plan[diaActivo]?.[momento.key] || [];
                  const mealsSingleSeleccionadas = mealsSingleAll.filter(m => selecciones[`${perfilActivo}-${diaActivo}-${momento.key}-${m.nombre}`]);
                  const mealsVOSeleccionadas = mealsVOAll.filter(m => selecciones[`vo-${diaActivo}-${momento.key}-${m.nombre}`]);
                  const mealsVASeleccionadas = mealsVAAll.filter(m => selecciones[`va-${diaActivo}-${momento.key}-${m.nombre}`]);
                  const porcionesSingleMomento = !isAmbos && perfilActivo ? getMomentMacroPortions(perfilesData[perfilActivo], momento.key) : [];
                  const porcionesVoMomento = getMomentMacroPortions(perfilesData.vo, momento.key);
                  const porcionesVaMomento = getMomentMacroPortions(perfilesData.va, momento.key);
                  const isElegidoVacio = !estaEnEdicion && !isAmbos && (
                    mealsSingleSeleccionadas.length === 0
                  );

                  return (
                    <motion.div
                      layout
                      key={momento.key}
                      ref={(el) => { mealSectionRefs.current[momento.key] = el; }}
                      className={`bg-white rounded-[28px] sm:rounded-3xl shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] border border-white/70 overflow-hidden transition-shadow duration-300 ${done ? ac.borderAccent : ''}`}
                    >
                      <button
                        onClick={() => {
                          if (!estaEnEdicion) {
                            setMomentosColapsados(p => ({...p, [momento.key]: !p[momento.key]}));
                          }
                        }}
                        className={`w-full flex items-center justify-between text-left p-4 sm:p-5 transition-colors focus:outline-none ${done ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${estaEnEdicion ? 'cursor-default' : ''}`}
                      >
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            done ? ac.momentoIconBgDone : ac.momentoIconBgPending
                          }`}>
                            <Icon className={`w-3.5 h-3.5 ${
                              done ? ac.momentoIconColorDone : ac.momentoIconColorPending
                            }`} />
                          </div>
                          <span className="truncate">{momento.label}</span>
                          <span className="text-[10px] font-normal text-slate-400 ml-2 whitespace-nowrap">{momento.hora}</span>
                        </h3>
                        {estaEnEdicion ? (
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br ${ac.bgGradient}`} />
                        ) : (
                          <motion.div animate={{ rotate: momentosColapsados[momento.key] ? -180 : 0 }} transition={{ type: "spring", damping: 20 }}>
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          </motion.div>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {(!momentosColapsados[momento.key] || estaEnEdicion) && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 200 }}
                          >
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                              {isElegidoVacio ? (
                                <div className="text-center py-6 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                  <p className="text-slate-500 text-sm font-medium">Ningún platillo reservado</p>
                                  <p className="text-slate-400 text-xs mt-1">Elige tu comida para este horario.</p>
                                  <button
                                    onClick={() => setMomentosEnEdicion((prev) => ({ ...prev, [momento.key]: true }))}
                                    className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r ${ac.bgGradient} shadow-sm hover:opacity-95 active:scale-95 transition`}
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                    Ir a elegir
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {!isAmbos && (
                                    !estaEnEdicion ? (
                                      <div className="space-y-3">
                                        {mealsSingleSeleccionadas.map((meal, idx) => (
                                          <div key={idx} className={`p-4 rounded-2xl border border-white/70 bg-gradient-to-br ${ac.bgLight} via-white to-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]`}>
                                            <h4 className={`font-bold text-sm mb-1 ${ac.text}`}>{meal.nombre}</h4>
                                            <p className="text-slate-600 text-xs leading-relaxed">{meal.detalle}</p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                              {porcionesSingleMomento.map((item) => (
                                                <span
                                                  key={`${meal.nombre}-${item.key}-${item.cantidad}`}
                                                  title={`${item.label} ${item.cantidad}`}
                                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${ac.tagBg} ${ac.tagText} text-[11px] font-bold`}
                                                >
                                                  <span className="w-5 h-5 rounded-full bg-white/70 flex items-center justify-center text-[12px] shadow-sm shadow-slate-200/50">
                                                    {item.icon}
                                                  </span>
                                                  <span>x{item.cantidad}</span>
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                        <button
                                          onClick={() => setMomentosEnEdicion((prev) => ({ ...prev, [momento.key]: true }))}
                                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${ac.text} ${ac.bgLight} border ${ac.border} hover:opacity-90 active:scale-95 transition`}
                                        >
                                          <Zap className="w-3.5 h-3.5" />
                                          Cambiar opción
                                        </button>
                                      </div>
                                    ) : (
                                      <MealSelector
                                        perfil={perfilActivo}
                                        comidas={mealsSingleAll}
                                        dia={diaActivo}
                                        momento={momento.key}
                                        selecciones={selecciones}
                                        onToggle={(perfilId, dia, momentoKey, nombre) => {
                                          toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                          setMomentosEnEdicion((prev) => ({ ...prev, [momentoKey]: false }));
                                        }}
                                        accentClasses={accentColors}
                                      />
                                    )
                                  )}

                                  {isAmbos && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-3">
                                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Para {perfilesData.vo.nombre}</div>
                                        {!estaEnEdicionVo ? (
                                          <>
                                            {mealsVOSeleccionadas.length > 0 ? (
                                              mealsVOSeleccionadas.map((meal, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 via-white to-white shadow-[0_10px_24px_rgba(37,99,235,0.10)]">
                                                  <h4 className="font-bold text-sm mb-1 text-blue-800">{meal.nombre}</h4>
                                                  <p className="text-slate-600 text-xs leading-relaxed">{meal.detalle}</p>
                                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {porcionesVoMomento.map((item) => (
                                                      <span key={`${meal.nombre}-${item.key}-${item.cantidad}`} title={`${item.label} ${item.cantidad}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                                                        <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[12px] shadow-sm shadow-blue-200/60">{item.icon}</span>
                                                        <span>x{item.cantidad}</span>
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="text-center py-5 px-4 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
                                                <p className="text-blue-700 text-sm font-semibold">Ningún platillo reservado</p>
                                              </div>
                                            )}
                                            <button
                                              onClick={() => setMomentosEnEdicion((prev) => ({ ...prev, [`${momento.key}-vo`]: true }))}
                                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-95 transition"
                                            >
                                              <Zap className="w-3.5 h-3.5" />
                                              {mealsVOSeleccionadas.length > 0 ? 'Cambiar opción para él' : 'Ir a elegir para él'}
                                            </button>
                                          </>
                                        ) : (
                                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <MealSelector
                                              perfil="vo"
                                              comidas={mealsVOAll}
                                              dia={diaActivo}
                                              momento={momento.key}
                                              selecciones={selecciones}
                                              onToggle={(perfilId, dia, momentoKey, nombre) => {
                                                toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                                setMomentosEnEdicion((prev) => ({ ...prev, [`${momentoKey}-vo`]: false }));
                                              }}
                                              accentClasses={{
                                                bg: 'bg-blue-500', bgLight: 'bg-blue-50', bgGradient: 'from-blue-500 to-indigo-600',
                                                text: 'text-blue-600', border: 'border-blue-200', borderAccent: 'border-blue-500',
                                                tagBg: 'bg-blue-100', tagText: 'text-blue-700'
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div className="space-y-3">
                                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">Para {perfilesData.va.nombre}</div>
                                        {!estaEnEdicionVa ? (
                                          <>
                                            {mealsVASeleccionadas.length > 0 ? (
                                              mealsVASeleccionadas.map((meal, idx) => (
                                                <div key={idx} className="p-4 rounded-2xl border border-white/70 bg-gradient-to-br from-rose-50 via-white to-white shadow-[0_10px_24px_rgba(244,63,94,0.10)]">
                                                  <h4 className="font-bold text-sm mb-1 text-rose-800">{meal.nombre}</h4>
                                                  <p className="text-slate-600 text-xs leading-relaxed">{meal.detalle}</p>
                                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {porcionesVaMomento.map((item) => (
                                                      <span key={`${meal.nombre}-${item.key}-${item.cantidad}`} title={`${item.label} ${item.cantidad}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                                                        <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center text-[12px] shadow-sm shadow-rose-200/60">{item.icon}</span>
                                                        <span>x{item.cantidad}</span>
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="text-center py-5 px-4 bg-rose-50/50 rounded-xl border border-dashed border-rose-200">
                                                <p className="text-rose-700 text-sm font-semibold">Ningún platillo reservado</p>
                                              </div>
                                            )}
                                            <button
                                              onClick={() => setMomentosEnEdicion((prev) => ({ ...prev, [`${momento.key}-va`]: true }))}
                                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition"
                                            >
                                              <Zap className="w-3.5 h-3.5" />
                                              {mealsVASeleccionadas.length > 0 ? 'Cambiar opción para ella' : 'Ir a elegir para ella'}
                                            </button>
                                          </>
                                        ) : (
                                          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                                            <MealSelector
                                              perfil="va"
                                              comidas={mealsVAAll}
                                              dia={diaActivo}
                                              momento={momento.key}
                                              selecciones={selecciones}
                                              onToggle={(perfilId, dia, momentoKey, nombre) => {
                                                toggleSeleccion(perfilId, dia, momentoKey, nombre);
                                                setMomentosEnEdicion((prev) => ({ ...prev, [`${momentoKey}-va`]: false }));
                                              }}
                                              accentClasses={{
                                                bg: 'bg-rose-500', bgLight: 'bg-rose-50', bgGradient: 'from-rose-500 to-pink-600',
                                                text: 'text-rose-600', border: 'border-rose-200', borderAccent: 'border-rose-500',
                                                tagBg: 'bg-rose-100', tagText: 'text-rose-700'
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {progresoDia === 100 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`mt-8 p-6 lg:p-8 rounded-[2rem] bg-gradient-to-br ${ac.bgGradient} text-white shadow-xl shadow-${ac.bg.split('-')[1]}-500/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6`}
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-5 z-10 text-center sm:text-left">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex flex-shrink-0 items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-8 h-8 text-white drop-shadow" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1">¡Día Completado! 🎉</h3>
                      <p className="text-white/80 text-sm max-w-sm">
                        Has registrado todas tus comidas planeadas para hoy. Mantén el excelente ritmo.
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleDownloadDayPdf} 
                    className="z-10 group flex items-center gap-2 bg-white text-slate-800 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
                  >
                    <FileText className={`w-5 h-5 ${ac.text}`} /> 
                    <span>Descargar Menú</span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ EQUIVALENCIES ════ */}
          {tab === 'equivalencias' && (
            <motion.div key="equivalencias"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="space-y-6">
              {isAmbos ? (
                <>
                  <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-2 mx-auto max-w-xs shadow-inner w-full">
                    <button onClick={() => setAmbosSubTab('vo')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'vo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{perfilesData.vo.nombre}</button>
                    <button onClick={() => setAmbosSubTab('va')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'va' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>{perfilesData.va.nombre}</button>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className={`${ambosSubTab === 'vo' ? 'block' : 'hidden lg:block'}`}>
                      <h3 className="text-sm font-bold text-blue-800 mb-3 px-1 uppercase tracking-wider">Equivalencias de {perfilesData.vo.nombre}</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                        {equivalenciasData.vo.map((eq, idx) => (
                          <EquivalenciasCard key={'vo'+idx} equivalencia={eq} delay={idx * 0.05} accentClasses={{...ac, bgLight: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100', tagText: 'text-blue-700'}} />
                        ))}
                      </div>
                    </div>
                    <div className={`${ambosSubTab === 'va' ? 'block' : 'hidden lg:block'}`}>
                      <h3 className="text-sm font-bold text-rose-800 mb-3 px-1 uppercase tracking-wider">Equivalencias de {perfilesData.va.nombre}</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                        {equivalenciasData.va.map((eq, idx) => (
                          <EquivalenciasCard key={'va'+idx} equivalencia={eq} delay={idx * 0.05} accentClasses={{...ac, bgLight: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100', tagText: 'text-rose-700'}} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {equivalencias.map((eq, idx) => (
                    <EquivalenciasCard key={idx} equivalencia={eq} delay={idx * 0.05} accentClasses={accentColors} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ SUMMARY ════ */}
          {tab === 'resumen' && (
            <motion.div key="resumen"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`w-full overflow-hidden sm:overflow-visible flex flex-col`}>
              
              {isAmbos && (
                <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-4 mx-auto max-w-xs shadow-inner w-full">
                  <button onClick={() => setAmbosSubTab('vo')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'vo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{perfilesData.vo.nombre}</button>
                  <button onClick={() => setAmbosSubTab('va')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'va' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>{perfilesData.va.nombre}</button>
                </div>
              )}

              <div className={isAmbos ? "grid lg:grid-cols-2 gap-8" : "space-y-10"}>
                {(isAmbos ? [perfilesData.vo, perfilesData.va] : [perfil!]).map((p, pIdx) => {
                  const isFirst = pIdx === 0;
                  const pfKey = isFirst ? 'vo' : 'va';
                  const hiddenClass = isAmbos ? (ambosSubTab === pfKey ? 'block' : 'hidden lg:block') : 'block';
                  const dynamicAc = isAmbos ? {
                    ...ac,
                    color500: isFirst ? '#3b82f6' : '#f43f5e',
                    text: isFirst ? 'text-blue-600' : 'text-rose-600',
                    textDark: isFirst ? 'text-blue-900' : 'text-rose-900',
                    bgLight: isFirst ? 'bg-blue-50' : 'bg-rose-50',
                    bgGradientLight: isFirst ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
                    border: isFirst ? 'border-blue-200' : 'border-rose-200',
                    dot: isFirst ? 'bg-blue-500' : 'bg-rose-500',
                  } : ac;

                  return (
                    <div key={p.perfil} className={`space-y-4 ${hiddenClass}`}>
                    {isAmbos && (
                      <h3 className={`text-lg font-bold pb-2 border-b-2 mt-4 ${isFirst ? 'text-blue-800 border-blue-200' : 'text-rose-800 border-rose-200'}`}>
                        Resumen de {p.nombre}
                      </h3>
                    )}

                    {p.objetivosPorMomento && (
                      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100/80 overflow-hidden relative w-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10" />
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <BarChart3 className={`w-4 h-4 ${dynamicAc.text}`} />
                          Tabla de Macros y Porciones
                        </h3>
                        
                        {/* Mobile Grid Layout - Improved */}
                        <div className="grid grid-cols-2 gap-3 sm:hidden mt-4">
                          {[
                            { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-rose-500', bg: 'bg-rose-50' },
                            { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-50' },
                            { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-red-500', bg: 'bg-red-50' },
                            { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-lime-500', bg: 'bg-lime-50' },
                            { key: 'leche', label: 'Leche', icon: '🥛', color: 'text-blue-500', bg: 'bg-blue-50' },
                            { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-amber-700', bg: 'bg-amber-100' },
                          ].map(cat => {
                            const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                            const mLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'];
                            const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
                            return (
                              <div key={cat.key} className={`${cat.bg} rounded-xl p-3 border border-slate-100`}>
                                <div className="flex items-center justify-between mb-2.5">
                                  <span className={`font-bold text-slate-700 text-xs flex items-center gap-1.5 ${cat.color}`}>
                                    <span className="text-base">{cat.icon}</span> 
                                    <span className="truncate">{cat.label}</span>
                                  </span>
                                  <span className={`font-black ${cat.color} text-lg bg-white shadow-sm px-2 py-0.5 rounded-md min-w-[28px] text-center`}>{total}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1">
                                  {mKeys.map((m, idx) => {
                                    const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                                    const isActive = val > 0;
                                    return (
                                      <div key={m} className="flex flex-col items-center">
                                        <span className={`text-[8px] font-bold uppercase ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{mLabels[idx]}</span>
                                        <span className={`text-sm font-bold ${isActive ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden sm:block overflow-x-auto w-full scrollbar-none">
                          <table className="w-full text-left text-sm min-w-max">
                            <thead>
                              <tr className={`border-b-2 ${dynamicAc.border} text-slate-400 font-bold uppercase tracking-wider text-[11px]`}>
                                <th className="p-3 pb-3 sticky left-0 bg-white/95 backdrop-blur-md z-10 w-28">Grupo</th>
                                {['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'].map(l => <th key={l} className="p-3 pb-3 text-center w-16">{l}</th>)}
                                <th className="p-3 pb-3 text-center bg-slate-50/50 rounded-tr-xl w-16">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60">
                              {[
                                { key: 'frutas', label: 'Frutas', icon: '🍎' },
                                { key: 'verduras', label: 'Verduras', icon: '🥦' },
                                { key: 'cereales', label: 'Cereales', icon: '🌾' },
                                { key: 'proteina', label: 'Proteína', icon: '🥩' },
                                { key: 'grasas', label: 'Grasas', icon: '🥑' },
                                { key: 'leche', label: 'Leche', icon: '🥛' },
                                { key: 'leguminosas', label: 'Leguminosas', icon: '🫘' },
                              ].map((cat) => {
                                const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                                const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
                                return (
                                  <tr key={cat.key} className="hover:bg-slate-50/70 transition-colors group">
                                    <td className="p-3 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-md z-10 font-bold text-slate-700 flex items-center gap-2 border-r border-transparent group-hover:border-slate-100/50 transition-colors">
                                      <span className="text-base drop-shadow-sm">{cat.icon}</span> {cat.label}
                                    </td>
                                    {mKeys.map(m => {
                                      const val = p.objetivosPorMomento?.[m]?.[cat.key] || 0;
                                      return (
                                        <td key={m} className={`p-3 text-center font-medium ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                          {val}
                                        </td>
                                      )
                                    })}
                                    <td className={`p-3 text-center font-bold ${dynamicAc.text} bg-slate-50/50`}>{total}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="relative rounded-2xl overflow-hidden shadow-sm">
                      <img src="/images/meal-prep.png" alt="Plan de comidas" className="w-full h-36 sm:h-44 object-cover" />
                      <div className={`absolute inset-0 bg-gradient-to-r ${dynamicAc.bgGradient} opacity-60`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                          <Shield className="w-6 h-6" />
                          Sobre {p.nombre}
                        </h2>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <Heart className={`w-4 h-4 ${dynamicAc.text}`} />
                        Puntos clave de tu plan
                      </h3>
                      <div className="space-y-2.5">
                        {p.resumenPersonal.map((linea, idx) => (
                          <motion.div key={idx}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                            className="flex gap-3 p-3 rounded-xl bg-slate-50"
                            style={{ borderLeft: `3px solid ${dynamicAc.color500}` }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${dynamicAc.dot} mt-1.5 flex-shrink-0`} />
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{linea}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>



                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`bg-gradient-to-br ${dynamicAc.bgGradientLight} rounded-2xl p-4 border ${dynamicAc.border}`}>
                        <h3 className={`font-bold ${dynamicAc.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                          <TrendingDown className="w-3.5 h-3.5" /> Meta
                        </h3>
                        <p className={`${dynamicAc.text} text-xs sm:text-sm`}>{p.meta}</p>
                      </div>
                      <div className={`bg-gradient-to-br ${isAmbos ? (isFirst ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-rose-50 to-pink-50 border-rose-200') : 'from-emerald-50 to-green-50 border-emerald-200'} rounded-2xl p-4 border`}>
                        <h3 className={`font-bold ${isAmbos ? (isFirst ? 'text-blue-900' : 'text-rose-900') : 'text-emerald-900'} mb-1.5 text-xs sm:text-sm`}>Perfil</h3>
                        <p className={`${isAmbos ? (isFirst ? 'text-blue-700' : 'text-rose-700') : 'text-emerald-700'} text-xs sm:text-sm`}>{p.perfil}</p>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ════ SHOPPING ════ */}
          {tab === 'compras' && (
            <motion.div key="compras"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="space-y-4">
              
              <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 overflow-hidden relative">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />
                
                <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm flex items-center justify-center`}>
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  Supermercado
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed max-w-xl">
                  Tienes <strong className="text-emerald-600">{listaCompras.length} ingredientes</strong> en tu lista basados en tus platillos seleccionados. Recuerda revisar la alacena antes de salir.
                </p>

                {listaCompras.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-[20px] border-dashed border-2 border-slate-200">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Carrito vacío</p>
                    <p className="text-slate-400 text-sm mt-1">Ve a "Mi Plan" y selecciona comidas para agregar ingredientes automáticamente.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {listaCompras.map((item) => {
                      const isChecked = comprasCheck[item.ingrediente];
                      return (
                        <motion.div 
                          whileTap={{ scale: 0.98 }} 
                          key={item.ingrediente} 
                          onClick={() => setComprasCheck(prev => ({...prev, [item.ingrediente]: !prev[item.ingrediente]}))}
                          className={`group p-0 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${isChecked ? 'bg-slate-50 border-emerald-200 opacity-60' : 'bg-white border-slate-100 hover:shadow-md'}`}
                        >
                          <div className={`w-1.5 transition-colors ${isChecked ? 'bg-emerald-400' : 'bg-gradient-to-b from-slate-200 to-transparent group-hover:from-emerald-400 group-hover:to-teal-500'}`} />
                          <div className="p-4 sm:p-5 flex-1 min-w-0">
                            <div className="flex items-start gap-4 mb-3">
                              <div className={`w-6 h-6 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-200 group-hover:border-emerald-500 bg-slate-50'}`}>
                                {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className={`font-bold tracking-tight text-base capitalize leading-snug break-words ${isChecked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.ingrediente}</h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">{item.usos.length} recet{item.usos.length > 1 ? 'as' : 'a'} lo ocupa{item.usos.length > 1 ? 'n' : ''}</p>
                              </div>
                            </div>
                            <ul className="space-y-2 ml-10">
                              {item.usos.map((uso, idx) => (
                                <li key={idx} className={`flex gap-2 text-xs relative rounded-lg p-2 items-center ${isChecked ? 'bg-slate-100/50' : 'bg-slate-50'}`}>
                                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                                    uso.perfil === 'vo' ? 'bg-blue-100/80 text-blue-700' : 'bg-rose-100/80 text-rose-700'
                                  }`}>{uso.perfil}</span>
                                  <span className={`font-medium leading-snug break-words ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>{uso.texto}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/50 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-slate-500 text-xs sm:text-sm">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
            Plan de alimentación personalizado — 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
