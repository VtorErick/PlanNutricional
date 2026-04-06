import React, { createContext, useContext, useState, useMemo, useRef, useEffect, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Profile, Equivalencia } from '../types';
import { perfilesData as origPerfilesData, equivalenciasData as origEquivData, iconsMap } from '../data';
import { AccentColors, getAccentColors } from '../utils/theme';
import { Heart } from 'lucide-react';
import { parseObjectToData } from '../dataManager';
import { callGeminiDirectly } from '../services/aiService';
import { showAppAlert, showAppConfirm } from '../utils/appDialogs';
import type { QuestionnairePayload, TargetProfile } from '../components/NutritionQuestionnaire';
import { enrichPlanWithNutrition } from '../utils/nutrition';

export type PerfilActivo = 'el' | 'ella' | 'ambos' | null;
export type TabState = 'plan' | 'equivalencias' | 'compras' | 'resumen';

// ─── Context Interface ───────────────────────────────────────────────
interface DietContextType {
  // Navigation & Profile Selection
  perfilActivo: PerfilActivo;
  setPerfilActivo: React.Dispatch<React.SetStateAction<PerfilActivo>>;
  tab: TabState;
  setTab: React.Dispatch<React.SetStateAction<TabState>>;

  // View toggles
  showAdmin: boolean;
  setShowAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  showQuestionnaire: boolean;
  setShowQuestionnaire: React.Dispatch<React.SetStateAction<boolean>>;

  // Date and Week logic
  diaActivo: string;
  setDiaActivo: React.Dispatch<React.SetStateAction<string>>;
  diasDisponibles: string[];

  // Persisted Database State
  selecciones: Record<string, boolean>;
  setSelecciones: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toggleSeleccion: (perfilId: string, dia: string, momentoKey: string, nombre: string) => void;
  comprasCheck: Record<string, boolean>;
  setComprasCheck: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // AI & Custom Data
  dataVersions: { el: 'original' | 'custom'; ella: 'original' | 'custom' };
  setDataVersions: React.Dispatch<React.SetStateAction<{ el: 'original' | 'custom'; ella: 'original' | 'custom' }>>;
  customData: any;
  setCustomData: React.Dispatch<React.SetStateAction<any>>;
  perfilesData: Record<string, Profile>;
  equivalenciasData: Record<string, Equivalencia[]>;

  // Gemini AI settings
  geminiApiKey: string;
  setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
  geminiModel: string;
  setGeminiModel: React.Dispatch<React.SetStateAction<string>>;
  generationLoading: boolean;
  generationError: string;
  lastGeneratedData: any;
  handleGenerateWithAi: (payload: QuestionnairePayload) => Promise<void>;

  // Questionnaire state
  questionnaireTargetProfile: TargetProfile;
  setQuestionnaireTargetProfile: React.Dispatch<React.SetStateAction<TargetProfile>>;
  questionnaireStepIdx: number;
  setQuestionnaireStepIdx: React.Dispatch<React.SetStateAction<number>>;
  questionnaireEl: any;
  setQuestionnaireEl: React.Dispatch<React.SetStateAction<any>>;
  questionnaireElla: any;
  setQuestionnaireElla: React.Dispatch<React.SetStateAction<any>>;
  questionnairePortionMode: 'auto' | 'manual';
  setQuestionnairePortionMode: React.Dispatch<React.SetStateAction<'auto' | 'manual'>>;
  questionnaireManualPortions: Record<string, Record<string, number>>;
  setQuestionnaireManualPortions: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  questionnaireAdditionalNotes: string;
  setQuestionnaireAdditionalNotes: React.Dispatch<React.SetStateAction<string>>;

  // UI States
  momentosColapsados: Record<string, boolean>;
  setMomentosColapsados: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  progressExpanded: boolean;
  setProgressExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  momentosEnEdicion: Record<string, boolean>;
  setMomentosEnEdicion: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // Progress Tracking
  momentoCompletado: Record<string, boolean>;
  progresoDia: number;
  completadosCount: number;
  totalMomentosProgress: number;

  // Scroll
  scrollToMomento: (momentoKey: string, isExpanded: boolean) => void;
  mealSectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;

  // Computed
  isAmbos: boolean;
  perfilBase: Profile;
  perfilObj: Profile | null;
  ac: AccentColors;

  // Utility
  notify: (title: string, message: string) => Promise<void>;
  confirmAction: (title: string, message: string) => Promise<boolean>;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

// ─── Default questionnaire data ──────────────────────────────────────
const defaultQuestionnaireData = (weight: string, height: string) => ({
  age: '', currentWeightKg: weight, heightCm: height, targetWeightKg: '',
  objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
  medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
  dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
  wakeTime: '', sleepTime: '', trainingFrequency: ''
});

// ─── Provider ────────────────────────────────────────────────────────
export const DietProvider = ({ children }: { children: ReactNode }) => {
  // 1. Navigation
  const [perfilActivo, setPerfilActivo] = useState<PerfilActivo>(null);
  const [tab, setTab] = useState<TabState>('plan');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // 2. Days
  const diasDisponibles = useMemo(() => ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"], []);
  const [diaActivo, setDiaActivo] = useLocalStorage<string>('diaActivo', 'Lunes');

  // 3. Persisted State
  const [selecciones, setSelecciones] = useLocalStorage<Record<string, boolean>>('seleccionesDieta', {});
  const [comprasCheck, setComprasCheck] = useLocalStorage<Record<string, boolean>>('comprasCheck', {});
  const [momentosColapsados, setMomentosColapsados] = useState<Record<string, boolean>>({});

  // 3.1 Custom Data
  const [dataVersions, setDataVersions] = useLocalStorage<{ el: 'original' | 'custom'; ella: 'original' | 'custom' }>('dataVersions', { el: 'original', ella: 'original' });
  const [customData, setCustomData] = useLocalStorage<any>('customData', {});

  // 4. UI States
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [momentosEnEdicion, setMomentosEnEdicion] = useState<Record<string, boolean>>({});

  // 5. Gemini AI settings
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem('geminiApiKey') || '';
      const fromEnv = (import.meta as any).env?.GEMINI_API_KEY || '';
      return saved || fromEnv;
    } catch { return ''; }
  });
  const [geminiModel, setGeminiModel] = useState(() => {
    try {
      const saved = localStorage.getItem('geminiModel');
      const validModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'];
      if (!saved || saved === 'gemini-1.5-flash' || !validModels.includes(saved)) {
        localStorage.setItem('geminiModel', 'gemini-2.5-flash');
        return 'gemini-2.5-flash';
      }
      return saved;
    } catch { return 'gemini-2.5-flash'; }
  });
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [lastGeneratedData, setLastGeneratedData] = useState<any>(null);

  // 6. Questionnaire state
  const [questionnaireTargetProfile, setQuestionnaireTargetProfile] = useState<TargetProfile>('ambos');
  const [questionnaireStepIdx, setQuestionnaireStepIdx] = useState(0);
  const [questionnaireEl, setQuestionnaireEl] = useState<any>(defaultQuestionnaireData('70', '165'));
  const [questionnaireElla, setQuestionnaireElla] = useState<any>(defaultQuestionnaireData('60', '160'));
  const [questionnairePortionMode, setQuestionnairePortionMode] = useState<'auto' | 'manual'>('auto');
  const [questionnaireManualPortions, setQuestionnaireManualPortions] = useState<Record<string, Record<string, number>>>({});
  const [questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes] = useState('');

  // 7. Scroll refs
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingAutoScrollMomento, setPendingAutoScrollMomento] = useState<string | null>(null);

  // ─── Utilities ─────────────────────────────────────────────────────
  const notify = useCallback(async (title: string, message: string) => { await showAppAlert({ title, message }); }, []);
  const confirmAction = useCallback(async (title: string, message: string) => showAppConfirm({ title, message }), []);

  // ─── Computed: Profiles & Equivalences ─────────────────────────────
  const perfilesData: Record<string, Profile> = useMemo(() => ({
    el: dataVersions.el === 'custom' && customData.el?.perfilEL
      ? { ...customData.el.perfilEL, plan: enrichPlanWithNutrition(customData.el.planEL || {}) }
      : origPerfilesData.el,
    ella: dataVersions.ella === 'custom' && customData.ella?.perfilELLA
      ? { ...customData.ella.perfilELLA, plan: enrichPlanWithNutrition(customData.ella.planELLA || {}) }
      : origPerfilesData.ella,
  }), [dataVersions, customData]);

  const equivalenciasData: Record<string, Equivalencia[]> = useMemo(() => {
    const mapEquiv = (equivs: any) => {
      if (!Array.isArray(equivs)) return [];
      return equivs.map((eq: any) => {
        const titulo = eq.categoria || eq.titulo || 'Sin título';
        const items = eq.items || (eq.ejemplos ? [eq.ejemplos] : []);
        return { titulo, items, icon: iconsMap[eq.icon] || Heart };
      });
    };
    return {
      el: dataVersions.el === 'custom' && customData.el?.equivalenciasEL ? mapEquiv(customData.el.equivalenciasEL) : origEquivData.el,
      ella: dataVersions.ella === 'custom' && customData.ella?.equivalenciasELLA ? mapEquiv(customData.ella.equivalenciasELLA) : origEquivData.ella,
    };
  }, [dataVersions, customData]);

  // ─── Computed: Derived state ───────────────────────────────────────
  const isAmbos = perfilActivo === 'ambos';
  const isEl = perfilActivo === 'el';
  const perfilObj = perfilActivo === 'ambos' || !perfilActivo ? null : perfilesData[perfilActivo];
  const perfilBase = perfilActivo === 'ambos' ? perfilesData.el : perfilObj || perfilesData.el;
  const ac = getAccentColors(perfilActivo);

  // ─── Actions ───────────────────────────────────────────────────────
  const getNextMomentoKey = useCallback((momentoKey: string) => {
    const momentKeys = perfilBase.momentos.map((m) => m.key);
    const currentIdx = momentKeys.indexOf(momentoKey);
    if (currentIdx === -1 || currentIdx >= momentKeys.length - 1) return null;
    return momentKeys[currentIdx + 1];
  }, [perfilBase.momentos]);

  const toggleSeleccion = useCallback((perfilId: string, dia: string, momento: string, nombre: string) => {
    const key = `${perfilId}-${dia}-${momento}-${nombre}`;
    const profileData = perfilId === 'ella' ? perfilesData.ella : perfilesData.el;
    const comidasMomento = profileData.plan[dia]?.[momento] || [];
    const nextMomento = getNextMomentoKey(momento);
    const wasCompleted = comidasMomento.some((item) => selecciones[`${perfilId}-${dia}-${momento}-${item.nombre}`]);
    const willSelectCurrentMeal = !selecciones[key];
    const isNowCompleted = wasCompleted || willSelectCurrentMeal;

    setSelecciones((prev) => {
      const next = { ...prev };
      if (willSelectCurrentMeal) {
        comidasMomento.forEach((item) => {
          const otherKey = `${perfilId}-${dia}-${momento}-${item.nombre}`;
          if (otherKey !== key && next[otherKey]) delete next[otherKey];
        });
      }
      next[key] = !prev[key];
      return next;
    });

    if (!wasCompleted && isNowCompleted && nextMomento) {
      setPendingAutoScrollMomento(nextMomento);
    }
  }, [getNextMomentoKey, perfilesData.ella, perfilesData.el, selecciones]);

  // ─── Scroll logic ──────────────────────────────────────────────────
  const scrollToMomento = useCallback((momentoKey: string, isExpanded: boolean) => {
    const doScroll = () => {
      const el = mealSectionRefs.current[momentoKey];
      if (!el) return;
      const offset = 56 + 48 + 44 + 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    if (isExpanded) {
      setProgressExpanded(false);
      setTimeout(doScroll, 260);
    } else {
      doScroll();
    }
  }, []);

  // ─── Progress Tracking ─────────────────────────────────────────────
  const momentoCompletadoEl = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (perfilesData.el?.momentos) {
      perfilesData.el.momentos.forEach((m) => {
        const comidas = perfilesData.el.plan[diaActivo]?.[m.key] || [];
        result[m.key] = comidas.some((item) => selecciones[`el-${diaActivo}-${m.key}-${item.nombre}`]);
      });
    }
    return result;
  }, [diaActivo, perfilesData, selecciones]);

  const momentoCompletadoElla = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (perfilesData.ella?.momentos) {
      perfilesData.ella.momentos.forEach((m) => {
        const comidas = perfilesData.ella.plan[diaActivo]?.[m.key] || [];
        result[m.key] = comidas.some((item) => selecciones[`ella-${diaActivo}-${m.key}-${item.nombre}`]);
      });
    }
    return result;
  }, [diaActivo, perfilesData, selecciones]);

  const momentoCompletado = useMemo(() => {
    if (!perfilActivo) return {} as Record<string, boolean>;
    if (isAmbos) {
      const result: Record<string, boolean> = {};
      perfilBase.momentos.forEach((m) => {
        result[m.key] = momentoCompletadoEl[m.key] && momentoCompletadoElla[m.key];
      });
      return result;
    }
    return isEl ? momentoCompletadoEl : momentoCompletadoElla;
  }, [isAmbos, isEl, perfilActivo, momentoCompletadoEl, momentoCompletadoElla, perfilBase]);

  const progresoDia = useMemo(() => {
    if (!perfilActivo) return 0;
    if (isAmbos) {
      const cEl = Object.values(momentoCompletadoEl).filter(Boolean).length;
      const cElla = Object.values(momentoCompletadoElla).filter(Boolean).length;
      const total = perfilesData.el.momentos.length * 2;
      return Math.round(((cEl + cElla) / total) * 100);
    }
    const total = perfilBase.momentos.length;
    const completados = Object.values(momentoCompletado).filter(Boolean).length;
    return Math.round((completados / total) * 100);
  }, [perfilActivo, isAmbos, perfilBase, momentoCompletado, momentoCompletadoEl, momentoCompletadoElla]);

  const completadosCount = isAmbos
    ? Object.values(momentoCompletadoEl).filter(Boolean).length + Object.values(momentoCompletadoElla).filter(Boolean).length
    : Object.values(momentoCompletado).filter(Boolean).length;

  const totalMomentosProgress = isAmbos ? perfilBase.momentos.length * 2 : perfilBase.momentos.length;

  // ─── AI Generation Handler ─────────────────────────────────────────
  const handleGenerateWithAi = useCallback(async (payload: QuestionnairePayload) => {
    setGenerationError('');
    setGenerationLoading(true);
    try {
      const payloadWithKey = { ...payload, customApiKey: geminiApiKey, preferredModel: geminiModel };
      let json: any;
      let usedDirectApi = false;

      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithKey),
        });
        const responseText = await res.text();
        if (!responseText || responseText.trim() === '') throw new Error('SERVER_UNAVAILABLE');
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) throw new Error('SERVER_UNAVAILABLE');
        try { json = JSON.parse(responseText); } catch { throw new Error('SERVER_UNAVAILABLE'); }
        if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      } catch (serverErr: any) {
        const isServerUnavailable = serverErr.message === 'SERVER_UNAVAILABLE' ||
          serverErr.message?.includes('fetch') ||
          serverErr.message?.includes('Failed to fetch') ||
          serverErr.message?.includes('NetworkError');

        if (isServerUnavailable) {
          const envApiKey = (import.meta as any).env?.GEMINI_API_KEY || '';
          if (!envApiKey && !geminiApiKey) {
            throw new Error('En desarrollo local, configura tu GEMINI_API_KEY en el archivo .env o en el panel de Administración (Ajustes IA) para generar planes con IA.');
          }
          usedDirectApi = true;
          const keyToUse = geminiApiKey || envApiKey;
          json = await callGeminiDirectly(payloadWithKey, keyToUse, geminiModel);
        } else {
          throw serverErr;
        }
      }

      if (!json.elData && !json.ellaData) {
        throw new Error('La respuesta no contiene datos del plan. Intenta de nuevo.');
      }

      setLastGeneratedData(json);

      setCustomData((prev: any) => {
        const updated = { ...prev };
        try {
          if (json.elData) updated.el = parseObjectToData(json.elData, 'EL');
          if (json.ellaData) updated.ella = parseObjectToData(json.ellaData, 'ELLA');
        } catch (parseErr: any) {
          throw new Error(`Error en los datos generados: ${parseErr.message}. La IA no generó la estructura esperada.`);
        }
        return updated;
      });

      setDataVersions((prev) => ({
        el: json.elData ? 'custom' : prev.el,
        ella: json.ellaData ? 'custom' : prev.ella,
      }));

      setShowQuestionnaire(false);
      await notify('Plan generado', usedDirectApi ? '¡Plan generado con IA (modo directo)!' : '¡Plan generado con IA y cargado automáticamente!');
    } catch (err: any) {
      console.error('Error en handleGenerateWithAi:', err);
      setGenerationError(err?.message || 'Error desconocido al generar con IA.');
    } finally {
      setGenerationLoading(false);
    }
  }, [geminiApiKey, geminiModel, notify]);

  // ─── Side Effects ──────────────────────────────────────────────────

  // Reset questionnaire when leaving both admin and questionnaire views
  useEffect(() => {
    if (!showAdmin && !showQuestionnaire) {
      setQuestionnaireTargetProfile('ambos');
      setQuestionnaireStepIdx(0);
      setQuestionnaireEl(defaultQuestionnaireData('70', '165'));
      setQuestionnaireElla(defaultQuestionnaireData('60', '160'));
      setQuestionnairePortionMode('auto');
      setQuestionnaireManualPortions({});
      setQuestionnaireAdditionalNotes('');
    }
  }, [showAdmin, showQuestionnaire]);

  // Clean generation state when opening questionnaire at step 0
  useEffect(() => {
    if (showQuestionnaire && !questionnaireStepIdx) {
      setLastGeneratedData(null);
      setGenerationError('');
    }
  }, [showQuestionnaire, questionnaireStepIdx]);

  // Persist Gemini settings
  useEffect(() => { localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey]);
  useEffect(() => { localStorage.setItem('geminiModel', geminiModel); }, [geminiModel]);
  useEffect(() => { if (perfilActivo) localStorage.setItem('perfilActivo', perfilActivo); }, [perfilActivo]);

  // Scroll to top on day/tab change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [diaActivo, tab]);

  // Auto-scroll pending
  useEffect(() => {
    if (!pendingAutoScrollMomento) return;
    const timer = setTimeout(() => {
      scrollToMomento(pendingAutoScrollMomento, progressExpanded);
      setPendingAutoScrollMomento(null);
    }, 680);
    return () => clearTimeout(timer);
  }, [pendingAutoScrollMomento, progressExpanded, scrollToMomento]);

  // Collapse progress on tab/day/profile change
  useEffect(() => {
    setProgressExpanded(false);
    setMomentosColapsados({});
    setMomentosEnEdicion({});
  }, [tab, diaActivo, perfilActivo]);

  // ─── Context Value ─────────────────────────────────────────────────
  const value: DietContextType = {
    perfilActivo, setPerfilActivo,
    tab, setTab,
    showAdmin, setShowAdmin,
    showQuestionnaire, setShowQuestionnaire,
    diaActivo, setDiaActivo, diasDisponibles,
    selecciones, setSelecciones, toggleSeleccion,
    comprasCheck, setComprasCheck,
    dataVersions, setDataVersions,
    customData, setCustomData,
    perfilesData, equivalenciasData,
    geminiApiKey, setGeminiApiKey,
    geminiModel, setGeminiModel,
    generationLoading, generationError, lastGeneratedData,
    handleGenerateWithAi,
    questionnaireTargetProfile, setQuestionnaireTargetProfile,
    questionnaireStepIdx, setQuestionnaireStepIdx,
    questionnaireEl, setQuestionnaireEl,
    questionnaireElla, setQuestionnaireElla,
    questionnairePortionMode, setQuestionnairePortionMode,
    questionnaireManualPortions, setQuestionnaireManualPortions,
    questionnaireAdditionalNotes, setQuestionnaireAdditionalNotes,
    momentosColapsados, setMomentosColapsados,
    progressExpanded, setProgressExpanded,
    momentosEnEdicion, setMomentosEnEdicion,
    momentoCompletado, progresoDia, completadosCount, totalMomentosProgress,
    scrollToMomento, mealSectionRefs,
    isAmbos, perfilBase, perfilObj, ac,
    notify, confirmAction,
  };

  return <DietContext.Provider value={value}>{children}</DietContext.Provider>;
};

export const useDiet = (): DietContextType => {
  const context = useContext(DietContext);
  if (context === undefined) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
};
