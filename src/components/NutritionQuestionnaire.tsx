import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  Scale,
  Target,
  Shield,
  Activity,
  Settings2,
  SkipForward,
  Hourglass,
  Pill,
  Heart,
  Clock,
  ChefHat,
  Check,
  Plus,
  Minus,
  Apple,
  Leaf,
  Wheat,
  Beef,
  Droplets,
  Milk,
  Bean,
  Ruler,
  FileUp,
  ScanLine,
  Trash,
} from 'lucide-react';
import { getAiErrorReason, type AiDebugLog } from '../utils/aiDiagnostics';
import { showAppAlert } from '../utils/appDialogs';
import { DEFAULT_AI_FALLBACK_MODELS, DEFAULT_AI_MODEL, getAiModelLabel } from '../utils/aiModels';
import { getQuestionnaireTheme } from '../utils/theme';
import { calculateClinicalTDEE, generateSmaePortionsFromKcal, distributeSmaeToMeals } from '../utils/nutrition';
import {
  cleanProfileLabel,
  getCombinedProfileLabel,
  getProfileLabel,
  type ProfileLabels,
} from '../utils/profileLabels';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TargetProfile = 'el' | 'ella' | 'ambos';
export type PortionMode = 'manual' | 'auto';

export interface UploadedAssessmentPdf {
  name: string;
  mimeType: 'application/pdf';
  dataBase64: string;
}

export interface BodyMeasurements {
  waistCm: string;
  hipCm: string;
  neckCm: string;
  chestCm: string;
  armCm: string;
  thighCm: string;
}

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
  el?: any;
  ella?: any;
  profileContext?: any;
  healthContext?: any;
  preferences?: any;
  routine?: any;
  bodyMeasurements?: BodyMeasurements;
  assessmentReportPdf?: UploadedAssessmentPdf | null;
  preferredModel?: string;
}

interface Props {
  onCancel: () => void;
  onGenerate: (payload: QuestionnairePayload) => Promise<void>;
  onViewPlan?: (profile: TargetProfile) => void;
  loading: boolean;
  errorMessage?: string;
  aiErrorLog?: AiDebugLog | null;
  geminiModel: string;
  geminiRecommendedModel: string;
  geminiFallbackModels: string[];
  lastGeneratedData?: any;
  profileLabels: ProfileLabels;
  setProfileLabels: (v: ProfileLabels | ((prev: ProfileLabels) => ProfileLabels)) => void;
  targetProfile: TargetProfile;
  setTargetProfile: (p: TargetProfile) => void;
  stepIdx: number;
  setStepIdx: (i: number | ((prev: number) => number), targetOverride?: TargetProfile) => void;
  el: any;
  setEl: (v: any | ((prev: any) => any)) => void;
  ella: any;
  setElla: (v: any | ((prev: any) => any)) => void;
  portionMode: 'auto' | 'manual';
  setPortionMode: (m: 'auto' | 'manual') => void;
  manualPortions: Record<string, Record<string, number>>;
  setManualPortions: (
    p:
      | Record<string, Record<string, number>>
      | ((prev: Record<string, Record<string, number>>) => Record<string, Record<string, number>>)
  ) => void;
  additionalNotes: string;
  setAdditionalNotes: (n: string | ((prev: string) => string)) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OBJECTIVES = [
  { val: 'Perder grasa', emoji: '🔥' },
  { val: 'Ganar músculo', emoji: '💪' },
  { val: 'Mantener peso', emoji: '⚖️' },
  { val: 'Mejorar salud', emoji: '❤️' },
  { val: 'Control glucémico', emoji: '🩺' },
  { val: 'Definición muscular', emoji: '🏋️' },
  { val: 'Masa muscular', emoji: '🦾' },
  { val: 'Mejorar sueño', emoji: '😴' },
  { val: 'Reducir estrés', emoji: '🧘' },
];

const ACTIVITY_LEVELS = [
  { val: 'Sedentario', emoji: '🪑', desc: 'Sin ejercicio' },
  { val: 'Ligero', emoji: '🚶', desc: '1-2 días/sem' },
  { val: 'Moderado', emoji: '🏃', desc: '3-4 días/sem' },
  { val: 'Intenso', emoji: '⚡', desc: '5+ días/sem' },
];

const TIMELINE_OPTIONS = [
  { val: '4 sem',  label: '4 semanas',  emoji: '⚡' },
  { val: '8 sem',  label: '8 semanas',  emoji: '🌱' },
  { val: '12 sem', label: '12 semanas', emoji: '🎯' },
  { val: '16 sem', label: '16 semanas', emoji: '🏔️' },
  { val: '20 sem', label: '20 semanas', emoji: '💎' },
  { val: '24 sem', label: '24 semanas', emoji: '🔥' },
];

const DEFAULT_MOMENTS = [
  { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
  { key: 'colacion_am', label: 'Colación AM', hora: '11:00' },
  { key: 'comida', label: 'Comida', hora: '14:00' },
  { key: 'colacion_pm', label: 'Colación PM', hora: '17:00' },
  { key: 'cena', label: 'Cena', hora: '20:00' },
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
  bodyMeasurements: {
    waistCm: '',
    hipCm: '',
    neckCm: '',
    chestCm: '',
    armCm: '',
    thighCm: '',
  } as BodyMeasurements,
  assessmentReportPdf: null as UploadedAssessmentPdf | null,
  clinicalPortionsGrid: undefined as Record<string, Record<string, number>> | undefined,
});
type Person = ReturnType<typeof emptyPerson>;

// ─── Wizard steps ─────────────────────────────────────────────────────────────
type StepType =
  | 'who'
  | 'fisica'
  | 'objetivo'
  | 'salud'
  | 'medicos'
  | 'assessment'
  | 'preferencias'
  | 'lifestyle'
  | 'portions'
  | 'cocina'
  | 'confirm';

interface WizardStep {
  type: StepType;
  profile?: 'el' | 'ella';
}

function buildSteps(tp: TargetProfile): WizardStep[] {
  const personSteps = (p: 'el' | 'ella'): WizardStep[] => [
    { type: 'fisica', profile: p },
    { type: 'objetivo', profile: p },
    { type: 'salud', profile: p },
    { type: 'medicos', profile: p },
    { type: 'preferencias', profile: p },
    { type: 'lifestyle', profile: p },
  ];

  const steps: WizardStep[] = [{ type: 'who' }];

  if (tp === 'ambos') {
    steps.push(...personSteps('el'), ...personSteps('ella'));
  } else {
    steps.push(...personSteps(tp));
  }

  steps.push({ type: 'portions' }, { type: 'cocina' }, { type: 'confirm' });
  return steps;
}

function getWizardSection(step: WizardStep, target: TargetProfile) {
  const total = target === 'ambos' ? 5 : 4;
  if (step.type === 'who') return { current: 1, total, label: 'Configuración' };
  if (step.profile) {
    const current = target === 'ambos' ? (step.profile === 'el' ? 2 : 3) : 2;
    return { current, total, label: 'Tu información' };
  }
  if (step.type === 'confirm') return { current: total, total, label: 'Revisión' };
  return { current: total - 1, total, label: 'Ajustes finales' };
}

// ─── Motion ───────────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0 }),
};

// ─── Theme by profile ─────────────────────────────────────────────────────────
const THEME = {
  el: getQuestionnaireTheme('el'),
  ella: getQuestionnaireTheme('ella'),
  ambos: getQuestionnaireTheme('ambos'),
};

const STEP_META: Record<StepType, { label: string; Icon: any }> = {
  who: { label: '¿Para quién?', Icon: User },
  fisica: { label: 'Medidas', Icon: Scale },
  objetivo: { label: 'Objetivo', Icon: Target },
  salud: { label: 'Salud', Icon: Shield },
  medicos: { label: 'Médicos', Icon: Pill },
  assessment: { label: 'Medidas', Icon: ScanLine },
  preferencias: { label: 'Preferencias', Icon: Heart },
  lifestyle: { label: 'Actividad', Icon: Activity },
  portions: { label: 'Porciones', Icon: Settings2 },
  cocina: { label: 'Cocina', Icon: ChefHat },
  confirm: { label: 'Confirmar', Icon: Sparkles },
};

const QUICK_TAGS = {
  diagnostics: [
    'Ninguna', 
    'No sé / prefiero no responder',
    'Diabetes / Resistencia a la insulina', 
    'Hipertensión', 
    'Enfermedad renal', 
    'Cálculos renales',
    'Gota (Ácido úrico)',
    'Hipotiroidismo', 
    'SOP', 
    'Colesterol alto', 
    'Hígado graso'
  ],
  medications: [
    'Ninguno', 
    'No sé / prefiero no responder',
    'Metformina', 
    'Levotiroxina', 
    'Antihipertensivos', 
    'Estatinas', 
    'Omeprazol', 
    'Anticonceptivos', 
    'Antidepresivos'
  ],
  allergies: [
    'Ninguna', 
    'No sé / prefiero no responder',
    'Lácteos', 
    'Gluten (Celiaquía)', 
    'Cacahuates', 
    'Mariscos / Pescado', 
    'Nueces / Semillas', 
    'Soya', 
    'Huevo'
  ],
  intolerances: [
    'Ninguna', 
    'No sé / prefiero no responder',
    'Lactosa', 
    'Fructosa', 
    'Sorbitol', 
    'Leguminosas (frijoles/lentejas)', 
    'Picante / Irritantes',
    'Maíz'
  ],
  digestive: [
    'Ninguno', 
    'No sé / prefiero no responder',
    'Reflujo / Acidez', 
    'Gastritis', 
    'Inflamación / Gases', 
    'Síndrome de Intestino Irritable (FODMAP)',
    'Estreñimiento', 
    'Diarrea / Evacuaciones líquidas'
  ],
  favorites: ['Pollo', 'Arroz', 'Atún', 'Avena'],
  disliked: ['Hígado', 'Brócoli', 'Coliflor'],
};

const TRAINING_FREQUENCY_CHIPS = ['1-2 días', '3-4 días', '5+ días', 'Diario'];
const CUISINE_STYLE_OPTIONS = ['Mexicana', 'Italiana', 'Asiática', 'Mediterránea', 'Casera', 'Vegetariana'];
const COOKING_TIME_OPTIONS = ['5-10 min', '15 min', '20 min', '30 min', '45 min', '1 hora', '1.5 horas', '+2 horas (meal prep)'];
const MAX_ASSESSMENT_PDF_BYTES = 5 * 1024 * 1024;
const MAX_ASSESSMENT_PDF_MB = Math.round(MAX_ASSESSMENT_PDF_BYTES / (1024 * 1024));

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function CardSection({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {(title || hint) && (
        <div>
          {title && <p className="text-sm font-bold text-ink-700 dark:text-cream-100">{title}</p>}
          {hint && <p className="text-xs text-ink-400 mt-0.5 dark:text-ink-400">{hint}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
  activeClassName = 'border-pine-500 bg-pine-50 text-pine-700 dark:border-pine-400 dark:bg-pine-950/60 dark:text-pine-200',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition-all active:scale-[.98] ${
        active ? activeClassName : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-200 dark:hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  );
}

function CheckList({
  options,
  currentValueString,
  onToggle
}: {
  options: string[];
  currentValueString: string;
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-2xl border border-cream-200 bg-white scrollbar-thin scrollbar-thumb-cream-200 dark:border-ink-600 dark:bg-ink-900 dark:scrollbar-thumb-ink-600">
      {options.map((option) => {
        const isActive = currentValueString.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={`flex min-h-11 w-full items-center justify-between border-b border-cream-100 px-3 py-2.5 text-left transition-colors last:border-b-0 dark:border-ink-700 ${
              isActive 
                ? 'bg-pine-50 text-pine-700 font-bold dark:bg-pine-950/40 dark:text-pine-200'
                : 'bg-white text-ink-500 hover:bg-cream-50 dark:bg-ink-900 dark:text-cream-300 dark:hover:bg-ink-800'
            }`}
          >
            <span className="text-[13px] leading-tight pr-2">{option}</span>
            <div className={`w-5 h-5 flex-shrink-0 rounded-md flex items-center justify-center border transition-all ${
              isActive
                ? 'bg-pine-600 border-pine-600 dark:bg-pine-500 dark:border-pine-500'
                : 'border-cream-300 bg-cream-50 dark:border-ink-500 dark:bg-ink-800'
            }`}>
              {isActive && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function QuickTag({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-cream-200 bg-white text-ink-500 hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-200 dark:hover:bg-ink-800"
    >
      {children}
    </button>
  );
}

function NumField({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
  required,
}: {
  label: string;
  unit: string;
  value: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: string) => void;
  required?: boolean;
  minIcon?: string;
  maxIcon?: string;
}) {
  const parsed = Number.parseFloat(value);
  const safeValue = Number.isFinite(parsed) ? parsed : min;

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const formatValue = (n: number) => {
    const fixed = step % 1 !== 0 ? n.toFixed(1) : String(Math.round(n));
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-cream-200 bg-white p-3 transition-colors focus-within:border-pine-400 focus-within:ring-2 focus-within:ring-pine-100 dark:border-ink-600 dark:bg-ink-900 dark:focus-within:border-pine-600 dark:focus-within:ring-pine-900/50">
      <div className="flex items-center justify-between text-[11px] font-bold text-ink-400 uppercase dark:text-ink-400">
        <label>
          {label} {required && <span className="text-coral-400 ml-0.5">*</span>}
        </label>
        <span className="opacity-70 font-black">{unit}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={unit}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-base font-black text-ink-700 bg-transparent outline-none dark:text-cream-100 placeholder:text-cream-300 dark:placeholder:text-ink-600 text-center"
        />
      </div>
    </div>
  );
}

type Meridiem = 'AM' | 'PM';

function clampTimeNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseTimeTo12HourParts(value: string) {
  if (!value || !value.includes(':')) {
    return { hour12: '7', minute: '00', meridiem: 'AM' as Meridiem };
  }

  const [rawHour, rawMinute] = value.split(':').map((v) => Number.parseInt(v, 10));
  const hour24 = clampTimeNumber(rawHour, 0, 23);
  const minute = clampTimeNumber(rawMinute, 0, 59);
  const meridiem: Meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return {
    hour12: String(hour12),
    minute: String(minute).padStart(2, '0'),
    meridiem,
  };
}

function formatTimeFrom12HourParts(hour12Value: string, minuteValue: string, meridiem: Meridiem) {
  const hour12 = clampTimeNumber(Number.parseInt(hour12Value, 10), 1, 12);
  const minute = clampTimeNumber(Number.parseInt(minuteValue, 10), 0, 59);
  const hour24 = meridiem === 'AM'
    ? (hour12 === 12 ? 0 : hour12)
    : (hour12 === 12 ? 12 : hour12 + 12);

  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatTimeForDisplay(value: string, fallback: string) {
  const { hour12, minute, meridiem } = parseTimeTo12HourParts(value || fallback);
  return `${hour12}:${minute} ${meridiem}`;
}

function TimeWheelPicker({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { hour12: string; minute: string; meridiem: Meridiem };
  onChange: (v: { hour12: string; minute: string; meridiem: Meridiem }) => void;
}) {
  const normalizeHour = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 2);
    if (!digitsOnly) return '';
    return String(clampTimeNumber(Number.parseInt(digitsOnly, 10), 1, 12));
  };

  const normalizeMinute = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 2);
    if (!digitsOnly) return '';
    return String(clampTimeNumber(Number.parseInt(digitsOnly, 10), 0, 59)).padStart(2, '0');
  };

  const safePreview = formatTimeFrom12HourParts(
    value.hour12 || '7',
    value.minute || '00',
    value.meridiem
  );

  const previewLabel = (() => {
    const { hour12, minute, meridiem } = parseTimeTo12HourParts(safePreview);
    return `${hour12}:${minute} ${meridiem}`;
  })();

  const changeHour = (delta: number) => {
    const base = clampTimeNumber(Number.parseInt(value.hour12 || '7', 10), 1, 12);
    const next = base + delta;
    const wrapped = next < 1 ? 12 : next > 12 ? 1 : next;
    onChange({ ...value, hour12: String(wrapped) });
  };

  const changeMinute = (delta: number) => {
    const base = clampTimeNumber(Number.parseInt(value.minute || '00', 10), 0, 59);
    const next = base + delta;
    const wrapped = next < 0 ? 59 : next > 59 ? 0 : next;
    onChange({ ...value, minute: String(wrapped).padStart(2, '0') });
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-semibold text-ink-600 dark:text-cream-100">{title}</p>

      <div className="rounded-[24px] border border-pine-100 bg-gradient-to-br from-pine-50 to-pine-50 p-4 shadow-sm dark:border-pine-900/60 dark:from-ink-900 dark:to-pine-950/60">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-cream-200 bg-white p-3 shadow-sm dark:border-ink-600 dark:bg-ink-900">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-ink-600 dark:text-cream-100">Hora</div>
              <div className="text-xs font-semibold uppercase text-ink-400 dark:text-ink-400">1-12</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeHour(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-cream-200 bg-cream-50 text-ink-600 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
                aria-label="Reducir hora"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={value.hour12}
                onChange={(e) => onChange({ ...value, hour12: normalizeHour(e.target.value) })}
                onBlur={() => onChange({ ...value, hour12: normalizeHour(value.hour12 || '7') || '7' })}
                className="h-10 flex-1 rounded-xl border border-cream-200 bg-white text-center text-base font-black text-ink-700 outline-none focus:ring-2 focus:ring-cream-300 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-50 dark:focus:ring-ink-600"
              />

              <button
                type="button"
                onClick={() => changeHour(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-cream-200 bg-cream-50 text-ink-600 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
                aria-label="Aumentar hora"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-3 shadow-sm dark:border-ink-600 dark:bg-ink-900">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-ink-600 dark:text-cream-100">Min</div>
              <div className="text-xs font-semibold uppercase text-ink-400 dark:text-ink-400">00-59</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeMinute(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-cream-200 bg-cream-50 text-ink-600 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
                aria-label="Reducir minutos"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={value.minute}
                onChange={(e) => onChange({ ...value, minute: normalizeMinute(e.target.value) })}
                onBlur={() => onChange({ ...value, minute: normalizeMinute(value.minute || '00') || '00' })}
                className="h-10 flex-1 rounded-xl border border-cream-200 bg-white text-center text-base font-black text-ink-700 outline-none focus:ring-2 focus:ring-cream-300 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-50 dark:focus:ring-ink-600"
              />

              <button
                type="button"
                onClick={() => changeMinute(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-cream-200 bg-cream-50 text-ink-600 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
                aria-label="Aumentar minutos"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-sm dark:border-ink-600 dark:bg-ink-900">
          <div className="mb-2 text-sm font-semibold text-ink-600 dark:text-cream-100">Formato</div>
          <div className="grid grid-cols-2 gap-2">
            {(['AM', 'PM'] as const).map((period) => {
              const active = value.meridiem === period;
              return (
                <button
                  key={period}
                  type="button"
                  onClick={() => onChange({ ...value, meridiem: period })}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all active:scale-[0.98] ${
                    active
                      ? 'border-pine-500 bg-pine-600 text-white shadow-sm dark:border-pine-400 dark:bg-pine-500'
                      : 'border-cream-200 bg-cream-50 text-ink-600 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-200'
                  }`}
                >
                  {period}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-pine-500 font-semibold dark:text-pine-300">
        Hora seleccionada: {previewLabel}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NutritionQuestionnaire({
  onCancel,
  onGenerate,
  onViewPlan,
  loading,
  errorMessage,
  aiErrorLog,
  geminiRecommendedModel,
  geminiFallbackModels,
  lastGeneratedData,
  profileLabels,
  setProfileLabels,
  targetProfile,
  setTargetProfile,
  stepIdx,
  setStepIdx,
  el,
  setEl,
  ella,
  setElla,
  portionMode,
  setPortionMode,
  manualPortions,
  setManualPortions,
  additionalNotes,
  setAdditionalNotes,
}: Props) {
  const [direction, setDirection] = useState(1);
  const [timePickerState, setTimePickerState] = useState<{
    open: boolean;
    profile: 'el' | 'ella' | null;
    field: 'wakeTime' | 'sleepTime' | null;
    value: { hour12: string; minute: string; meridiem: Meridiem };
  }>({
    open: false,
    profile: null,
    field: null,
    value: { hour12: '7', minute: '00', meridiem: 'AM' },
  });

  const [activePortionMoment, setActivePortionMoment] = useState('desayuno');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeLockReleaseTimeoutRef = useRef<number | null>(null);
  const [showAiErrorReason, setShowAiErrorReason] = useState(false);

  const releaseScreenWakeLock = useCallback(async () => {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch {
      // ignore
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
      // ignore
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
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
  const plannedModel = geminiRecommendedModel || DEFAULT_AI_MODEL;
  const plannedModelLabel = getAiModelLabel(plannedModel);
  const fallbackPreview = (geminiFallbackModels.length ? geminiFallbackModels : DEFAULT_AI_FALLBACK_MODELS).slice(0, 2);
  const fallbackPreviewLabel = fallbackPreview.map((model) => getAiModelLabel(model)).join(', ');
  const currentStep = steps[stepIdx] ?? steps[0];
  const progress = steps.length > 1 ? stepIdx / (steps.length - 1) : 0;
  const sectionMeta = getWizardSection(currentStep, targetProfile);
  const tc = THEME[currentStep.profile ?? targetProfile];
  const labelEl = getProfileLabel(profileLabels, 'el');
  const labelElla = getProfileLabel(profileLabels, 'ella');
  const labelAmbos = getCombinedProfileLabel(profileLabels);
  const targetLabel =
    targetProfile === 'ambos' ? labelAmbos : targetProfile === 'el' ? labelEl : labelElla;
  const [profileLabelDrafts, setProfileLabelDrafts] = useState<ProfileLabels>(() => ({
    el: labelEl,
    ella: labelElla,
  }));
  const [editingProfileLabel, setEditingProfileLabel] = useState<'el' | 'ella' | null>(null);

  useEffect(() => {
    if (editingProfileLabel) return;
    setProfileLabelDrafts({ el: labelEl, ella: labelElla });
  }, [editingProfileLabel, labelEl, labelElla]);

  const person = (p: 'el' | 'ella') => (p === 'el' ? el : ella);

  const setPerson = (p: 'el' | 'ella', u: Partial<Person>) => {
    if (p === 'el') setEl((prev: any) => ({ ...prev, ...u }));
    else setElla((prev: any) => ({ ...prev, ...u }));
  };

  const advance = () => {
    if (stepIdx < steps.length - 1) {
      setDirection(1);
      setStepIdx((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIdx > 0) {
      setDirection(-1);
      setStepIdx((i) => i - 1);
    }
  };

  const selectProfile = (p: TargetProfile) => {
    setTargetProfile(p);
    setDirection(1);
    setStepIdx(1, p);
  };

  const updateProfileLabel = (profileId: 'el' | 'ella', value: string) => {
    setProfileLabelDrafts((prev) => ({
      ...prev,
      [profileId]: value.slice(0, 24),
    }));
  };

  const commitProfileLabel = (profileId: 'el' | 'ella') => {
    const fallback = profileId === 'el' ? 'El' : 'Ella';
    const cleanedLabel = cleanProfileLabel(profileLabelDrafts[profileId], fallback);

    setProfileLabels((prev) => ({
      ...prev,
      [profileId]: cleanedLabel,
    }));
    setProfileLabelDrafts((prev) => ({
      ...prev,
      [profileId]: cleanedLabel,
    }));
    setEditingProfileLabel(null);
  };

  const handleProfileLabelKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    profileId: 'el' | 'ella'
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitProfileLabel(profileId);
      event.currentTarget.blur();
    }
  };

  const canContinue = () => {
    const { type, profile } = currentStep;
    if (type === 'fisica' && profile) {
      return !!person(profile).age && !!person(profile).currentWeightKg && !!person(profile).heightCm;
    }
    if (type === 'objetivo' && profile) {
      return person(profile).objectives.length > 0;
    }
    return true;
  };

  const appendTag = (profile: 'el' | 'ella', field: keyof Person, tag: string) => {
    const currentValue = String(person(profile)[field] ?? '').trim();
    const values = currentValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (!values.includes(tag)) {
      const next = [...values, tag].join(', ');
      setPerson(profile, { [field]: next } as Partial<Person>);
    }
  };

  const toggleListTag = (profile: 'el' | 'ella', field: keyof Person, tag: string) => {
    const currentValue = String(person(profile)[field] ?? '').trim();
    let values = currentValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const unknownTag = 'No sé / prefiero no responder';
    if (tag === 'Ninguna' || tag === 'Ninguno' || tag === unknownTag) {
      values = [tag];
    } else {
      values = values.filter((v) => v !== 'Ninguna' && v !== 'Ninguno' && v !== unknownTag);
      if (values.includes(tag)) {
        values = values.filter((v) => v !== tag);
      } else {
        values.push(tag);
      }
    }

    setPerson(profile, { [field]: values.join(', ') } as Partial<Person>);
  };

  const openTimePicker = (
    profile: 'el' | 'ella',
    field: 'wakeTime' | 'sleepTime',
    currentValue: string
  ) => {
    const defaultValue = field === 'wakeTime' ? '07:00' : '22:00';
    setTimePickerState({
      open: true,
      profile,
      field,
      value: parseTimeTo12HourParts(currentValue || defaultValue),
    });
  };

  const closeTimePicker = () =>
    setTimePickerState({
      open: false,
      profile: null,
      field: null,
      value: { hour12: '7', minute: '00', meridiem: 'AM' },
    });

  const confirmTimePicker = () => {
    if (!timePickerState.profile || !timePickerState.field) return;
    setPerson(timePickerState.profile, {
      [timePickerState.field]: formatTimeFrom12HourParts(
        timePickerState.value.hour12,
        timePickerState.value.minute,
        timePickerState.value.meridiem
      ),
    } as Partial<Person>);
    closeTimePicker();
  };

  const updateBodyMeasurement = (
    profile: 'el' | 'ella',
    field: keyof BodyMeasurements,
    value: string
  ) => {
    const currentMeasurements = person(profile).bodyMeasurements ?? emptyPerson().bodyMeasurements;
    setPerson(profile, {
      bodyMeasurements: {
        ...currentMeasurements,
        [field]: value,
      },
    } as Partial<Person>);
  };

  const handleAssessmentPdfUpload = async (
    profile: 'el' | 'ella',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (file.type !== 'application/pdf') {
      await showAppAlert({
        title: 'Archivo no válido',
        message: 'Adjunta un archivo PDF para usarlo como reporte corporal.',
      });
      return;
    }

    if (file.size > MAX_ASSESSMENT_PDF_BYTES) {
      await showAppAlert({
        title: 'PDF demasiado grande',
        message: `El reporte corporal debe pesar máximo ${MAX_ASSESSMENT_PDF_MB} MB.`,
      });
      return;
    }

    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const base64 = result.includes(',') ? result.split(',')[1] : '';
          if (!base64) {
            reject(new Error('No se pudo leer el PDF seleccionado.'));
            return;
          }
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('No se pudo leer el PDF seleccionado.'));
        reader.readAsDataURL(file);
      });

      setPerson(profile, {
        assessmentReportPdf: {
          name: file.name,
          mimeType: 'application/pdf',
          dataBase64,
        },
      } as Partial<Person>);
    } catch (error) {
      console.error('Failed to read assessment PDF:', error);
      await showAppAlert({
        title: 'No se pudo leer el PDF',
        message: 'Intenta de nuevo con otro archivo o vuelve a exportarlo desde tu báscula.',
      });
    }
  };

  const clearAssessmentPdf = (profile: 'el' | 'ella') => {
    setPerson(profile, { assessmentReportPdf: null } as Partial<Person>);
  };

  const updatePortionValue = (
    group: string,
    momento: string,
    updater: (n: number) => number
  ) => {
    setManualPortions((prev: Record<string, Record<string, number>>) => {
      const current = prev[group]?.[momento] ?? 0;
      const next = Math.max(0, Math.min(10, updater(current)));
      return {
        ...prev,
        [group]: { ...prev[group], [momento]: next },
      };
    });
  };

  // Cuisine styles are tracked independently per profile.
  // For 'ambos', we display/edit el's styles in the shared cocina step.
  const selectedCuisineStyles = useMemo(() => {
    const source = targetProfile === 'ella' ? ella : el;
    return String(source.favoriteCuisineStyles || '')
      .split(',')
      .map((v: string) => v.trim())
      .filter(Boolean);
  }, [targetProfile, el, ella]);

  const setCuisineStyles = (styles: string[]) => {
    const joined = styles.join(', ');
    if (targetProfile === 'ella') {
      setElla((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
    } else if (targetProfile === 'ambos') {
      setEl((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
      setElla((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
    } else {
      setEl((prev: any) => ({ ...prev, favoriteCuisineStyles: joined }));
    }
  };

  const toggleCuisineStyle = (style: string) => {
    const next = selectedCuisineStyles.includes(style)
      ? selectedCuisineStyles.filter((s) => s !== style)
      : [...selectedCuisineStyles, style];
    setCuisineStyles(next);
  };

  const handleGenerate = async () => {
    const buildPP = (p: Person) => ({
      profileContext: {
        age: p.age,
        currentWeightKg: p.currentWeightKg,
        heightCm: p.heightCm,
        targetWeightKg: p.targetWeightKg,
        objectives: p.objectives,
        objectiveTimelineWeeks: p.objectiveTimeline,
        clinicalPortionsGrid: p.clinicalPortionsGrid,
      },
      healthContext: {
        diagnostics: p.diagnostics,
        allergies: p.allergies,
        medications: p.medications,
        intolerances: p.intolerances,
        digestiveSymptoms: p.digestiveSymptoms,
      },
      preferences: {
        favoriteFoods: p.favoriteFoods,
        dislikedFoods: p.dislikedFoods,
        favoriteCuisineStyles: p.favoriteCuisineStyles,
        cookingTime: p.cookingTime,
      },
      routine: {
        activityLevel: p.activityLevel,
        wakeTime: p.wakeTime,
        sleepTime: p.sleepTime,
        trainingFrequency: p.trainingFrequency,
      },
      bodyMeasurements: p.bodyMeasurements,
      assessmentReportPdf: p.assessmentReportPdf,
    });

    const elCopy = { ...el };
    const ellaCopy = { ...ella };

    if (portionMode === 'auto') {
      try {
        const calculateForProfile = (p: any, type: TargetProfile) => {
          const w = parseFloat(p.currentWeightKg) || 70;
          const h = parseFloat(p.heightCm) || 170;
          const a = parseInt(p.age) || 30;
          const isM = (p.gender || (type === 'el' ? 'Masculino' : 'Femenino')) === 'Masculino';
          const goals = Array.isArray(p.objectives) ? p.objectives : [];
          
          const clinical = calculateClinicalTDEE(w, h, a, isM, p.activityLevel, goals);
          const smae = generateSmaePortionsFromKcal(clinical.targetKcal, w, goals);
          return distributeSmaeToMeals(smae, DEFAULT_MOMENTS.length);
        };

        if (targetProfile === 'el' || targetProfile === 'ambos') {
          elCopy.clinicalPortionsGrid = calculateForProfile(elCopy, 'el');
        }
        if (targetProfile === 'ella' || targetProfile === 'ambos') {
          ellaCopy.clinicalPortionsGrid = calculateForProfile(ellaCopy, 'ella');
        }
      } catch (err) {
        console.error("Clinical engine override failed:", err);
      }
    }

    const base = {
      targetProfile,
      profileToUpdate: targetProfile,
      portionMode,
      planConfig: {
        mealsPerDay: DEFAULT_MOMENTS.length.toString(),
        selectedMoments: DEFAULT_MOMENTS,
        manualPortions: portionMode === 'manual' ? manualPortions : {},
        additionalNotes,
      },
    };

    if (targetProfile === 'ambos') {
      await onGenerate({ ...base, el: buildPP(elCopy), ella: buildPP(ellaCopy) });
    } else {
      const p = targetProfile === 'el' ? elCopy : ellaCopy;
      await onGenerate({ ...base, ...buildPP(p) });
    }
  };

  const renderStep = () => {
    const { type, profile } = currentStep;

    if (type === 'who') {
      const nameFields: Array<'el' | 'ella'> = targetProfile === 'ambos'
        ? ['el', 'ella']
        : [targetProfile];

      return (
        <div className="space-y-4">
          <div>
            <p className="text-base font-extrabold text-ink-800 dark:text-cream-100">
              Elige para quién es este plan
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
              Toma aproximadamente 3 minutos. Puedes cambiar esta opción después; los nombres solo sirven para identificar cada plan.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white dark:border-ink-600 dark:bg-ink-900">
            {([
              ['el', `Persona 1 · ${labelEl}`, 'Un plan para una persona'],
              ['ella', `Persona 2 · ${labelElla}`, 'Un plan para una persona'],
            ] as const).map(([val, title, sub]) => {
              const t = THEME[val];
              const active = targetProfile === val || targetProfile === 'ambos';
              const profileButtonDisabled = loading;

              return (
                <button
                  key={val}
                  onClick={() => !profileButtonDisabled && selectProfile(val)}
                  data-testid={`questionnaire-target-${val}`}
                  disabled={profileButtonDisabled}
                  className={`flex min-h-16 w-full items-center gap-3 border-b border-cream-100 px-4 py-3 text-left font-semibold transition-colors last:border-b-0 dark:border-ink-700 ${
                    active
                      ? t.light
                      : 'bg-white hover:bg-cream-50 dark:bg-ink-900 dark:hover:bg-ink-800'
                  } ${profileButtonDisabled ? 'cursor-not-allowed opacity-55' : ''}`}
                >
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${active ? `${t.border} ${t.text}` : 'border-cream-300 dark:border-ink-500'}`}>
                    {active && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold leading-tight ${active ? t.text : 'text-ink-700 dark:text-cream-100'}`}>
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => selectProfile('ambos')}
            data-testid="questionnaire-target-ambos"
            disabled={loading}
            className={`flex w-full items-center justify-between border-y px-1 py-3 text-left transition active:scale-[.99] disabled:opacity-50 ${targetProfile === 'ambos' ? 'border-pine-200 text-pine-800 dark:border-pine-900 dark:text-pine-200' : 'border-cream-200 hover:text-pine-700 dark:border-ink-700 dark:hover:text-pine-200'}`}
          >
            <span>
              <span className="block text-sm font-extrabold text-ink-700 dark:text-cream-100">¿También quieres crear otro plan?</span>
              <span className="mt-0.5 block text-xs text-ink-400">Configúralo para dos personas.</span>
            </span>
            {targetProfile === 'ambos'
              ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-pine-600 dark:text-pine-300" />
              : <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-400" />}
          </button>

          <div>
            <div className="mb-3">
              <p className="text-sm font-bold text-ink-700 dark:text-cream-100">¿Cómo quieres identificar este plan?</p>
              <p className="mt-1 text-xs text-ink-400">Opcional. Puedes usar un nombre, apodo o dejar el sugerido.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {nameFields.map((profileId) => {
                const isEl = profileId === 'el';
                const fallbackLabel = isEl ? 'El' : 'Ella';
                return (
                  <label key={profileId} className="space-y-1.5">
                    <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-ink-400 dark:text-ink-400">
                      {isEl ? 'Primer perfil' : 'Segundo perfil'}
                    </span>
                    <input
                      value={profileLabelDrafts[profileId]}
                      onFocus={() => setEditingProfileLabel(profileId)}
                      onChange={(event) => updateProfileLabel(profileId, event.target.value)}
                      onBlur={() => commitProfileLabel(profileId)}
                      onKeyDown={(event) => handleProfileLabelKeyDown(event, profileId)}
                      maxLength={24}
                      data-testid={`questionnaire-label-${profileId}`}
                      aria-label={`Nombre del ${isEl ? 'primer' : 'segundo'} perfil`}
                      className="h-11 w-full rounded-[14px] border border-cream-200 bg-cream-50 px-3 text-sm font-bold text-ink-700 outline-none transition focus:border-pine-300 focus:ring-2 focus:ring-pine-100 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100 dark:focus:border-pine-500 dark:focus:ring-pine-950"
                      placeholder={fallbackLabel}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-400 dark:text-ink-400">
            <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pine-600 dark:text-pine-300" />
            Comparte sólo la información necesaria. Evita nombres completos o datos identificables en las notas.
          </p>
        </div>
      );
    }

    if (type === 'fisica' && profile) {
      const p = person(profile);
      return (
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label="Edad"
            unit="años"
            min={10}
            max={100}
            step={1}
            required
            value={p.age}
            onChange={(v) => setPerson(profile, { age: v })}
            minIcon="👶"
            maxIcon="🧓"
          />

          <NumField
            label="Peso actual"
            unit="kg"
            min={25}
            max={200}
            step={0.5}
            required
            value={p.currentWeightKg}
            onChange={(v) => setPerson(profile, { currentWeightKg: v })}
            minIcon="🏋️"
            maxIcon="🏋️‍♂️"
          />

          <NumField
            label="Estatura"
            unit="cm"
            min={100}
            max={220}
            step={1}
            required
            value={p.heightCm}
            onChange={(v) => setPerson(profile, { heightCm: v })}
            minIcon="🧍"
            maxIcon="🧍‍♂️"
          />

          <NumField
            label="Peso meta"
            unit="kg"
            min={25}
            max={200}
            step={0.5}
            value={p.targetWeightKg}
            onChange={(v) => setPerson(profile, { targetWeightKg: v })}
            minIcon="🎯"
            maxIcon="🏁"
          />
        </div>
      );
    }

    if (type === 'objetivo' && profile) {
      const p = person(profile);

      return (
        <div className="space-y-4">
          {/* ── Objetivos: grid 3 col compacto ── */}
          <div>
            <p className="text-sm font-bold text-ink-700 dark:text-cream-100 mb-2">Objetivos</p>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map((obj) => {
                const isSelected = p.objectives.includes(obj.val);
                const toggleObjective = () => {
                  const newObjectives = isSelected
                    ? p.objectives.filter((o: string) => o !== obj.val)
                    : [...p.objectives, obj.val];
                  setPerson(profile, { objectives: newObjectives });
                };

                return (
                  <button
                    key={obj.val}
                    type="button"
                    onClick={toggleObjective}
                    className={`
                      relative flex min-h-12 items-center gap-2
                      rounded-[14px] border px-3 py-2.5 text-left
                      transition-all duration-150 active:scale-[.96] select-none
                      ${isSelected
                        ? `${tc.border} ${tc.light} ${tc.text}`
                        : 'border-cream-200 bg-white text-ink-400 hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800'
                      }
                    `}
                  >
                    {/* Check badge */}
                    {isSelected && (
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: tc.accent }}
                      >
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    {!isSelected && <span className="h-4 w-4 flex-shrink-0 rounded-full border border-cream-300 dark:border-ink-500" />}
                    <span className={`text-xs font-bold leading-tight ${isSelected ? '' : 'text-ink-500 dark:text-cream-300'}`}>
                      {obj.val}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tiempo objetivo: grid 3×2 ── */}
          <div>
            <p className="text-sm font-bold text-ink-700 dark:text-cream-100 mb-2">Tiempo objetivo</p>
            <div className="grid grid-cols-3 gap-2">
              {TIMELINE_OPTIONS.map((tl) => {
                const active = p.objectiveTimeline === tl.val;
                return (
                  <button
                    key={tl.val}
                    type="button"
                    onClick={() => setPerson(profile, { objectiveTimeline: tl.val })}
                    className={`
                      flex min-h-11 items-center justify-center
                      rounded-[14px] border px-2 py-2.5 transition-all active:scale-[.97]
                      ${active
                        ? `${tc.border} ${tc.light} ${tc.text}`
                        : 'border-cream-200 bg-white text-ink-400 hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800'
                      }
                    `}
                  >
                    <span className="text-xs font-bold">{tl.val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (type === 'salud' && profile) {
      const p = person(profile);

      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Esta sección es opcional. Puedes saltar si no aplica.
          </p>

          <CardSection title="Condiciones médicas" hint="Selecciona si tienes alguna de las siguientes.">
            <CheckList 
              options={QUICK_TAGS.diagnostics} 
              currentValueString={p.diagnostics || ''} 
              onToggle={(tag) => toggleListTag(profile, 'diagnostics', tag)} 
            />
          </CardSection>
        </div>
      );
    }

    if (type === 'medicos' && profile) {
      const p = person(profile);

      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Esta sección es opcional.
          </p>

          <CardSection title="Medicamentos" hint="Selecciona los que usas frecuentemente.">
            <CheckList 
              options={QUICK_TAGS.medications} 
              currentValueString={p.medications || ''} 
              onToggle={(tag) => toggleListTag(profile, 'medications', tag)} 
            />
          </CardSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CardSection title="Alergias">
              <CheckList 
                options={QUICK_TAGS.allergies} 
                currentValueString={p.allergies || ''} 
                onToggle={(tag) => toggleListTag(profile, 'allergies', tag)} 
              />
            </CardSection>

            <CardSection title="Intolerancias">
              <CheckList 
                options={QUICK_TAGS.intolerances} 
                currentValueString={p.intolerances || ''} 
                onToggle={(tag) => toggleListTag(profile, 'intolerances', tag)} 
              />
            </CardSection>
          </div>
        </div>
      );
    }

    if (type === 'assessment' && profile) {
      const p = person(profile);
      const measurements = p.bodyMeasurements ?? emptyPerson().bodyMeasurements;

      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Este paso es opcional. Puedes adjuntar un PDF de báscula corporal o capturar medidas manuales.
          </p>

          <CardSection
            title="Reporte corporal en PDF"
            hint={`Ejemplo: un resumen tipo Renpho con grasa, músculo, agua corporal o métricas similares. Máximo ${MAX_ASSESSMENT_PDF_MB} MB.`}
          >
            <label className="flex flex-col gap-3 rounded-3xl border border-cream-200 bg-white p-4 shadow-sm cursor-pointer active:scale-[.99] transition dark:border-ink-600 dark:bg-ink-900">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-pine-50 text-pine-600 flex items-center justify-center flex-shrink-0 dark:bg-pine-950/50 dark:text-pine-200">
                  <FileUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-700 dark:text-cream-100">
                    {p.assessmentReportPdf ? 'Cambiar PDF adjunto' : 'Adjuntar PDF opcional'}
                  </p>
                  <p className="text-xs text-ink-400 mt-1 leading-relaxed dark:text-cream-300">
                    La IA lo toma como contexto adicional. Tus respuestas manuales siguen teniendo prioridad.
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => void handleAssessmentPdfUpload(profile, event)}
              />

              <div className="rounded-2xl border border-dashed border-pine-200 bg-pine-50/70 px-4 py-3 text-xs font-semibold text-pine-700 dark:border-pine-900/60 dark:bg-pine-950/50 dark:text-pine-200">
                {p.assessmentReportPdf ? p.assessmentReportPdf.name : 'Toca aquí para seleccionar un PDF'}
              </div>
            </label>

            {p.assessmentReportPdf && (
              <button
                type="button"
                onClick={() => clearAssessmentPdf(profile)}
                className="w-full rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm font-bold text-coral-600 flex items-center justify-center gap-2 active:scale-[.98] dark:border-coral-800/60 dark:bg-coral-950/40 dark:text-coral-200"
              >
                <Trash className="w-4 h-4" />
                Quitar PDF
              </button>
            )}
          </CardSection>

          <CardSection
            title="Medidas corporales opcionales"
            hint="Llénalas solo si las tienes. Ayudan a dar más contexto."
          >
            <div className="grid grid-cols-3 gap-3">
              <NumField
                label="Cintura"
                unit="cm"
                min={40}
                max={200}
                value={measurements.waistCm}
                onChange={(value) => updateBodyMeasurement(profile, 'waistCm', value)}
              />
              <NumField
                label="Cadera"
                unit="cm"
                min={40}
                max={220}
                value={measurements.hipCm}
                onChange={(value) => updateBodyMeasurement(profile, 'hipCm', value)}
              />
              <NumField
                label="Cuello"
                unit="cm"
                min={20}
                max={80}
                value={measurements.neckCm}
                onChange={(value) => updateBodyMeasurement(profile, 'neckCm', value)}
              />
              <NumField
                label="Pecho"
                unit="cm"
                min={40}
                max={180}
                value={measurements.chestCm}
                onChange={(value) => updateBodyMeasurement(profile, 'chestCm', value)}
              />
              <NumField
                label="Brazo"
                unit="cm"
                min={15}
                max={80}
                value={measurements.armCm}
                onChange={(value) => updateBodyMeasurement(profile, 'armCm', value)}
              />
              <NumField
                label="Muslo"
                unit="cm"
                min={20}
                max={120}
                value={measurements.thighCm}
                onChange={(value) => updateBodyMeasurement(profile, 'thighCm', value)}
              />
            </div>
          </CardSection>
        </div>
      );
    }

    if (type === 'preferencias' && profile) {
      const p = person(profile);

      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Esta sección es opcional.
          </p>

          <CardSection title="Síntomas digestivos" hint="Selecciona los que experimentes frecuentemente.">
            <CheckList 
              options={QUICK_TAGS.digestive} 
              currentValueString={p.digestiveSymptoms || ''} 
              onToggle={(tag) => toggleListTag(profile, 'digestiveSymptoms', tag)} 
            />
          </CardSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CardSection title="Favoritos" hint="Sugerencia: separa cada elemento por coma.">
              <input
                placeholder="Ej. Pollo, atún, arroz"
                className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean-200 focus:border-ocean-300 transition dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100 dark:focus:bg-ink-900 dark:focus:ring-ocean-800 dark:focus:border-ocean-700"
                value={p.favoriteFoods}
                onChange={(e) => setPerson(profile, { favoriteFoods: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.favorites.map((tag) => (
                  <QuickTag key={tag} onClick={() => appendTag(profile, 'favoriteFoods', tag)}>
                    {tag}
                  </QuickTag>
                ))}
              </div>
            </CardSection>

            <CardSection title="Jamás incluir" hint="Sugerencia: separa cada elemento por coma.">
              <input
                placeholder="Ej. Hígado, coliflor, yogurt"
                className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ocean-200 focus:border-ocean-300 transition dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100 dark:focus:bg-ink-900 dark:focus:ring-ocean-800 dark:focus:border-ocean-700"
                value={p.dislikedFoods}
                onChange={(e) => setPerson(profile, { dislikedFoods: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.disliked.map((tag) => (
                  <QuickTag key={tag} onClick={() => appendTag(profile, 'dislikedFoods', tag)}>
                    {tag}
                  </QuickTag>
                ))}
              </div>
            </CardSection>
          </div>
        </div>
      );
    }

    if (type === 'lifestyle' && profile) {
      const p = person(profile);

      return (
        <div className="space-y-4">
          <CardSection title="Actividad y entrenamiento" hint="¿Cómo es tu actividad física a lo largo de la semana?">
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map((al) => {
                const active = p.activityLevel === al.val;
                return (
                  <button
                    key={al.val}
                    type="button"
                    onClick={() => {
                        const freqMap: Record<string, string> = {
                            'Sedentario': 'Sin ejercicio',
                            'Ligero': '1-2 días',
                            'Moderado': '3-4 días',
                            'Intenso': '5+ días'
                        };
                        setPerson(profile, { 
                            activityLevel: al.val,
                            trainingFrequency: freqMap[al.val] || ''
                        });
                    }}
                    className={`flex flex-col items-start gap-0.5 p-3 rounded-2xl border-2 transition-all active:scale-[.97] ${
                      active
                        ? `${tc.border} ${tc.light} shadow-sm border-[2.5px]`
                        : 'border-cream-200 bg-white hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:hover:bg-ink-800'
                    }`}
                  >
                    <span className="text-xl mb-0.5 w-9 h-9 rounded-full bg-white shadow-sm border border-cream-100 flex items-center justify-center dark:bg-ink-800 dark:border-ink-600">
                      {al.emoji}
                    </span>
                    <span className={`text-xs font-bold leading-tight ${active ? tc.text : 'text-ink-600 dark:text-cream-100'}`}>
                      {al.val}
                    </span>
                    <span className={`text-[10px] leading-tight ${active ? `${tc.text} opacity-60` : 'text-ink-400'}`}>
                      {al.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CardSection title="Hora de despertar" hint="Opcional.">
              <button
                type="button"
                onClick={() => openTimePicker(profile, 'wakeTime', p.wakeTime)}
                className="flex w-full items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm font-bold text-ink-600 focus:outline-none focus:ring-2 focus:ring-pine-300 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-200 dark:focus:ring-pine-800 transition shadow-sm hover:bg-cream-50"
              >
                <span>{formatTimeForDisplay(p.wakeTime, '07:00')}</span>
                <Clock className="w-4 h-4 text-ink-400" />
              </button>
            </CardSection>

            <CardSection title="Hora de dormir" hint="Opcional.">
              <button
                type="button"
                onClick={() => openTimePicker(profile, 'sleepTime', p.sleepTime)}
                className="flex w-full items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm font-bold text-ink-600 focus:outline-none focus:ring-2 focus:ring-pine-300 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-200 dark:focus:ring-pine-800 transition shadow-sm hover:bg-cream-50"
              >
                <span>{formatTimeForDisplay(p.sleepTime, '22:00')}</span>
                <Clock className="w-4 h-4 text-ink-400" />
              </button>
            </CardSection>
          </div>
        </div>
      );
    }

    if (type === 'portions') {
      const foodGroups = [
        { key: 'frutas', label: 'Frutas', icon: Apple, color: 'text-coral-300', activeColor: 'text-coral-500 dark:text-coral-300', bg: 'bg-coral-50 dark:bg-coral-950/40' },
        { key: 'verduras', label: 'Verduras', icon: Leaf, color: 'text-pine-300', activeColor: 'text-pine-500 dark:text-pine-300', bg: 'bg-pine-50 dark:bg-pine-950/40' },
        { key: 'cereales', label: 'Cereales', icon: Wheat, color: 'text-apricot-300', activeColor: 'text-apricot-500 dark:text-apricot-300', bg: 'bg-apricot-50 dark:bg-apricot-950/40' },
        { key: 'proteina', label: 'Proteína', icon: Beef, color: 'text-red-300', activeColor: 'text-red-500 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/35' },
        { key: 'grasas', label: 'Grasas', icon: Droplets, color: 'text-lime-300', activeColor: 'text-lime-500 dark:text-lime-300', bg: 'bg-lime-50 dark:bg-lime-950/35' },
        { key: 'lacteos', label: 'Lácteos', icon: Milk, color: 'text-ocean-300', activeColor: 'text-ocean-500 dark:text-ocean-300', bg: 'bg-ocean-50 dark:bg-ocean-800/40' },
        { key: 'leguminosas', label: 'Leguminosas', icon: Bean, color: 'text-apricot-300', activeColor: 'text-apricot-700 dark:text-apricot-300', bg: 'bg-apricot-100 dark:bg-apricot-950/50' },
      ];

      const macroGroups = [
        { key: 'carbs', label: 'Carbohidratos', foodKeys: ['frutas', 'cereales', 'leguminosas'], tone: 'border-apricot-100 bg-apricot-50/60' },
        { key: 'protein', label: 'Proteínas', foodKeys: ['proteina', 'lacteos'], tone: 'border-red-100 bg-red-50/60' },
        { key: 'fat-veggie', label: 'Fibra y grasas', foodKeys: ['verduras', 'grasas'], tone: 'border-pine-100 bg-pine-50/60' },
      ];

      const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
      const mLabels = ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'];

      const totalPortions = foodGroups.reduce(
        (acc, group) =>
          acc + mKeys.reduce((sum, moment) => sum + (manualPortions[group.key]?.[moment] || 0), 0),
        0
      );

      const progressPercent = Math.min(
        100,
        Math.round((totalPortions / (foodGroups.length * mKeys.length * 10)) * 100)
      );

      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Este paso es opcional. Puedes saltar si prefieres que la IA calcule las porciones automáticamente.
          </p>

          <CardSection title="Modo de porciones">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                ['auto', '🤖', 'IA decide', 'Calculado automáticamente'],
                ['manual', '📋', 'Manual', 'Yo defino las cantidades'],
              ] as const).map(([val, emoji, title, sub]) => (
                <button
                  key={val}
                  onClick={() => setPortionMode(val)}
                  className={`relative flex flex-col gap-0.5 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                    portionMode === val
                      ? 'border-[2.5px] border-pine-600 bg-pine-50 shadow-md shadow-pine-100 dark:border-pine-400 dark:bg-pine-950/55 dark:shadow-black/30'
                      : 'border-cream-200 bg-white hover:bg-cream-50 dark:border-ink-600 dark:bg-ink-900 dark:hover:bg-ink-800'
                  }`}
                >
                  <motion.span
                    initial={false}
                    animate={{
                      scale: portionMode === val ? 1 : 0.6,
                      opacity: portionMode === val ? 1 : 0,
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pine-600 text-white flex items-center justify-center shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </motion.span>

                  <span className="text-xl">{emoji}</span>
                  <span className={`text-sm font-bold mt-1 ${portionMode === val ? 'text-pine-700 dark:text-pine-200' : 'text-ink-700 dark:text-cream-100'}`}>
                    {title}
                  </span>
                  <span className={`text-[10px] ${portionMode === val ? 'text-pine-500' : 'text-ink-400'}`}>
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </CardSection>

          {portionMode === 'manual' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-pine-100 bg-gradient-to-r from-pine-50 to-pine-50 px-4 py-3 dark:border-pine-900/60 dark:from-ink-900 dark:to-pine-950/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-pine-800 dark:text-pine-100">Total de porciones</p>
                  <span className="text-sm font-black text-pine-700 tabular-nums dark:text-pine-200">{totalPortions}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/80 overflow-hidden dark:bg-ink-800">
                  <motion.div
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                    className="h-full rounded-full bg-gradient-to-r from-pine-500 to-pine-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-pine-600 dark:text-pine-300">Completado: {progressPercent}%</p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {mKeys.map((momento, idx) => {
                  const active = activePortionMoment === momento;
                  return (
                    <button
                      key={momento}
                      onClick={() => setActivePortionMoment(momento)}
                      className={`px-3 py-2 rounded-xl whitespace-nowrap text-xs font-bold border transition ${
                        active
                          ? 'border-pine-500 bg-pine-50 text-pine-700 dark:border-pine-400 dark:bg-pine-950/55 dark:text-pine-200'
                          : 'border-cream-200 bg-white text-ink-500 dark:border-ink-600 dark:bg-ink-900 dark:text-cream-200'
                      }`}
                    >
                      {mLabels[idx]}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {macroGroups.map((macro) => (
                  <div key={macro.key} className={`rounded-xl border p-2 ${macro.tone}`}>
                    <p className="text-[11px] font-bold text-ink-500 uppercase mb-1 dark:text-cream-300">{macro.label}</p>

                    <div className="space-y-2">
                      {macro.foodKeys.map((foodKey) => {
                        const group = foodGroups.find((item) => item.key === foodKey);
                        if (!group) return null;

                        const value = manualPortions[group.key]?.[activePortionMoment] || 0;
                        const Icon = group.icon;
                        const iconClass = value === 0 ? `${group.color} opacity-50 grayscale` : group.activeColor;

                        return (
                          <div key={group.key} className="rounded-lg border border-white/80 bg-white px-2 py-2 dark:border-ink-600 dark:bg-ink-900">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${iconClass}`} />
                              <span className="text-xs font-semibold text-ink-600 flex-1 dark:text-cream-100">
                                {group.label}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updatePortionValue(group.key, activePortionMoment, (n) => n - 1)}
                                  className="w-9 h-9 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-ink-500 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
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
                                    updatePortionValue(
                                      group.key,
                                      activePortionMoment,
                                      () => (Number.isFinite(parsed) ? parsed : 0)
                                    );
                                  }}
                                  className={`w-14 h-9 rounded-lg border border-cream-200 text-center text-sm font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-pine-300 ${group.bg} dark:border-ink-600 dark:text-cream-100 dark:focus:ring-pine-900`}
                                  aria-label={`Porciones de ${group.label}`}
                                />

                                <button
                                  onClick={() => updatePortionValue(group.key, activePortionMoment, (n) => n + 1)}
                                  className="w-9 h-9 rounded-lg border border-cream-200 bg-white flex items-center justify-center text-ink-500 active:scale-95 dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100"
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
                              onChange={(e) =>
                                updatePortionValue(group.key, activePortionMoment, () =>
                                  Number.parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full mt-2 accent-pine-500"
                              aria-label={`Slider porciones ${group.label}`}
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

    if (type === 'cocina') {
      return (
        <div className="space-y-4">
          <p className="text-xs text-ink-400 bg-apricot-50 border border-apricot-100 rounded-xl px-3 py-2 dark:bg-apricot-950/40 dark:border-apricot-700/60 dark:text-apricot-200">
            💡 Esta sección es opcional.
          </p>

          <CardSection title="Estilos de cocina preferidos">
            <div className="flex flex-wrap gap-2">
              {CUISINE_STYLE_OPTIONS.map((style) => (
                <ChipButton
                  key={style}
                  active={selectedCuisineStyles.includes(style)}
                  onClick={() => toggleCuisineStyle(style)}
                >
                  {style}
                </ChipButton>
              ))}
            </div>
          </CardSection>

          <CardSection title="Tiempo de cocina disponible">
            <div className="flex flex-wrap gap-2">
              {COOKING_TIME_OPTIONS.map((time) => (
                <ChipButton
                  key={time}
                  active={el.cookingTime === time}
                  onClick={() => {
                    setEl((prev: any) => ({ ...prev, cookingTime: time }));
                    setElla((prev: any) => ({ ...prev, cookingTime: time }));
                  }}
                >
                  {time}
                </ChipButton>
              ))}
            </div>
          </CardSection>

          <CardSection title="Notas adicionales">
            <textarea
              rows={3}
              placeholder="Preferencias de preparación, contexto especial, alimentos que no te gustan..."
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm resize-none overflow-hidden focus:bg-white focus:outline-none focus:ring-1 focus:ring-cream-300 transition dark:border-ink-600 dark:bg-ink-800 dark:text-cream-100 dark:focus:bg-ink-900 dark:focus:ring-ink-600"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </CardSection>
        </div>
      );
    }

    if (type === 'confirm') {
      const profiles: ('el' | 'ella')[] = targetProfile === 'ambos' ? ['el', 'ella'] : [targetProfile];

      const portionSummary =
        portionMode === 'manual'
          ? Object.entries(manualPortions)
              .map(([group, moments]) => {
                const total = Object.values(moments || {}).reduce((a, b) => a + (b || 0), 0);
                return total > 0 ? `${group}: ${total}` : null;
              })
              .filter(Boolean)
              .join(', ')
          : null;

      const compactValue = (value: unknown, fallback = 'Sin dato') => {
        const text = typeof value === 'string' ? value.trim() : '';
        return text || fallback;
      };

      const joinCompact = (items: Array<string | null | undefined>) =>
        items.filter((item): item is string => Boolean(item && item.trim())).join(' · ');

      return (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-ink-400 dark:text-ink-400">Revisa los puntos clave antes de generar.</p>

          <div className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-3 dark:border-ink-600 dark:bg-ink-800">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-500 dark:text-cream-300">
              Configuración
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-ink-500 dark:text-cream-200">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wide text-ink-400">Perfil</span>
                <strong>{targetLabel}</strong>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wide text-ink-400">Porciones</span>
                <strong>{portionMode === 'auto' ? 'IA decide' : 'Manual'}</strong>
              </div>
              {portionSummary ? <p className="col-span-2 text-ink-400 dark:text-ink-400">Porciones: {portionSummary}</p> : null}
              {el.favoriteCuisineStyles ? <p className="col-span-2 text-ink-400 dark:text-ink-400">Cocina: {el.favoriteCuisineStyles}</p> : null}
              {el.cookingTime ? <p className="col-span-2 text-ink-400 dark:text-ink-400">Tiempo cocina: {el.cookingTime}</p> : null}
              {additionalNotes ? <p className="col-span-2 text-ink-400 dark:text-ink-400">Notas: {additionalNotes}</p> : null}
            </div>
          </div>

          <div
            data-testid="questionnaire-model-preview"
            className="rounded-2xl border border-pine-100 bg-pine-50/70 px-3 py-2.5 text-xs text-pine-900 dark:border-pine-900/60 dark:bg-pine-950/30 dark:text-pine-100"
          >
            <p className="font-bold">Modelo previsto: {plannedModelLabel}</p>
            <p className="mt-1 opacity-90">
              {fallbackPreviewLabel
                ? `Alternativa automática: ${fallbackPreviewLabel}.`
                : 'No hay otro fallback validado en este momento.'}
            </p>
          </div>

          {profiles.map((p) => {
            const data = person(p);
            const t = THEME[p];
            const profileStats = joinCompact([
              data.age ? `${data.age} años` : null,
              data.currentWeightKg ? `${data.currentWeightKg} kg` : null,
              data.heightCm ? `${data.heightCm} cm` : null,
              data.targetWeightKg ? `meta ${data.targetWeightKg} kg` : null,
            ]);
            const healthSummary = joinCompact([
              data.diagnostics ? `Salud: ${data.diagnostics}` : null,
              data.medications ? `Medicamentos: ${data.medications}` : null,
              data.allergies ? `Alergias: ${data.allergies}` : null,
              data.intolerances ? `Intolerancias: ${data.intolerances}` : null,
              data.digestiveSymptoms ? `Digestivo: ${data.digestiveSymptoms}` : null,
            ]);
            const lifestyleSummary = joinCompact([
              data.activityLevel ? `Actividad: ${data.activityLevel}` : null,
              data.objectiveTimeline ? `Meta: ${data.objectiveTimeline}` : null,
              data.wakeTime ? `Despierta: ${data.wakeTime}` : null,
              data.trainingFrequency ? `Entreno: ${data.trainingFrequency}` : null,
            ]);
            const foodSummary = joinCompact([
              data.favoriteFoods ? `Favoritos: ${data.favoriteFoods}` : null,
              data.dislikedFoods ? `No incluir: ${data.dislikedFoods}` : null,
              data.assessmentReportPdf?.name ? `PDF: ${data.assessmentReportPdf.name}` : null,
            ]);

            return (
              <div key={p} className={`space-y-2 rounded-[14px] border p-3 ${t.border} ${t.light}`}>
                <p className={`text-[11px] font-black uppercase tracking-wider ${t.text}`}>
                  {p === 'el' ? `Perfil ${labelEl}` : `Perfil ${labelElla}`}
                </p>

                <div className="space-y-1.5 text-xs leading-relaxed text-ink-500 dark:text-cream-300">
                  <p><strong>Perfil:</strong> {compactValue(profileStats)}</p>
                  <p><strong>Objetivos:</strong> {data.objectives.join(', ') || 'Ninguno'}</p>
                  {healthSummary ? <p><strong>Salud/restricciones:</strong> {healthSummary}</p> : null}
                  {lifestyleSummary ? <p><strong>Cocina/horarios:</strong> {lifestyleSummary}</p> : null}
                  {foodSummary ? <p><strong>Preferencias:</strong> {foodSummary}</p> : null}
                </div>
              </div>
            );
          })}

          {errorMessage && (
            <div className="space-y-2 rounded-2xl border border-coral-200 bg-coral-50 p-3 text-xs leading-relaxed text-coral-700 dark:border-coral-800/60 dark:bg-coral-950/40 dark:text-coral-200">
              <p className="font-bold">No pudimos generar tu plan</p>
              <p>{errorMessage}</p>
              {aiErrorLog ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAiErrorReason((visible) => !visible)}
                    className="inline-flex items-center rounded-xl border border-coral-300 bg-white px-3 py-2 text-[11px] font-bold text-coral-700 transition hover:bg-coral-100 dark:border-coral-700 dark:bg-ink-900 dark:text-coral-100 dark:hover:bg-coral-950/60"
                  >
                    {showAiErrorReason ? 'Ocultar motivo' : 'Ver motivo'}
                  </button>
                  {showAiErrorReason && getAiErrorReason(aiErrorLog) ? (
                    <p className="rounded-xl border border-coral-200/80 bg-white/70 px-3 py-2 text-[11px] dark:border-coral-800/60 dark:bg-ink-900/70">
                      {getAiErrorReason(aiErrorLog)}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          )}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-cream-200 border-t-pine-500 border-r-pine-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hourglass className="w-7 h-7 sm:w-8 sm:h-8 text-pine-600" />
                </div>
              </div>

              <div className="text-center space-y-1 px-4">
                <p className="text-sm font-bold text-ink-600 dark:text-cream-100">La IA está creando tu plan</p>
                <p className="text-xs text-ink-400 dark:text-ink-400">Esto puede tomar 30 a 60 segundos.</p>
                <p className="text-[11px] text-ink-400 dark:text-ink-400">
                  Modelo previsto: {plannedModelLabel}
                </p>
              </div>

              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-pine-500"
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && lastGeneratedData && onViewPlan && (
            <button
              onClick={() => onViewPlan(targetProfile)}
              data-testid="questionnaire-view-plan"
              className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-ink-700 py-3.5 text-sm font-bold text-white transition-all active:scale-[.98] dark:bg-cream-50 dark:text-ink-900"
            >
              <CheckCircle2 className="w-5 h-5" />
              ¡Listo! Revisa tu plan
            </button>
          )}

          {!loading && !lastGeneratedData && (
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              data-testid="questionnaire-generate"
              className={`w-full flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-sm font-bold transition-all active:scale-[.98] ${
                loading
                  ? 'bg-ink-700 opacity-70 cursor-not-allowed'
                  : 'bg-ink-700 hover:bg-ink-600 dark:bg-cream-50 dark:text-ink-900 dark:hover:bg-cream-100'
              } text-white`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-apricot-300" />}
              {loading ? 'Generando plan...' : 'Generar plan con IA'}
            </motion.button>
          )}

          <p className="mt-3 text-[10px] text-cream-300 text-center leading-relaxed">
            Las recomendaciones de IA no sustituyen valoración profesional.
          </p>
        </div>
      );
    }

    return null;
  };

  const { type } = currentStep;
  const showBack = stepIdx > 0;
  const showNext = type !== 'who' && type !== 'confirm';
  const isLastNav = type === 'cocina';
  const isOptional =
    type === 'salud' ||
    type === 'medicos' ||
    type === 'assessment' ||
    type === 'preferencias' ||
    type === 'portions' ||
    type === 'cocina';

  const { label: stepLabel, Icon: StepIcon } = STEP_META[type];
  const visualProfileSuffix =
    currentStep.profile === 'el' ? ` - ${labelEl}` : currentStep.profile === 'ella' ? ` - ${labelElla}` : '';

  return (
    <>
      <div className="mt-0 overflow-hidden border-y border-cream-200 bg-white shadow-none dark:border-ink-700 dark:bg-ink-900 sm:mt-4 sm:rounded-[22px] sm:border">
        <div className="h-1.5 bg-cream-100 dark:bg-ink-800">
          <motion.div
            className={`h-full bg-gradient-to-r ${tc.grad}`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-cream-100 px-4 py-3 dark:border-ink-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-8 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b ${tc.grad}`} aria-hidden="true" />
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${tc.light} ${tc.text}`}>
              <StepIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-700 leading-tight truncate dark:text-cream-100">
                {stepLabel}
                {visualProfileSuffix}
              </p>
              <p className="text-xs font-medium text-ink-400 dark:text-ink-400">
                Paso {stepIdx + 1} de {steps.length} · {sectionMeta.label}
              </p>
            </div>
          </div>

        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={stepIdx}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              data-testid={`questionnaire-step-${type}${currentStep.profile ? `-${currentStep.profile}` : ''}`}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {(showBack || showNext) && (
          <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-cream-100 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-ink-700 dark:bg-ink-900/95 sm:pb-4">
            {showBack && (
              <button
                onClick={goBack}
                data-testid="questionnaire-back"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-400 hover:bg-cream-50 transition active:scale-95 flex-shrink-0 dark:text-cream-300 dark:hover:bg-ink-800"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            )}

            {showNext && (
              <>
                {isOptional && (
                <button
                  onClick={advance}
                  data-testid="questionnaire-skip"
                  className="flex items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold text-ink-400 underline underline-offset-2 hover:text-ink-500 transition active:scale-95 dark:text-ink-400 dark:hover:text-cream-300"
                >
                    <SkipForward className="w-3.5 h-3.5" />
                    Ahora no
                  </button>
                )}

                <button
                  onClick={advance}
                  disabled={!canContinue()}
                  data-testid="questionnaire-next"
                  className={`ml-auto flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold transition-all active:scale-[.98] ${
                    canContinue()
                      ? 'bg-ink-700 text-white dark:bg-cream-50 dark:text-ink-900'
                      : 'bg-cream-100 text-cream-300 cursor-not-allowed dark:bg-ink-800 dark:text-ink-500'
                  }`}
                >
                  {isLastNav ? 'Confirmar' : 'Siguiente'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {timePickerState.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-ink-800/45 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center"
            onClick={closeTimePicker}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[28px] bg-white border border-cream-200 shadow-2xl p-4 sm:p-5 dark:bg-ink-900 dark:border-ink-700"
            >
              <TimeWheelPicker
                title={timePickerState.field === 'wakeTime' ? 'Hora de despertar' : 'Hora de dormir'}
                value={timePickerState.value}
                onChange={(v) => setTimePickerState((prev) => ({ ...prev, value: v }))}
              />

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={closeTimePicker}
                  className="flex-1 py-3 rounded-2xl bg-cream-100 text-ink-500 font-semibold dark:bg-ink-800 dark:text-cream-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmTimePicker}
                  className="flex-1 py-3 rounded-2xl bg-pine-600 text-white font-bold"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

