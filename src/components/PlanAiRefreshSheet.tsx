import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  MessageSquareText,
  RefreshCcw,
  Sparkles,
  UtensilsCrossed,
  Wand2,
  X,
} from 'lucide-react';
import type { AccentColors } from '../utils/theme';
import type { PlanRevisionMode } from '../services/aiService';
import { downloadAiDebugLog, type AiDebugLog } from '../utils/aiDiagnostics';

type TargetProfile = 'el' | 'ella' | 'ambos';
type RegeneratePath = 'instruction' | 'questionnaire';

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
      className={`group relative overflow-hidden rounded-[20px] border px-3 py-3 text-left transition ${
        active
          ? `${accentClasses.border} ${accentClasses.bgLight} shadow-[0_12px_28px_rgba(15,23,42,0.08)]`
          : isDarkMode
            ? 'border-slate-800 bg-slate-950/75 hover:border-slate-700'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${
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
          <p className={`mt-1 hidden text-[12px] leading-relaxed sm:block ${
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
  aiErrorLog?: AiDebugLog | null;
  hasQuestionnaireContext: boolean;
  defaultTarget: TargetProfile;
  geminiModel: string;
  geminiRecommendedModel: string;
  geminiFallbackModels: string[];
}

export default function PlanAiRefreshSheet({
  open,
  onClose,
  onSubmit,
  onOpenQuestionnaire,
  isDarkMode = false,
  accentClasses,
  loading = false,
  errorMessage = '',
  aiErrorLog,
  hasQuestionnaireContext,
  defaultTarget,
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
        className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm"
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
                    Ajustar plan
                  </h3>
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
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${accentClasses.text}`} />
                      <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                        Tipo de cambio
                      </p>
                    </div>
                    <div className={`grid grid-cols-2 gap-1.5 rounded-[24px] border p-1.5 ${
                      isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                    }`}>
                      {([
                        {
                          id: 'adjust' as const,
                          title: 'Ajustar',
                        },
                        {
                          id: 'regenerate' as const,
                          title: 'Recrear',
                        },
                      ]).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`plan-ai-mode-${item.id}`}
                          onClick={() => setMode(item.id)}
                          className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black transition active:scale-[0.98] ${
                            mode === item.id
                              ? `${accentClasses.btnActive} shadow-sm`
                              : isDarkMode
                                ? 'bg-slate-900 text-slate-300'
                                : 'bg-white text-slate-600'
                          }`}
                        >
                          {item.id === 'adjust' ? <Wand2 className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                          {item.title}
                        </button>
                      ))}
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
                      <div className={`rounded-[24px] border p-1.5 ${
                        isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                      }`}>
                        <div className="grid grid-cols-2 gap-1.5">
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
                      rows={4}
                      data-testid="plan-ai-instruction"
                      className={`${inputClasses} min-h-[116px] resize-y`}
                      placeholder={mode === 'regenerate'
                        ? 'Ej. Rehaz el plan con cenas mas ligeras y opciones mas faciles de repetir entre semana.'
                        : 'Ej. Esta vez menos pescado en la noche, no combines atun con lacteos y prioriza cenas mas faciles.'}
                    />
                  </div>
                )}

                {isQuestionnaireRegenerate ? (
                <div className={`rounded-[22px] border px-4 py-3 ${
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
                        {hasQuestionnaireContext ? 'Vamos a revisar tu perfil guardado' : 'Vamos a revisar tus datos'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        {hasQuestionnaireContext
                          ? 'Asi podras corregir lo que no quedo bien antes de pedir un nuevo plan.'
                          : 'Asi podras corregir lo necesario antes de pedir un nuevo plan.'}
                      </p>
                    </div>
                  </div>
                </div>
                ) : null}
                {errorMessage ? (
                  <div className={`space-y-3 rounded-[24px] border px-4 py-3 text-sm ${
                    isDarkMode
                      ? 'border-rose-900/70 bg-rose-950/30 text-rose-100'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}>
                    <p>{errorMessage}</p>
                    {aiErrorLog ? (
                      <button
                        type="button"
                        onClick={() => downloadAiDebugLog(aiErrorLog)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                          isDarkMode
                            ? 'border-rose-800 bg-slate-950 text-rose-100 hover:bg-rose-950/40'
                            : 'border-rose-300 bg-white text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        Descargar logs detallados
                      </button>
                    ) : null}
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
