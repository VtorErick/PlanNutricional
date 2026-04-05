import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, User, Scale, Target, Shield, Activity, Settings2, SkipForward, Download,
  Hourglass, Pill, Heart, Clock, ChefHat, Check, Plus, Minus, Apple, Leaf, Wheat, Beef, Droplets, Milk, Bean, Ruler
} from 'lucide-react';
import { downloadJsonFile } from '../dataManager';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TargetProfile = 'vo' | 'va' | 'ambos';
export type PortionMode = 'manual' | 'auto';

export interface QuestionnairePayload {
  targetProfile: TargetProfile;
  profileToUpdate: TargetProfile;
  portionMode: PortionMode;
  planConfig: {
    mealsPerDay: string;
    selectedMoments: { key: string; label: string; hora: string }[];
    manualPortions: Record<string, Record<string, number>>;
    additionalNotes: string;
  };
  vo?: any;
  va?: any;
  profileContext?: any;
  healthContext?: any;
  preferences?: any;
  routine?: any;
  preferredModel?: string;
}

interface Props {
  onCancel: () => void;
  onGenerate: (payload: QuestionnairePayload) => Promise<void>;
  onViewPlan?: (profile: TargetProfile) => void;
  loading: boolean;
  errorMessage?: string;
  geminiModel?: string;
  setGeminiModel?: (m: string) => void;
  lastGeneratedData?: any; // Datos generados para descarga
  // Estados persistentes (para mantener progreso entre tabs)
  targetProfile: TargetProfile;
  setTargetProfile: (p: TargetProfile) => void;
  stepIdx: number;
  setStepIdx: (i: number | ((prev: number) => number)) => void;
  vo: any;
  setVo: (v: any | ((prev: any) => any)) => void;
  va: any;
  setVa: (v: any | ((prev: any) => any)) => void;
  portionMode: 'auto' | 'manual';
  setPortionMode: (m: 'auto' | 'manual') => void;
  manualPortions: Record<string, Record<string, number>>;
  setManualPortions: (p: Record<string, Record<string, number>> | ((prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)) => void;
  additionalNotes: string;
  setAdditionalNotes: (n: string | ((prev: string) => string)) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OBJECTIVES = [
  { val: 'Perder grasa',       emoji: '🔥' },
  { val: 'Ganar músculo',      emoji: '💪' },
  { val: 'Mantener peso',      emoji: '⚖️' },
  { val: 'Mejorar salud',      emoji: '❤️' },
  { val: 'Control glucémico',  emoji: '🩺' },
];

const ACTIVITY_LEVELS = [
  { val: 'Sedentario', emoji: '🪑', desc: 'Sin ejercicio' },
  { val: 'Ligero',     emoji: '🚶', desc: '1-2 días/sem' },
  { val: 'Moderado',   emoji: '🏃', desc: '3-4 días/sem' },
  { val: 'Intenso',    emoji: '⚡', desc: '5+ días/sem' },
];

const TIMELINE_OPTIONS = [
  { val: '4 sem', label: '4 semanas', emoji: '⚡' },
  { val: '8 sem', label: '8 semanas', emoji: '📅' },
  { val: '12 sem', label: '12 semanas', emoji: '📆' },
  { val: '16 sem', label: '16 semanas', emoji: '🗓️' },
  { val: '20 sem', label: '20 semanas', emoji: '📌' },
  { val: '24 sem', label: '24 semanas', emoji: '🔥' },
];

const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: '⚡ Recomendado'  },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', badge: '🆓 Gratuito'    },
  { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   badge: '🧠 Pro'          },
  { value: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   badge: '🚀 Máximo'       },
];

const DEFAULT_MOMENTS = [
  { key: 'desayuno',    label: 'Desayuno',     hora: '08:00' },
  { key: 'colacion_am', label: 'Colación AM',  hora: '11:00' },
  { key: 'comida',      label: 'Comida',       hora: '14:00' },
  { key: 'colacion_pm', label: 'Colación PM',  hora: '17:00' },
  { key: 'cena',        label: 'Cena',         hora: '20:00' },
];

// ─── Person data ──────────────────────────────────────────────────────────────
const emptyPerson = () => ({
  age: '',
  currentWeightKg: '70',
  heightCm: '165',
  targetWeightKg: '',
  objectives: [] as string[],
  objectiveTimeline: '12 sem',
  diagnostics: '',
  allergies: '',
  medications: '',
  intolerances: '',
  digestiveSymptoms: '',
  favoriteFoods: '',
  dislikedFoods: '',
  favoriteCuisineStyles: '',
  cookingTime: '',
  activityLevel: 'Moderado',
  wakeTime: '',
  sleepTime: '',
  trainingFrequency: '',
});
type Person = ReturnType<typeof emptyPerson>;

// ─── Wizard steps ─────────────────────────────────────────────────────────────
type StepType = 'who' | 'fisica' | 'objetivo' | 'salud' | 'medicos' | 'preferencias' | 'lifestyle' | 'horarios' | 'portions' | 'cocina' | 'confirm';

interface WizardStep {
  type: StepType;
  profile?: 'vo' | 'va';
}

function buildSteps(tp: TargetProfile): WizardStep[] {
  const personSteps = (p: 'vo' | 'va'): WizardStep[] => [
    { type: 'fisica',       profile: p },
    { type: 'objetivo',     profile: p },
    { type: 'salud',        profile: p },
    { type: 'medicos',      profile: p },
    { type: 'preferencias', profile: p },
    { type: 'lifestyle',    profile: p },
    { type: 'horarios',     profile: p },
  ];
  const steps: WizardStep[] = [{ type: 'who' }];
  if (tp === 'ambos') {
    steps.push(...personSteps('vo'), ...personSteps('va'));
  } else {
    steps.push(...personSteps(tp));
  }
  steps.push({ type: 'portions' }, { type: 'cocina' }, { type: 'confirm' });
  return steps;
}

// ─── Slide variants ───────────────────────────────────────────────────────────
const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
};

// ─── Compact slider ───────────────────────────────────────────────────────────
function NumSlider({ label, unit, value, min, max, step = 1, onChange, required, accent, minIcon, maxIcon }: {
  label: string; unit: string; value: string; min: number; max: number;
  step?: number; onChange: (v: string) => void; required?: boolean; accent: string; minIcon?: string; maxIcon?: string;
}) {
  const num = parseFloat(value) || min;
  const [isSliding, setIsSliding] = useState(false);
  const handleValueChange = (v: string) => {
    setIsSliding(true);
    onChange(v);
    window.setTimeout(() => setIsSliding(false), 180);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <label className="text-sm font-semibold text-slate-600">
          {label}{required && <span className="text-rose-400 ml-1 font-bold">*</span>}
        </label>
        <div className="flex items-baseline gap-1">
          <motion.input
            animate={{ scale: isSliding ? 1.08 : 1, color: isSliding ? accent : '#0f172a' }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            type="number" min={min} max={max} step={step}
            value={value}
            onChange={e => handleValueChange(e.target.value)}
            className="w-20 text-right text-3xl font-black bg-transparent border-none outline-none tabular-nums"
          />
          <span className="text-sm text-slate-400 font-medium pb-0.5">{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={num}
        onChange={e => handleValueChange(e.target.value)}
        className="w-full h-2.5 rounded-full cursor-pointer appearance-none bg-slate-100"
        style={{ accentColor: accent }}
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1 opacity-40"><span>{minIcon}</span>{min} {unit}</span>
        <span className="flex items-center gap-1 opacity-40">{max} {unit}<span>{maxIcon}</span></span>
      </div>
    </div>
  );
}

// ─── Theme by profile ─────────────────────────────────────────────────────────
const THEME = {
  vo:    { accent: '#3b82f6', light: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200',   grad: 'from-blue-500 to-indigo-600'   },
  va:    { accent: '#f43f5e', light: 'bg-rose-50',    text: 'text-rose-600',   border: 'border-rose-200',   grad: 'from-rose-500 to-pink-600'     },
  ambos: { accent: '#10b981', light: 'bg-emerald-50', text: 'text-emerald-600',border: 'border-emerald-200',grad: 'from-emerald-500 to-teal-600'  },
};

const STEP_META: Record<StepType, { label: string; Icon: any }> = {
  who:          { label: '¿Para quién?',      Icon: User      },
  fisica:       { label: 'Medidas',            Icon: Scale     },
  objetivo:     { label: 'Objetivo',           Icon: Target    },
  salud:        { label: 'Salud',              Icon: Shield    },
  medicos:      { label: 'Médicos',            Icon: Pill      },
  preferencias: { label: 'Preferencias',       Icon: Heart     },
  lifestyle:    { label: 'Actividad',          Icon: Activity  },
  horarios:     { label: 'Horarios',           Icon: Clock     },
  portions:     { label: 'Porciones',          Icon: Settings2 },
  cocina:       { label: 'Cocina',             Icon: ChefHat   },
  confirm:      { label: 'Confirmar',          Icon: Sparkles  },
};

const QUICK_TAGS = {
  diagnostics: ['Diabetes', 'Hipertensión', 'SOP', 'Hipotiroidismo'],
  medications: ['Metformina', 'Levotiroxina', 'Antihipertensivo'],
  allergies: ['Lácteos', 'Gluten', 'Mariscos', 'Nueces'],
  intolerances: ['Lactosa', 'Fructosa', 'Sorbitol'],
  digestive: ['Reflujo', 'Distensión', 'Estreñimiento'],
  favorites: ['Pollo', 'Arroz', 'Atún', 'Avena'],
  disliked: ['Hígado', 'Brócoli', 'Coliflor'],
};

const TRAINING_FREQUENCY_CHIPS = ['1-2 días', '3-4 días', '5+ días', 'Diario'];
const CUISINE_STYLE_OPTIONS = ['Mexicana', 'Italiana', 'Asiática', 'Mediterránea', 'Casera', 'Vegetariana'];
const COOKING_TIME_OPTIONS = ['15 min', '30 min', '45 min', '1 hora'];

function parseTimeToParts(value: string) {
  if (!value || !value.includes(':')) return { hour: 7, minute: 0 };
  const [h, m] = value.split(':').map(v => parseInt(v, 10));
  return {
    hour: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 7,
    minute: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
  };
}

function formatTimeFromParts(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function TimeWheelPicker({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { hour, minute } = parseTimeToParts(value);
  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-semibold text-slate-700">{title}</p>
      <div className="mx-auto w-fit bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <select
            value={hour}
            onChange={e => onChange(formatTimeFromParts(parseInt(e.target.value, 10), minute))}
            className="h-40 w-24 rounded-xl border border-indigo-200 bg-white text-center text-3xl font-black text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
            ))}
          </select>
          <span className="text-3xl font-black text-indigo-400">:</span>
          <select
            value={minute}
            onChange={e => onChange(formatTimeFromParts(hour, parseInt(e.target.value, 10)))}
            className="h-40 w-24 rounded-xl border border-indigo-200 bg-white text-center text-3xl font-black text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-center text-xs text-indigo-500 font-semibold">Hora seleccionada: {value || '07:00'}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NutritionQuestionnaire({
  onCancel, onGenerate, onViewPlan, loading, errorMessage, geminiModel, setGeminiModel, lastGeneratedData,
  // Estados persistentes
  targetProfile, setTargetProfile, stepIdx, setStepIdx, vo, setVo, va, setVa,
  portionMode, setPortionMode, manualPortions, setManualPortions, additionalNotes, setAdditionalNotes
}: Props) {
  const [direction, setDirection] = useState(1);
  const [localModel, setLocalModel] = useState(geminiModel || 'gemini-2.0-flash');
  const [timePickerState, setTimePickerState] = useState<{
    open: boolean;
    profile: 'vo' | 'va' | null;
    field: 'wakeTime' | 'sleepTime' | null;
    value: string;
  }>({ open: false, profile: null, field: null, value: '' });
  const [activePortionMoment, setActivePortionMoment] = useState('desayuno');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeLockReleaseTimeoutRef = useRef<number | null>(null);

  useEffect(() => { if (geminiModel) setLocalModel(geminiModel); }, [geminiModel]);

  const releaseScreenWakeLock = useCallback(async () => {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch {
      // Ignorar errores de liberación (p. ej. si ya se liberó automáticamente)
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  const requestScreenWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Algunos dispositivos/navegadores pueden bloquear Wake Lock
    }
  }, []);

  useEffect(() => {
    if (wakeLockReleaseTimeoutRef.current) {
      window.clearTimeout(wakeLockReleaseTimeoutRef.current);
      wakeLockReleaseTimeoutRef.current = null;
    }

    if (loading) {
      void requestScreenWakeLock();
      return;
    }

    wakeLockReleaseTimeoutRef.current = window.setTimeout(() => {
      void releaseScreenWakeLock();
      wakeLockReleaseTimeoutRef.current = null;
    }, 10000);
  }, [loading, requestScreenWakeLock, releaseScreenWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && loading && !wakeLockRef.current) {
        void requestScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, requestScreenWakeLock]);

  useEffect(() => {
    return () => {
      if (wakeLockReleaseTimeoutRef.current) {
        window.clearTimeout(wakeLockReleaseTimeoutRef.current);
      }
      void releaseScreenWakeLock();
    };
  }, [releaseScreenWakeLock]);

  const steps = useMemo(() => buildSteps(targetProfile), [targetProfile]);
  const currentStep = steps[stepIdx] ?? steps[0];
  const progress = steps.length > 1 ? stepIdx / (steps.length - 1) : 0;
  const stepsLeft = Math.max(steps.length - (stepIdx + 1), 0);

  const tc = THEME[currentStep.profile ?? targetProfile];

  // ── Helpers ──────────────────────────────────────────────────────────────
  const person  = (p: 'vo' | 'va') => p === 'vo' ? vo : va;
  const setPerson = (p: 'vo' | 'va', u: Partial<Person>) => {
    if (p === 'vo') setVo((prev: any) => ({ ...prev, ...u }));
    else            setVa((prev: any) => ({ ...prev, ...u }));
  };

  const advance = () => {
    if (stepIdx < steps.length - 1) { setDirection(1); setStepIdx(i => i + 1); }
  };
  const goBack = () => {
    if (stepIdx > 0) { setDirection(-1); setStepIdx(i => i - 1); }
  };

  /** Tap a card → set state → auto-advance */
  const pick = (setFn: () => void, delay = 220) => {
    setFn();
    setTimeout(() => { setDirection(1); setStepIdx(i => Math.min(i + 1, steps.length - 1)); }, delay);
  };

  const selectProfile = (p: TargetProfile) => {
    setTargetProfile(p);
    setDirection(1);
    setTimeout(() => setStepIdx(1), 260);
  };

  const canContinue = () => {
    const { type, profile } = currentStep;
    if (type === 'fisica'   && profile) return !!person(profile).age && !!person(profile).currentWeightKg && !!person(profile).heightCm;
    if (type === 'objetivo' && profile) return person(profile).objectives.length > 0;
    return true;
  };

  const appendTag = (profile: 'vo' | 'va', field: keyof Person, tag: string) => {
    const currentValue = String(person(profile)[field] ?? '').trim();
    const values = currentValue.split(',').map(v => v.trim()).filter(Boolean);
    if (!values.includes(tag)) {
      const next = [...values, tag].join(', ');
      setPerson(profile, { [field]: next } as Partial<Person>);
    }
  };

  const openTimePicker = (profile: 'vo' | 'va', field: 'wakeTime' | 'sleepTime', currentValue: string) => {
    setTimePickerState({
      open: true,
      profile,
      field,
      value: currentValue || '07:00',
    });
  };
  const closeTimePicker = () => setTimePickerState({ open: false, profile: null, field: null, value: '' });

  const updatePortionValue = (group: string, momento: string, updater: (n: number) => number) => {
    setManualPortions((prev: Record<string, Record<string, number>>) => {
      const current = prev[group]?.[momento] ?? 0;
      const next = Math.max(0, Math.min(10, updater(current)));
      return {
        ...prev,
        [group]: { ...prev[group], [momento]: next },
      };
    });
  };

  const selectedCuisineStyles = useMemo(() => {
    return String(vo.favoriteCuisineStyles || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }, [vo.favoriteCuisineStyles]);

  const setCuisineStyles = (styles: string[]) => {
    const joined = styles.join(', ');
    setVo((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
    setVa((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
  };

  const toggleCuisineStyle = (style: string) => {
    const next = selectedCuisineStyles.includes(style)
      ? selectedCuisineStyles.filter(s => s !== style)
      : [...selectedCuisineStyles, style];
    setCuisineStyles(next);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const buildPP = (p: Person) => ({
      profileContext: {
        age: p.age,
        currentWeightKg: p.currentWeightKg, heightCm: p.heightCm,
        targetWeightKg: p.targetWeightKg, objectives: p.objectives,
        objectiveTimelineWeeks: p.objectiveTimeline,
      },
      healthContext:  { diagnostics: p.diagnostics, allergies: p.allergies, medications: p.medications, intolerances: p.intolerances, digestiveSymptoms: p.digestiveSymptoms },
      preferences:   { favoriteFoods: p.favoriteFoods, dislikedFoods: p.dislikedFoods, favoriteCuisineStyles: p.favoriteCuisineStyles, cookingTime: p.cookingTime },
      routine:       { activityLevel: p.activityLevel, wakeTime: p.wakeTime, sleepTime: p.sleepTime, trainingFrequency: p.trainingFrequency },
    });

    const base = {
      targetProfile,
      profileToUpdate: targetProfile,
      portionMode,
      preferredModel: localModel,
      planConfig: { mealsPerDay: DEFAULT_MOMENTS.length.toString(), selectedMoments: DEFAULT_MOMENTS, manualPortions: portionMode === 'manual' ? manualPortions : {}, additionalNotes },
    };

    if (targetProfile === 'ambos') {
      await onGenerate({ ...base, vo: buildPP(vo), va: buildPP(va) });
    } else {
      const p = targetProfile === 'vo' ? vo : va;
      await onGenerate({ ...base, ...buildPP(p) });
    }
  };

  // ── Step content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    const { type, profile } = currentStep;

    /* ── WHO ── */
    if (type === 'who') return (
      <div className="space-y-2.5">
        <p className="text-center text-slate-500 text-sm mb-4">Selecciona para quién generas el plan</p>
        {([
          ['vo',    '👨', 'Perfil El',     'Plan individual masculino'],
          ['va',    '👩', 'Perfil Ella',     'Plan individual femenino' ],
          ['ambos', '👫', 'Ambos Perfiles', 'Plan completo para los dos'],
        ] as const).map(([val, emoji, title, sub]) => {
          const t = THEME[val];
          const active = targetProfile === val;
          return (
            <button key={val} onClick={() => selectProfile(val)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 font-semibold text-left transition-all duration-200 active:scale-[.98] ${
                active ? `${t.border} ${t.light} shadow-sm` : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${active ? t.text : 'text-slate-800'}`}>{title}</p>
                <p className={`text-[11px] mt-0.5 ${active ? t.text + ' opacity-70' : 'text-slate-400'}`}>{sub}</p>
              </div>
              {active && <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${t.text}`} />}
            </button>
          );
        })}
      </div>
    );

    /* ── FÍSICA ── */
    if (type === 'fisica' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-5">
          <NumSlider label="Edad" unit="años" min={10} max={100} step={1} required
            value={p.age} onChange={v => setPerson(profile, { age: v })} accent={tc.accent} minIcon="👶" maxIcon="🧓" />
          <NumSlider label="Peso actual" unit="kg" min={25} max={200} step={0.5} required
            value={p.currentWeightKg} onChange={v => setPerson(profile, { currentWeightKg: v })} accent={tc.accent} minIcon="🏋️" maxIcon="🏋️‍♂️" />
          <NumSlider label="Estatura" unit="cm" min={100} max={220} required
            value={p.heightCm} onChange={v => setPerson(profile, { heightCm: v })} accent={tc.accent} minIcon="🧍" maxIcon="🧍‍♂️" />
          <NumSlider label="Peso meta" unit="kg" min={25} max={200} step={0.5}
            value={p.targetWeightKg} onChange={v => setPerson(profile, { targetWeightKg: v })} accent={tc.accent} minIcon="🎯" maxIcon="🏁" />
        </div>
      );
    }

    /* ── OBJETIVO ── */
    if (type === 'objetivo' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {OBJECTIVES.map(obj => {
              const isSelected = p.objectives.includes(obj.val);
              const toggleObjective = () => {
                const newObjectives = isSelected 
                  ? p.objectives.filter((o: string) => o !== obj.val)
                  : [...p.objectives, obj.val];
                setPerson(profile, { objectives: newObjectives });
              };
              return (
                <button key={obj.val}
                  onClick={toggleObjective}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 active:scale-[.98] ${
                    isSelected ? `${tc.border} ${tc.light} ${tc.text} shadow-sm border-[2.5px]` : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}>
                  <span className="text-xl w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">{obj.emoji}</span>
                  <span className="flex-1 text-left">{obj.val}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          
          {/* Selector de timeline - compacto */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Tiempo objetivo</label>
            <div className="flex gap-1.5">
              {TIMELINE_OPTIONS.map(tl => {
                const active = p.objectiveTimeline === tl.val;
                return (
                  <button key={tl.val} onClick={() => setPerson(profile, { objectiveTimeline: tl.val })}
                    className={`flex-1 py-2 px-1 rounded-lg border text-center transition-all active:scale-[.97] ${
                      active ? `border-transparent ${tc.light} shadow-sm` : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <span className="text-xs font-bold">{tl.val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    /* ── SALUD ── */
    if (type === 'salud' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Esta sección es opcional. Puedes saltar si no aplica.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Condiciones médicas</label>
            <textarea rows={2} placeholder="Ej. Diabetes"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              value={p.diagnostics} onChange={e => setPerson(profile, { diagnostics: e.target.value })} />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_TAGS.diagnostics.map(tag => (
                <button key={tag} onClick={() => appendTag(profile, 'diagnostics', tag)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    /* ── MEDICOS ── */
    if (type === 'medicos' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Esta sección es opcional.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
            <textarea rows={2} placeholder="Ej. Metformina"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              value={p.medications} onChange={e => setPerson(profile, { medications: e.target.value })} />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_TAGS.medications.map(tag => (
                <button key={tag} onClick={() => appendTag(profile, 'medications', tag)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Alergias</label>
              <input placeholder="Ej. Lácteos"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
                value={p.allergies} onChange={e => setPerson(profile, { allergies: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.allergies.map(tag => (
                  <button key={tag} onClick={() => appendTag(profile, 'allergies', tag)}
                    className="px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Intolerancias</label>
              <input placeholder="Ej. Lactosa"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
                value={p.intolerances} onChange={e => setPerson(profile, { intolerances: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.intolerances.map(tag => (
                  <button key={tag} onClick={() => appendTag(profile, 'intolerances', tag)}
                    className="px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── PREFERENCIAS ── */
    if (type === 'preferencias' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Esta sección es opcional.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Síntomas digestivos</label>
            <input placeholder="Ej. Reflujo"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              value={p.digestiveSymptoms} onChange={e => setPerson(profile, { digestiveSymptoms: e.target.value })} />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_TAGS.digestive.map(tag => (
                <button key={tag} onClick={() => appendTag(profile, 'digestiveSymptoms', tag)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Favoritos</label>
              <input placeholder="Ej. Pollo" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
                value={p.favoriteFoods} onChange={e => setPerson(profile, { favoriteFoods: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.favorites.map(tag => (
                  <button key={tag} onClick={() => appendTag(profile, 'favoriteFoods', tag)}
                    className="px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Jamás incluir</label>
              <input placeholder="Ej. Hígado" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
                value={p.dislikedFoods} onChange={e => setPerson(profile, { dislikedFoods: e.target.value })} />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.disliked.map(tag => (
                  <button key={tag} onClick={() => appendTag(profile, 'dislikedFoods', tag)}
                    className="px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── LIFESTYLE ── */
    if (type === 'lifestyle' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">Actividad física</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map(al => {
                const active = p.activityLevel === al.val;
                return (
                  <button key={al.val} onClick={() => setPerson(profile, { activityLevel: al.val })}
                    className={`flex flex-col items-start gap-0.5 p-3 rounded-2xl border-2 transition-all active:scale-[.97] ${
                      active ? `${tc.border} ${tc.light} shadow-sm border-[2.5px]` : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <span className="text-xl mb-0.5 w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">{al.emoji}</span>
                    <span className={`text-xs font-bold leading-tight ${active ? tc.text : 'text-slate-700'}`}>{al.val}</span>
                    <span className={`text-[10px] leading-tight ${active ? tc.text + ' opacity-60' : 'text-slate-400'}`}>{al.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    /* ── HORARIOS ── */
    if (type === 'horarios' && profile) {
      const p = person(profile);
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Esta sección es opcional.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hora de despertar</label>
              <button
                onClick={() => openTimePicker(profile, 'wakeTime', p.wakeTime)}
                className="w-full rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-2.5 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-between"
              >
                <span>{p.wakeTime || '07:00'}</span>
                <Clock className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hora de dormir</label>
              <button
                onClick={() => openTimePicker(profile, 'sleepTime', p.sleepTime)}
                className="w-full rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-2.5 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 flex items-center justify-between"
              >
                <span>{p.sleepTime || '22:00'}</span>
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Frecuencia de entrenamiento</label>
            <div className="grid grid-cols-2 gap-2">
              {TRAINING_FREQUENCY_CHIPS.map(option => {
                const active = p.trainingFrequency === option;
                return (
                  <button
                    key={option}
                    onClick={() => setPerson(profile, { trainingFrequency: option })}
                    className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all active:scale-[.98] ${
                      active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    /* ── PORTIONS ── */
    if (type === 'portions') {
      const foodGroups = [
        { key: 'frutas', label: 'Frutas', icon: Apple, color: 'text-rose-300', activeColor: 'text-rose-500', bg: 'bg-rose-50' },
        { key: 'verduras', label: 'Verduras', icon: Leaf, color: 'text-emerald-300', activeColor: 'text-emerald-500', bg: 'bg-emerald-50' },
        { key: 'cereales', label: 'Cereales', icon: Wheat, color: 'text-amber-300', activeColor: 'text-amber-500', bg: 'bg-amber-50' },
        { key: 'proteina', label: 'Proteína', icon: Beef, color: 'text-red-300', activeColor: 'text-red-500', bg: 'bg-red-50' },
        { key: 'grasas', label: 'Grasas', icon: Droplets, color: 'text-lime-300', activeColor: 'text-lime-500', bg: 'bg-lime-50' },
        { key: 'lacteos', label: 'Lácteos', icon: Milk, color: 'text-blue-300', activeColor: 'text-blue-500', bg: 'bg-blue-50' },
        { key: 'leguminosas', label: 'Leguminosas', icon: Bean, color: 'text-amber-300', activeColor: 'text-amber-700', bg: 'bg-amber-100' },
      ];
      const macroGroups = [
        { key: 'carbs', label: 'Carbohidratos', foodKeys: ['frutas', 'cereales', 'leguminosas'], tone: 'border-amber-100 bg-amber-50/60' },
        { key: 'protein', label: 'Proteínas', foodKeys: ['proteina', 'lacteos'], tone: 'border-red-100 bg-red-50/60' },
        { key: 'fat-veggie', label: 'Fibra y grasas', foodKeys: ['verduras', 'grasas'], tone: 'border-emerald-100 bg-emerald-50/60' },
      ];
      const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
      const mLabels = ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'];
      const totalPortions = foodGroups.reduce((acc, group) => (
        acc + mKeys.reduce((sum, moment) => sum + (manualPortions[group.key]?.[moment] || 0), 0)
      ), 0);
      const progressPercent = Math.min(100, Math.round((totalPortions / (foodGroups.length * mKeys.length * 10)) * 100));

      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Este paso es opcional. Puedes saltar si prefieres que la IA calcule las porciones automáticamente.
          </p>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-3">Modo de porciones</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['auto',   '🤖', 'IA decide',  'Calculado automáticamente'],
                ['manual', '📋', 'Manual',     'Yo defino las cantidades' ],
              ] as const).map(([val, emoji, title, sub]) => (
                <button key={val} onClick={() => setPortionMode(val)}
                  className={`relative flex flex-col gap-0.5 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                    portionMode === val ? 'border-[2.5px] border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}>
                  <motion.span
                    initial={false}
                    animate={{ scale: portionMode === val ? 1 : 0.6, opacity: portionMode === val ? 1 : 0 }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.span>
                  <span className="text-xl">{emoji}</span>
                  <span className={`text-sm font-bold mt-1 ${portionMode === val ? 'text-indigo-700' : 'text-slate-800'}`}>{title}</span>
                  <span className={`text-[10px] ${portionMode === val ? 'text-indigo-500' : 'text-slate-400'}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual portions table */}
          {portionMode === 'manual' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-indigo-800">Total de porciones</p>
                  <span className="text-sm font-black text-indigo-700 tabular-nums">{totalPortions}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/80 overflow-hidden">
                  <motion.div
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-indigo-600">Completado: {progressPercent}%</p>
              </div>

              <label className="text-sm font-semibold text-slate-700 block">Por momentos del día</label>
              <div className="space-y-2">
                {mKeys.map((momento, idx) => (
                  <div key={momento} className="rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden">
                    <button
                      onClick={() => setActivePortionMoment(prev => prev === momento ? '' : momento)}
                      className="w-full flex items-center justify-between px-3 py-3 text-left"
                    >
                      <p className="text-xs font-bold text-slate-600 uppercase">{mLabels[idx]}</p>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${activePortionMoment === momento ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {activePortionMoment === momento && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 pb-3"
                        >
                          <div className="space-y-2">
                            {macroGroups.map(macro => (
                              <div key={macro.key} className={`rounded-xl border p-2 ${macro.tone}`}>
                                <p className="text-[11px] font-bold text-slate-600 uppercase mb-1">{macro.label}</p>
                                <div className="space-y-2">
                                  {macro.foodKeys.map(foodKey => {
                                    const group = foodGroups.find(item => item.key === foodKey);
                                    if (!group) return null;
                                    const value = manualPortions[group.key]?.[momento] || 0;
                                    const Icon = group.icon;
                                    const iconClass = value === 0 ? `${group.color} opacity-50 grayscale` : group.activeColor;

                                    return (
                                      <div key={group.key} className="rounded-lg border border-white/80 bg-white px-2 py-2">
                                        <div className="flex items-center gap-2">
                                          <Icon className={`w-4 h-4 ${iconClass}`} />
                                          <span className="text-xs font-semibold text-slate-700 flex-1">{group.label}</span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => updatePortionValue(group.key, momento, n => n - 1)}
                                              className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:scale-95"
                                              aria-label={`Reducir ${group.label}`}
                                            >
                                              <Minus className="w-4 h-4" />
                                            </button>
                                            <input
                                              type="number"
                                              inputMode="numeric"
                                              min={0}
                                              max={10}
                                              value={value}
                                              onChange={(e) => {
                                                const parsed = Number.parseInt(e.target.value, 10);
                                                updatePortionValue(group.key, momento, () => Number.isFinite(parsed) ? parsed : 0);
                                              }}
                                              className={`w-14 h-9 rounded-lg border border-slate-200 text-center text-sm font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-300 ${group.bg}`}
                                              aria-label={`Porciones de ${group.label}`}
                                            />
                                            <button
                                              onClick={() => updatePortionValue(group.key, momento, n => n + 1)}
                                              className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 active:scale-95"
                                              aria-label={`Aumentar ${group.label}`}
                                            >
                                              <Plus className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        <input
                                          type="range"
                                          min={0}
                                          max={10}
                                          step={1}
                                          value={value}
                                          onChange={(e) => updatePortionValue(group.key, momento, () => Number.parseInt(e.target.value, 10))}
                                          className="w-full mt-2 accent-indigo-500"
                                          aria-label={`Slider porciones ${group.label}`}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ── COCINA ── */
    if (type === 'cocina') {
      return (
        <div className="space-y-5">
          <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            💡 Esta sección es opcional.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Estilos de cocina preferidos
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_STYLE_OPTIONS.map(style => {
                const active = selectedCuisineStyles.includes(style);
                return (
                  <button
                    key={style}
                    onClick={() => toggleCuisineStyle(style)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-[.98] ${
                      active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tiempo de cocina disponible
            </label>
            <div className="flex flex-wrap gap-2">
              {COOKING_TIME_OPTIONS.map(time => {
                const active = vo.cookingTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => { setVo((prev: any) => ({ ...prev, cookingTime: time })); setVa((prev: any) => ({ ...prev, cookingTime: time })); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-[.98] ${
                      active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Notas adicionales
            </label>
            <textarea rows={2} placeholder="Preferencias de preparación, contexto especial, alimentos que no te gustan..."
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none overflow-hidden focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} />
          </div>
        </div>
      );
    }

    /* ── CONFIRM ── */
    if (type === 'confirm') {
      const profiles: ('vo' | 'va')[] = targetProfile === 'ambos' ? ['vo', 'va'] : [targetProfile];
      
      // Calcular totales de porciones si es modo manual
      const portionSummary = portionMode === 'manual' ? Object.entries(manualPortions).map(([group, moments]) => {
        const total = Object.values(moments || {}).reduce((a, b) => a + (b || 0), 0);
        return total > 0 ? `${group}: ${total}` : null;
      }).filter(Boolean).join(', ') : null;
      
      return (
        <div className="space-y-4">
          <p className="text-center text-sm text-slate-500">Revisa y confirma tu plan</p>
          
          {/* Configuración general del plan */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-slate-600">📋 Configuración del Plan</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Perfil: <strong>{targetProfile === 'ambos' ? 'Ambos' : targetProfile === 'vo' ? 'El' : 'Ella'}</strong></span>
              <span className="flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5 text-slate-400" />Porciones: <strong>{portionMode === 'auto' ? 'IA decide 🤖' : 'Manual 📋'}</strong></span>
              {portionSummary && <span className="col-span-2 text-slate-500 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Resumen: {portionSummary}</span>}
              {vo.favoriteCuisineStyles && <span className="col-span-2 text-slate-500 flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5" />Cocina: {vo.favoriteCuisineStyles}</span>}
              {vo.cookingTime && <span className="col-span-2 text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Tiempo cocina: {vo.cookingTime}</span>}
              {additionalNotes && <span className="col-span-2 text-slate-500 truncate">Notas: {additionalNotes}</span>}
            </div>
            <div className="h-px bg-slate-200" />
          </div>
          
          {profiles.map(p => {
            const data = person(p);
            const t = THEME[p];
            return (
              <div key={p} className={`p-4 rounded-2xl border ${t.border} ${t.light}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${t.text}`}>
                  {p === 'vo' ? '👨 Perfil El' : '👩 Perfil Ella'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  {data.age && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Edad: <strong>{data.age} años</strong></span>}
                  <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-slate-400" />Peso: <strong>{data.currentWeightKg} kg</strong></span>
                  <span className="flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5 text-slate-400" />Estatura: <strong>{data.heightCm} cm</strong></span>
                  {data.targetWeightKg && <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-slate-400" />Peso meta: <strong>{data.targetWeightKg} kg</strong></span>}
                  <span className="col-span-2 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-slate-400" />Objetivos: <strong>{data.objectives.join(', ') || 'Ninguno'}</strong></span>
                  <span className="col-span-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-400" />Actividad: <strong>{data.activityLevel}</strong></span>
                  {data.objectiveTimeline && <span className="col-span-2">Tiempo: <strong>{data.objectiveTimeline}</strong></span>}
                  {data.wakeTime && data.sleepTime && <span className="col-span-2">Horario: <strong>{data.wakeTime} - {data.sleepTime}</strong></span>}
                  {data.trainingFrequency && <span className="col-span-2">Entreno: <strong>{data.trainingFrequency}</strong></span>}
                  {data.diagnostics && <span className="col-span-2 text-slate-500">Salud: {data.diagnostics}</span>}
                  {data.medications && <span className="col-span-2 text-slate-500">Medicamentos: {data.medications}</span>}
                  {data.allergies && <span className="col-span-2 text-slate-500">Alergias: {data.allergies}</span>}
                  {data.intolerances && <span className="col-span-2 text-slate-500">Intolerancias: {data.intolerances}</span>}
                  {data.digestiveSymptoms && <span className="col-span-2 text-slate-500">Digestivo: {data.digestiveSymptoms}</span>}
                  {data.favoriteFoods && <span className="col-span-2 text-emerald-600">Favoritos: {data.favoriteFoods}</span>}
                  {data.dislikedFoods && <span className="col-span-2 text-rose-500">No incluir: {data.dislikedFoods}</span>}
                </div>
              </div>
            );
          })}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 leading-relaxed">
              {errorMessage}
            </div>
          )}
          
          {/* Selección de modelo Gemini cuando hay error para reintentar */}
          {errorMessage && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Cambiar modelo de Gemini (opcional)</label>
              <div className="grid grid-cols-2 gap-2">
                {GEMINI_MODELS.map(m => {
                  const active = localModel === m.value;
                  return (
                    <button key={m.value} onClick={() => { setLocalModel(m.value); setGeminiModel?.(m.value); }}
                      className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all active:scale-[.97] ${
                        active ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}>
                      <span className={`text-[11px] font-bold leading-tight ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{m.label}</span>
                      <span className={`text-[9px] font-semibold ${active ? 'text-indigo-500' : 'text-slate-400'}`}>{m.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Botón descargar JSON si hay datos generados */}
          {lastGeneratedData && (
            <button 
              onClick={() => {
                // Transformar al formato RAW compatible (quitar wrapper voData/vaData)
                const rawFormat: any = {};
                if (lastGeneratedData.voData) {
                  rawFormat.perfilVO = lastGeneratedData.voData.perfilVO;
                  rawFormat.equivalenciasVO = lastGeneratedData.voData.equivalenciasVO;
                  rawFormat.planVO = lastGeneratedData.voData.planVO;
                }
                if (lastGeneratedData.vaData) {
                  rawFormat.perfilVA = lastGeneratedData.vaData.perfilVA;
                  rawFormat.equivalenciasVA = lastGeneratedData.vaData.equivalenciasVA;
                  rawFormat.planVA = lastGeneratedData.vaData.planVA;
                }
                downloadJsonFile('plan_generado.json', JSON.stringify(rawFormat, null, 2));
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all active:scale-[.98]">
              <Download className="w-4 h-4" />
              Descargar JSON generado
            </button>
          )}
          
          {/* Animación de carga con reloj de arena */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-indigo-500 border-r-indigo-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hourglass className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-700">La IA está creando tu plan</p>
                <p className="text-xs text-slate-500">Esto puede tomar 30-60 segundos...</p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-indigo-500"
                  />
                ))}
              </div>
            </div>
          )}
          
          {!loading && lastGeneratedData && onViewPlan && (
            <button onClick={() => onViewPlan(targetProfile)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-[.98] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white">
              <CheckCircle2 className="w-5 h-5" />
              ¡Listo! Revisa tu plan
            </button>
          )}
          
          {!loading && !lastGeneratedData && (
            <motion.button onClick={handleGenerate} disabled={loading}
              animate={!loading ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-[.98] ${
                loading ? 'bg-slate-800 opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-[length:200%_200%] hover:brightness-110'
              } text-white`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
              {loading ? 'Generando plan...' : '✨ Generar Plan con IA'}
            </motion.button>
          )}
          <p className="mt-3 text-[10px] text-slate-300 text-center leading-relaxed">
            Las recomendaciones de IA no sustituyen valoración profesional.
          </p>
        </div>
      );
    }

    return null;
  };

  // ── Navigation buttons ────────────────────────────────────────────────────
  const { type } = currentStep;
  const showBack    = stepIdx > 0;
  const showNext    = type !== 'who' && type !== 'confirm';
  const isLastNav   = type === 'cocina';
  const isOptional  = type === 'salud' || type === 'medicos' || type === 'preferencias' || type === 'horarios' || type === 'portions' || type === 'cocina';

  const { label: stepLabel, Icon: StepIcon } = STEP_META[type];
  const profileSuffix = currentStep.profile === 'vo' ? ' · El' : currentStep.profile === 'va' ? ' · Ella' : '';

  return (
    <>
    <div
      className="mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col"
      style={{ height: 'min(720px, calc(100dvh - 180px))' }}
    >
      {/* Progress bar */}
      <div className="h-2 bg-slate-100 flex-shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${tc.grad}`}>
            <StepIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight truncate">{stepLabel}{profileSuffix}</p>
            <p className="text-xs text-slate-500 font-medium">
              Paso {stepIdx + 1} de {steps.length} · {stepsLeft <= 3 ? 'Ya casi terminamos' : `Solo ${stepsLeft} pasos más`}
            </p>
          </div>
        </div>
        <button onClick={onCancel}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition font-medium">
          Cerrar
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 min-h-0 px-4 py-5 overflow-y-auto">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={stepIdx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {(showBack || showNext) && (
        <div className="flex items-center gap-2 px-4 pb-4 pt-2 flex-shrink-0 border-t border-slate-100">
          {showBack && (
            <button onClick={goBack}
              className="flex items-center gap-1 px-2 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition active:scale-95 flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
          {showNext && (
            <>
              {isOptional && (
                <button onClick={advance}
                  className="flex items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-slate-600 transition active:scale-95">
                  <SkipForward className="w-3.5 h-3.5" />
                  Saltar
                </button>
              )}
              <button onClick={advance} disabled={!canContinue()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[.98] ${
                  canContinue()
                    ? `bg-gradient-to-r ${tc.grad} text-white shadow-sm`
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                {isLastNav ? 'Ver resumen' : 'Continuar'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
    <AnimatePresence>
      {timePickerState.open && timePickerState.profile && timePickerState.field && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            className="w-full max-w-xs rounded-3xl border border-indigo-200 bg-white p-4 shadow-xl space-y-4"
          >
            <TimeWheelPicker
              title={timePickerState.field === 'wakeTime' ? 'Hora de despertar' : 'Hora de dormir'}
              value={timePickerState.value}
              onChange={v => setTimePickerState(prev => ({ ...prev, value: v }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={closeTimePicker}
                className="py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (timePickerState.profile && timePickerState.field) {
                    setPerson(timePickerState.profile, { [timePickerState.field]: timePickerState.value } as Partial<Person>);
                  }
                  closeTimePicker();
                }}
                className="py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 text-sm font-semibold text-white"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
