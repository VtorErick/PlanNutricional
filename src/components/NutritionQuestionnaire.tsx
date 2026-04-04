import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, User, Scale, Target, Shield, Activity, Settings2, SkipForward, Download,
  Hourglass, Pill, Heart, Clock, ChefHat
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
  loading: boolean;
  errorMessage?: string;
  geminiModel?: string;
  setGeminiModel?: (m: string) => void;
  lastGeneratedData?: any; // Datos generados para descarga
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
function NumSlider({ label, unit, value, min, max, step = 1, onChange, required, accent }: {
  label: string; unit: string; value: string; min: number; max: number;
  step?: number; onChange: (v: string) => void; required?: boolean; accent: string;
}) {
  const num = parseFloat(value) || min;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <label className="text-sm font-semibold text-slate-600">
          {label}{required && <span className="text-rose-400 ml-1 font-bold">*</span>}
        </label>
        <div className="flex items-baseline gap-1">
          <input
            type="number" min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-16 text-right text-2xl font-black text-slate-900 bg-transparent border-none outline-none tabular-nums"
          />
          <span className="text-sm text-slate-400 font-medium pb-0.5">{unit}</span>
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={num}
        onChange={e => onChange(e.target.value)}
        className="w-full h-2.5 rounded-full cursor-pointer appearance-none bg-slate-100"
        style={{ accentColor: accent }}
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
        <span>{min} {unit}</span><span>{max} {unit}</span>
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function NutritionQuestionnaire({
  onCancel, onGenerate, loading, errorMessage, geminiModel, setGeminiModel, lastGeneratedData
}: Props) {
  const [targetProfile, setTargetProfile] = useState<TargetProfile>('ambos');
  const [stepIdx, setStepIdx]   = useState(0);
  const [direction, setDirection] = useState(1);
  const [vo, setVo] = useState<Person>(emptyPerson());
  const [va, setVa] = useState<Person>(emptyPerson());
  const [portionMode, setPortionMode] = useState<PortionMode>('auto');
  const [manualPortions, setManualPortions] = useState<Record<string, Record<string, number>>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [localModel, setLocalModel] = useState(geminiModel || 'gemini-2.0-flash');

  useEffect(() => { if (geminiModel) setLocalModel(geminiModel); }, [geminiModel]);

  const steps = useMemo(() => buildSteps(targetProfile), [targetProfile]);
  const currentStep = steps[stepIdx] ?? steps[0];
  const progress = steps.length > 1 ? stepIdx / (steps.length - 1) : 0;

  const tc = THEME[currentStep.profile ?? targetProfile];

  // ── Helpers ──────────────────────────────────────────────────────────────
  const person  = (p: 'vo' | 'va') => p === 'vo' ? vo : va;
  const setPerson = (p: 'vo' | 'va', u: Partial<Person>) => {
    if (p === 'vo') setVo(prev => ({ ...prev, ...u }));
    else            setVa(prev => ({ ...prev, ...u }));
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
          ['vo',    '👨', 'Perfil V(o)',     'Plan individual masculino'],
          ['va',    '👩', 'Perfil V(a)',     'Plan individual femenino' ],
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
            value={p.age} onChange={v => setPerson(profile, { age: v })} accent={tc.accent} />
          <NumSlider label="Peso actual" unit="kg" min={25} max={200} step={0.5} required
            value={p.currentWeightKg} onChange={v => setPerson(profile, { currentWeightKg: v })} accent={tc.accent} />
          <NumSlider label="Estatura" unit="cm" min={100} max={220} required
            value={p.heightCm} onChange={v => setPerson(profile, { heightCm: v })} accent={tc.accent} />
          <NumSlider label="Peso meta" unit="kg" min={25} max={200} step={0.5}
            value={p.targetWeightKg} onChange={v => setPerson(profile, { targetWeightKg: v })} accent={tc.accent} />
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
                    isSelected ? `border-transparent ${tc.light} ${tc.text} shadow-sm` : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}>
                  <span className="text-xl">{obj.emoji}</span>
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
            <textarea rows={2} placeholder="Diabetes, hipertensión..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={p.diagnostics} onChange={e => setPerson(profile, { diagnostics: e.target.value })} />
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
            <textarea rows={2} placeholder="Metformina, levotiroxina..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={p.medications} onChange={e => setPerson(profile, { medications: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Alergias</label>
              <input placeholder="Lactosa, gluten..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                value={p.allergies} onChange={e => setPerson(profile, { allergies: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Intolerancias</label>
              <input placeholder="Fructosa, sorbitol..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
                value={p.intolerances} onChange={e => setPerson(profile, { intolerances: e.target.value })} />
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
            <input placeholder="Gastritis, reflujo, estreñimiento..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={p.digestiveSymptoms} onChange={e => setPerson(profile, { digestiveSymptoms: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Favoritos</label>
              <input placeholder="Pollo, arroz..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
                value={p.favoriteFoods} onChange={e => setPerson(profile, { favoriteFoods: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Jamás incluir</label>
              <input placeholder="Hígado, brócoli..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
                value={p.dislikedFoods} onChange={e => setPerson(profile, { dislikedFoods: e.target.value })} />
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
                      active ? `border-transparent ${tc.light} shadow-sm` : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                    <span className="text-xl mb-0.5">{al.emoji}</span>
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
              <input type="time" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
                value={p.wakeTime} onChange={e => setPerson(profile, { wakeTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Hora de dormir</label>
              <input type="time"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
                value={p.sleepTime} onChange={e => setPerson(profile, { sleepTime: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Frecuencia de entrenamiento</label>
            <input placeholder="ej: 3 días por semana"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none"
              value={p.trainingFrequency} onChange={e => setPerson(profile, { trainingFrequency: e.target.value })} />
          </div>
        </div>
      );
    }

    /* ── PORTIONS ── */
    if (type === 'portions') {
      const foodGroups = [
        { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-rose-500', bg: 'bg-rose-50', ring: 'focus:ring-rose-400' },
        { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'focus:ring-emerald-400' },
        { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-50', ring: 'focus:ring-amber-400' },
        { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-red-500', bg: 'bg-red-50', ring: 'focus:ring-red-400' },
        { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-lime-500', bg: 'bg-lime-50', ring: 'focus:ring-lime-400' },
        { key: 'lacteos', label: 'Lácteos', icon: '🥛', color: 'text-blue-500', bg: 'bg-blue-50', ring: 'focus:ring-blue-400' },
        { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-amber-700', bg: 'bg-amber-100', ring: 'focus:ring-amber-500' },
      ];
      const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
      const mLabels = ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'];
      const mShortLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'];

      const updatePortion = (group: string, momento: string, value: string) => {
        const num = parseInt(value) || 0;
        setManualPortions(prev => ({
          ...prev,
          [group]: { ...prev[group], [momento]: num }
        }));
      };

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
                  className={`flex flex-col gap-0.5 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                    portionMode === val ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}>
                  <span className="text-xl">{emoji}</span>
                  <span className={`text-sm font-bold mt-1 ${portionMode === val ? 'text-white' : 'text-slate-800'}`}>{title}</span>
                  <span className={`text-[10px] ${portionMode === val ? 'text-slate-300' : 'text-slate-400'}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual portions table */}
          {portionMode === 'manual' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Por momentos del día</label>
              <div className="space-y-2">
                {mKeys.map((momento, idx) => (
                  <div key={momento} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{mLabels[idx]}</p>
                    <div className="grid grid-cols-7 gap-1">
                      {foodGroups.map(group => {
                        const val = manualPortions[group.key]?.[momento] || 0;
                        return (
                          <div key={group.key} className="flex flex-col items-center">
                            <span className="text-[10px] font-medium text-slate-400">{group.label.slice(0, 3)}</span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={val}
                              onChange={(e) => updatePortion(group.key, momento, e.target.value)}
                              className={`w-8 h-8 text-center text-sm font-bold bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 ${group.ring}`}
                            />
                          </div>
                        );
                      })}
                    </div>
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
            <input placeholder="Mexicana, Italiana, Asiática, Mediterránea..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={vo.favoriteCuisineStyles} onChange={e => { setVo(prev => ({ ...prev, favoriteCuisineStyles: e.target.value })); setVa(prev => ({ ...prev, favoriteCuisineStyles: e.target.value })); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Tiempo de cocina disponible
            </label>
            <input placeholder="15 min, 30 min, 1 hora..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
              value={vo.cookingTime} onChange={e => { setVo(prev => ({ ...prev, cookingTime: e.target.value })); setVa(prev => ({ ...prev, cookingTime: e.target.value })); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Notas adicionales
            </label>
            <textarea rows={3} placeholder="Preferencias de preparación, contexto especial, alimentos que no te gustan..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition"
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
        <div className="space-y-3">
          <p className="text-center text-sm text-slate-500">Revisa y confirma tu plan</p>
          
          {/* Configuración general del plan */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-slate-600">📋 Configuración del Plan</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
              <span>Perfil: <strong>{targetProfile === 'ambos' ? 'Ambos' : targetProfile === 'vo' ? 'V(o)' : 'V(a)'}</strong></span>
              <span>Porciones: <strong>{portionMode === 'auto' ? 'IA decide 🤖' : 'Manual 📋'}</strong></span>
              {portionSummary && <span className="col-span-2 text-slate-500">Resumen: {portionSummary}</span>}
              {vo.favoriteCuisineStyles && <span className="col-span-2 text-slate-500">Cocina: {vo.favoriteCuisineStyles}</span>}
              {vo.cookingTime && <span className="col-span-2 text-slate-500">Tiempo cocina: {vo.cookingTime}</span>}
              {additionalNotes && <span className="col-span-2 text-slate-500 truncate">Notas: {additionalNotes}</span>}
            </div>
          </div>
          
          {profiles.map(p => {
            const data = person(p);
            const t = THEME[p];
            return (
              <div key={p} className={`p-4 rounded-2xl border ${t.border} ${t.light}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${t.text}`}>
                  {p === 'vo' ? '👨 Perfil V(o)' : '👩 Perfil V(a)'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  {data.age && <span>Edad: <strong>{data.age} años</strong></span>}
                  <span>Peso: <strong>{data.currentWeightKg} kg</strong></span>
                  <span>Estatura: <strong>{data.heightCm} cm</strong></span>
                  {data.targetWeightKg && <span>Peso meta: <strong>{data.targetWeightKg} kg</strong></span>}
                  <span className="col-span-2">Objetivos: <strong>{data.objectives.join(', ') || 'Ninguno'}</strong></span>
                  <span className="col-span-2">Actividad: <strong>{data.activityLevel}</strong></span>
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
          
          {!loading && (
            <button onClick={handleGenerate} disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-[.98] ${
                loading ? 'bg-slate-800 opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600'
              } text-white`}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
              {loading ? 'Generando plan...' : '✨ Generar Plan con IA'}
            </button>
          )}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
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
  const profileSuffix = currentStep.profile === 'vo' ? ' · V(o)' : currentStep.profile === 'va' ? ' · V(a)' : '';

  return (
    <div className="mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-slate-100 flex-shrink-0">
        <motion.div
          className={`h-full bg-gradient-to-r ${tc.grad}`}
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
            <p className="text-[10px] text-slate-400">Paso {stepIdx + 1} / {steps.length}</p>
          </div>
        </div>
        <button onClick={onCancel}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition font-medium">
          Cerrar
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 px-4 py-5 overflow-y-auto" style={{ maxHeight: 'min(420px, 55vh)' }}>
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
              className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition active:scale-95 flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
          {showNext && (
            <>
              {isOptional && (
                <button onClick={advance}
                  className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-400 hover:bg-slate-50 transition active:scale-95">
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
  );
}
