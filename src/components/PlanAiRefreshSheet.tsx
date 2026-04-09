import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  FileText,
  Users,
  MessageSquareText,
  RefreshCcw,
  Sparkles,
  UserRound,
  Wand2,
  Download,
  X,
} from 'lucide-react';
import type { AccentColors } from '../utils/theme';
import type { PlanRevisionMode } from '../services/aiService';

type TargetProfile = 'el' | 'ella' | 'ambos';
type RegeneratePath = 'instruction' | 'questionnaire';

type TargetOption = {
  id: TargetProfile;
  label: string;
  description: string;
};

function OptionCard({
  active,
  title,
  description,
  icon: Icon,
  onClick,
  accentClasses,
  isDarkMode,
  dataTestId,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  accentClasses: AccentColors;
  isDarkMode: boolean;
  dataTestId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={dataTestId}
      className={`group relative overflow-hidden rounded-[24px] border px-4 py-4 text-left transition ${
        active
          ? `${accentClasses.border} ${accentClasses.bgLight} shadow-[0_12px_28px_rgba(15,23,42,0.08)]`
          : isDarkMode
            ? 'border-slate-800 bg-slate-950/75 hover:border-slate-700'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${
          active
            ? `${accentClasses.tagBg} ${accentClasses.tagText}`
            : isDarkMode
              ? 'bg-slate-900 text-slate-300'
              : 'bg-slate-100 text-slate-500'
        }`}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {title}
            </p>
            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
              active
                ? `${accentClasses.border} ${accentClasses.tagBg}`
                : isDarkMode
                  ? 'border-slate-700 bg-slate-950'
                  : 'border-slate-300 bg-white'
            }`}>
              {active ? (
                <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`} />
              ) : null}
            </span>
          </div>
          <p className={`mt-1 text-[12px] leading-relaxed ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

interface PlanAiRefreshSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { requestMode: PlanRevisionMode; targetProfile: TargetProfile; instruction: string }) => Promise<void>;
  onOpenQuestionnaire: (targetProfile: TargetProfile) => Promise<void> | void;
  isDarkMode?: boolean;
  accentClasses: AccentColors;
  loading?: boolean;
  errorMessage?: string;
  hasDebugReport?: boolean;
  onDownloadDebugReport?: () => void;
  hasQuestionnaireContext: boolean;
  defaultTarget: TargetProfile;
  targetOptions: TargetOption[];
}

const EXAMPLE_PROMPTS = [
  'Menos pescado en la cena y mas cenas faciles de preparar.',
  'No combines atun con lacteos y evita olores fuertes por la noche.',
  'Mantén el desayuno parecido, pero cambia las colaciones por opciones mas rapidas.',
];

export default function PlanAiRefreshSheet({
  open,
  onClose,
  onSubmit,
  onOpenQuestionnaire,
  isDarkMode = false,
  accentClasses,
  loading = false,
  errorMessage = '',
  hasDebugReport = false,
  onDownloadDebugReport,
  hasQuestionnaireContext,
  defaultTarget,
  targetOptions,
}: PlanAiRefreshSheetProps) {
  const [mode, setMode] = React.useState<PlanRevisionMode>('adjust');
  const [regeneratePath, setRegeneratePath] = React.useState<RegeneratePath>('instruction');
  const [targetProfile, setTargetProfile] = React.useState<TargetProfile>(defaultTarget);
  const [instruction, setInstruction] = React.useState('');
  const [isOpeningQuestionnaire, setIsOpeningQuestionnaire] = React.useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setMode('adjust');
    setRegeneratePath('instruction');
    setTargetProfile(defaultTarget);
    setInstruction('');
    setIsOpeningQuestionnaire(false);
  }, [defaultTarget, open]);

  if (!open) return null;

  const inputClasses = isDarkMode
    ? 'w-full rounded-[24px] border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none'
    : 'w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none';

  const isQuestionnaireRegenerate = mode === 'regenerate' && regeneratePath === 'questionnaire';
  const submitLabel = isQuestionnaireRegenerate
    ? hasQuestionnaireContext
      ? 'Corregir mi perfil'
      : 'Revisar mis datos'
    : mode === 'regenerate'
      ? 'Recrear plan con IA'
      : 'Actualizar plan con IA';
  const helperCopy = isQuestionnaireRegenerate
    ? hasQuestionnaireContext
      ? 'Revisaremos tus respuestas anteriores antes de rehacer el plan.'
      : 'Revisaremos tus datos antes de rehacer el plan.'
    : mode === 'regenerate'
      ? 'Se armara una nueva version completa con tu contexto actual.'
      : 'Se cambiara solo lo que pidas, sin mover lo demas.';
  const canSubmit = loading
    ? false
    : isOpeningQuestionnaire
      ? false
    : mode === 'regenerate'
      ? true
      : instruction.trim().length >= 8;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border sm:h-auto sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[32px] ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${accentClasses.bgLight}`}>
                  <Bot className={`h-4 w-4 ${accentClasses.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    Cambios con IA
                  </p>
                  <h3 className={`text-lg font-black tracking-tight leading-tight sm:text-xl ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    Pide cambios sin repetir tus datos
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    Usa tu plan actual y, si existe, tu informacion previa.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  data-testid="plan-ai-close"
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  aria-label="Cerrar actualizacion con IA"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-5">
                <div className={`rounded-[24px] border p-4 ${
                  isDarkMode ? `${accentClasses.bgLight} ${accentClasses.border}` : `${accentClasses.bgLight} ${accentClasses.border}`
                }`}>
                  <div className="flex items-start gap-3">
                    <Sparkles className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                    <div className="space-y-1">
                      <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        La IA trabajara sobre tu plan actual
                      </p>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {helperCopy}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${accentClasses.text}`} />
                      <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                        Tipo de cambio
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([
                        {
                          id: 'adjust' as const,
                          icon: Wand2,
                          title: 'Ajustar lo actual',
                          description: 'Solo cambia lo que pidas.',
                        },
                        {
                          id: 'regenerate' as const,
                          icon: RefreshCcw,
                          title: 'Recrear desde cero',
                          description: 'Arma una nueva version completa.',
                        },
                      ]).map((item) => (
                        <OptionCard
                          key={item.id}
                          active={mode === item.id}
                          title={item.title}
                          description={item.description}
                          icon={item.icon}
                          onClick={() => setMode(item.id)}
                          accentClasses={accentClasses}
                          isDarkMode={isDarkMode}
                          dataTestId={`plan-ai-mode-${item.id}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Users className={`h-4 w-4 ${accentClasses.text}`} />
                      <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                        A quien actualizar
                      </p>
                    </div>
                    <div className={`rounded-[28px] border p-2 ${
                      isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                    }`}>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {targetOptions.map((option) => (
                          <OptionCard
                            key={option.id}
                            active={targetProfile === option.id}
                            title={option.label}
                            description={option.description}
                            icon={option.id === 'ambos' ? Users : UserRound}
                            onClick={() => setTargetProfile(option.id)}
                            accentClasses={accentClasses}
                            isDarkMode={isDarkMode}
                            dataTestId={`plan-ai-target-${option.id}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {mode === 'regenerate' ? (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <RefreshCcw className={`h-4 w-4 ${accentClasses.text}`} />
                        <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                          Antes de rehacerlo
                        </p>
                      </div>
                      <div className={`rounded-[28px] border p-2 ${
                        isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                      }`}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <OptionCard
                            active={regeneratePath === 'instruction'}
                            title="Dar nuevas indicaciones"
                            description="Escribe como quieres que quede esta nueva version."
                            icon={MessageSquareText}
                            onClick={() => setRegeneratePath('instruction')}
                            accentClasses={accentClasses}
                            isDarkMode={isDarkMode}
                            dataTestId="plan-ai-regenerate-path-instruction"
                          />
                          <OptionCard
                            active={regeneratePath === 'questionnaire'}
                            title="Corregir mi perfil"
                            description={hasQuestionnaireContext
                              ? 'Revisa tus datos anteriores si te equivocaste en algo.'
                              : 'Revisa tus datos antes de rehacer tu plan.'}
                            icon={FileText}
                            onClick={() => setRegeneratePath('questionnaire')}
                            accentClasses={accentClasses}
                            isDarkMode={isDarkMode}
                            dataTestId="plan-ai-regenerate-path-questionnaire"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {isQuestionnaireRegenerate ? null : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {mode === 'regenerate' ? 'Que quieres para el nuevo plan' : 'Que quieres cambiar'}
                        </p>
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {mode === 'regenerate'
                            ? 'Puedes dejar indicaciones nuevas o rehacerlo con tu informacion actual.'
                            : 'Escribe cambios concretos.'}
                        </p>
                      </div>
                      <MessageSquareText className={`h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                    </div>

                    <textarea
                      value={instruction}
                      onChange={(event) => setInstruction(event.target.value)}
                      rows={6}
                      data-testid="plan-ai-instruction"
                      className={`${inputClasses} min-h-[160px] resize-y`}
                      placeholder={mode === 'regenerate'
                        ? 'Ej. Rehaz el plan con cenas mas ligeras y opciones mas faciles de repetir entre semana.'
                        : 'Ej. Esta vez menos pescado en la noche, no combines atun con lacteos y prioriza cenas mas faciles.'}
                    />

                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_PROMPTS.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setInstruction(example)}
                          data-testid={`plan-ai-example-${EXAMPLE_PROMPTS.indexOf(example)}`}
                          className={`rounded-full px-3 py-2 text-[11px] font-bold transition ${
                            isDarkMode
                              ? 'border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`rounded-[24px] border px-4 py-3 ${
                  isQuestionnaireRegenerate
                    ? isDarkMode
                      ? 'border-cyan-800/70 bg-cyan-950/30 text-cyan-100'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-900'
                    : hasQuestionnaireContext
                    ? isDarkMode
                      ? 'border-emerald-800/70 bg-emerald-950/30 text-emerald-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : isDarkMode
                      ? 'border-amber-800/70 bg-amber-950/30 text-amber-100'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-black">
                        {isQuestionnaireRegenerate
                          ? hasQuestionnaireContext
                            ? 'Vamos a revisar tu perfil guardado'
                            : 'Vamos a revisar tus datos'
                          : hasQuestionnaireContext
                            ? 'Usaremos tu informacion previa'
                            : 'Usaremos tu plan actual'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        {isQuestionnaireRegenerate
                          ? hasQuestionnaireContext
                            ? 'Asi podras corregir lo que no quedo bien antes de pedir un nuevo plan.'
                            : 'Asi podras corregir lo necesario antes de pedir un nuevo plan.'
                          : hasQuestionnaireContext
                            ? 'Tambien tomaremos en cuenta lo ultimo que hayas compartido sobre tus objetivos y preferencias.'
                            : 'Tomaremos en cuenta tu plan actual y los cambios que ya hiciste manualmente.'}
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="space-y-2">
                    {hasDebugReport && onDownloadDebugReport ? (
                      <button
                        type="button"
                        onClick={onDownloadDebugReport}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-left text-xs font-bold transition ${
                          isDarkMode
                            ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Download className="h-3.5 w-3.5" />
                          Descargar logs de depuración (request/response)
                        </span>
                      </button>
                    ) : null}
                    <div className={`rounded-[24px] border px-4 py-3 text-sm ${
                      isDarkMode
                        ? 'border-rose-900/70 bg-rose-950/30 text-rose-100'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}>
                      {errorMessage}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`border-t px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="plan-ai-cancel"
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isDarkMode
                      ? 'border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isQuestionnaireRegenerate) {
                      void (async () => {
                        setIsOpeningQuestionnaire(true);
                        try {
                          await onOpenQuestionnaire(targetProfile);
                        } finally {
                          if (isMountedRef.current) {
                            setIsOpeningQuestionnaire(false);
                          }
                        }
                      })();
                      return;
                    }

                    void onSubmit({
                      requestMode: mode,
                      targetProfile,
                      instruction: instruction.trim(),
                    });
                  }}
                  data-testid="plan-ai-submit"
                  disabled={!canSubmit}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white bg-gradient-to-r ${accentClasses.bgGradient} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Consultando IA...' : isOpeningQuestionnaire ? 'Abriendo tus datos...' : submitLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
