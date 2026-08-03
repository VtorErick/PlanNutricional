import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  MessageSquareText,
  RefreshCcw,
  Sparkles,
  UserRound,
  Wand2,
  X,
} from 'lucide-react';
import type { AccentColors } from '../utils/theme';
import type { PlanRevisionMode } from '../services/aiService';
import { getAiErrorReason, type AiDebugLog } from '../utils/aiDiagnostics';

type TargetProfile = 'el' | 'ella' | 'ambos';

interface PlanAiRefreshSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { requestMode: PlanRevisionMode; targetProfile: TargetProfile; instruction: string }) => Promise<void>;
  isDarkMode?: boolean;
  accentClasses: AccentColors;
  loading?: boolean;
  errorMessage?: string;
  aiErrorLog?: AiDebugLog | null;
  defaultTarget: TargetProfile;
  geminiModel: string;
  geminiRecommendedModel: string;
  geminiFallbackModels: string[];
}

export default function PlanAiRefreshSheet({
  open,
  onClose,
  onSubmit,
  isDarkMode = false,
  accentClasses,
  loading = false,
  errorMessage = '',
  aiErrorLog,
  defaultTarget,
}: PlanAiRefreshSheetProps) {
  const [mode, setMode] = React.useState<PlanRevisionMode>('adjust');
  const [targetProfile, setTargetProfile] = React.useState<TargetProfile>(defaultTarget);
  const [instruction, setInstruction] = React.useState('');
  const [showAiErrorReason, setShowAiErrorReason] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setMode('adjust');
    setTargetProfile(defaultTarget);
    setInstruction('');
  }, [defaultTarget, open]);

  if (!open) return null;

  const inputClasses = isDarkMode
    ? 'w-full rounded-[20px] border border-ink-600 bg-ink-900 px-4 py-3.5 text-sm text-cream-100 placeholder:text-ink-400 focus:border-pine-400 focus:outline-none'
    : 'w-full rounded-[20px] border border-cream-200 bg-cream-50 px-4 py-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-pine-500 focus:bg-white focus:outline-none';

  const submitLabel = mode === 'regenerate'
    ? 'Crear otra versión'
    : 'Aplicar cambios';
  const canSubmit = loading
    ? false
    : mode === 'regenerate'
      ? true
      : instruction.trim().length >= 8;
  const targetOptions: Array<{ id: TargetProfile; title: string; helper: string }> = [
    { id: 'el', title: 'El', helper: 'Solo su plan' },
    { id: 'ella', title: 'Ella', helper: 'Solo su plan' },
    { id: 'ambos', title: 'Ambos', helper: 'Plan compartido' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-ink-950/50 backdrop-blur-[3px]"
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
            className={`flex max-h-[min(88dvh,720px)] w-full flex-col overflow-hidden rounded-t-[30px] border sm:max-w-2xl sm:rounded-[30px] ${
              isDarkMode
                ? 'border-ink-700 bg-ink-900 shadow-lift'
                : 'border-cream-200 bg-white shadow-lift'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
            }`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream-300 dark:bg-ink-600 sm:hidden" />
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${accentClasses.bgLight}`}>
                  <Bot className={`h-5 w-5 ${accentClasses.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    Cambios con IA
                  </p>
                  <h3 className={`font-display text-xl font-semibold tracking-tight leading-tight ${isDarkMode ? 'text-cream-50' : 'text-ink-900'}`}>
                    Cambiar mi plan
                  </h3>
                  <p className={`mt-1 text-xs leading-snug ${isDarkMode ? 'text-ink-300' : 'text-ink-500'}`}>
                    Pide cambios puntuales o recrea el plan con nuevas indicaciones.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  data-testid="plan-ai-close"
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
                    isDarkMode
                      ? 'border-ink-700 bg-ink-900 text-ink-200 hover:bg-ink-800'
                      : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                  }`}
                  aria-label="Cerrar actualizacion con IA"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${accentClasses.text}`} />
                      <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${accentClasses.text}`}>
                        Tipo de cambio
                      </p>
                    </div>
                    <div className={`grid grid-cols-2 gap-1.5 rounded-full border p-1 ${
                      isDarkMode ? 'border-ink-700 bg-ink-900/70' : 'border-cream-200 bg-cream-100'
                    }`}>
                      {([
                        {
                          id: 'adjust' as const,
                          title: 'Cambiar una parte',
                        },
                        {
                          id: 'regenerate' as const,
                          title: 'Crear otra versión',
                        },
                      ]).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`plan-ai-mode-${item.id}`}
                          onClick={() => setMode(item.id)}
                          className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98] ${
                            mode === item.id
                              ? `${accentClasses.btnActive} shadow-sm`
                              : isDarkMode
                                ? 'bg-ink-800 text-ink-300'
                                : 'bg-white text-ink-500'
                          }`}
                        >
                          {item.id === 'adjust' ? <Wand2 className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === 'regenerate' ? (
                    <div className={`rounded-[20px] border px-4 py-3 ${
                      isDarkMode
                        ? 'border-ink-700 bg-ink-900/70 text-ink-300'
                        : 'border-cream-200 bg-cream-100 text-ink-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <RefreshCcw className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                        <p className="text-xs font-medium leading-relaxed">
                          Se recreara el plan usando tu perfil actual. Agrega indicaciones solo si quieres orientar la nueva version.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <UserRound className={`h-3.5 w-3.5 ${accentClasses.text}`} />
                    <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${accentClasses.text}`}>
                      A quien aplica
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {targetOptions.map((item) => {
                      const active = targetProfile === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`plan-ai-target-${item.id}`}
                          onClick={() => setTargetProfile(item.id)}
                          className={`min-w-0 rounded-[18px] border px-2.5 py-2.5 text-left transition active:scale-[0.98] ${
                            active
                              ? `${accentClasses.tagBg} ${accentClasses.borderAccent} ${accentClasses.tagText}`
                              : isDarkMode
                                ? 'border-ink-700 bg-ink-900/70 text-ink-300'
                                : 'border-cream-200 bg-white text-ink-500'
                          }`}
                        >
                          <span className="block truncate text-sm font-bold">{item.title}</span>
                          <span className={`mt-0.5 block truncate text-[10px] font-medium ${
                            active
                              ? accentClasses.tagText
                              : isDarkMode ? 'text-ink-400' : 'text-ink-400'
                          }`}>
                            {item.helper}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-display text-base font-semibold ${isDarkMode ? 'text-cream-100' : 'text-ink-900'}`}>
                        {mode === 'regenerate' ? 'Que quieres para el nuevo plan' : 'Que quieres cambiar'}
                      </p>
                      <p className={`mt-1 text-xs ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                        {mode === 'regenerate'
                          ? 'Opcional: deja indicaciones nuevas para orientar el plan.'
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
                    className={`${inputClasses} min-h-[104px] resize-y`}
                    placeholder={mode === 'regenerate'
                      ? 'Ej. Rehaz el plan con cenas mas ligeras y opciones mas faciles de repetir entre semana.'
                      : 'Ej. Esta vez menos pescado en la noche, no combines atun con lacteos y prioriza cenas mas faciles.'}
                  />
                </div>

                {errorMessage ? (
                  <div className={`space-y-3 rounded-[20px] border px-4 py-3 text-sm ${
                    isDarkMode
                      ? 'border-coral-900/60 bg-coral-950/30 text-coral-100'
                      : 'border-coral-200 bg-coral-50 text-coral-600'
                  }`}>
                    <div>
                      <p className="font-bold">No pudimos actualizar tu plan</p>
                      <p className="mt-1">{errorMessage}</p>
                    </div>
                    {aiErrorLog ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAiErrorReason((visible) => !visible)}
                          className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-[0.98] ${
                            isDarkMode
                              ? 'border-coral-800 bg-ink-900 text-coral-100 hover:bg-coral-950/40'
                              : 'border-coral-300 bg-white text-coral-600 hover:bg-coral-100'
                          }`}
                        >
                          {showAiErrorReason ? 'Ocultar motivo' : 'Ver motivo'}
                        </button>
                        {showAiErrorReason && getAiErrorReason(aiErrorLog) ? (
                          <p className={`rounded-2xl px-3 py-2 text-xs ${isDarkMode ? 'bg-ink-900/70' : 'bg-white/70'}`}>
                            {getAiErrorReason(aiErrorLog)}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`border-t px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4 ${
              isDarkMode ? 'border-ink-700 bg-ink-900' : 'border-cream-200 bg-white'
            }`}>
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="plan-ai-cancel"
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                    isDarkMode
                      ? 'border border-ink-600 bg-ink-900 text-ink-200 hover:bg-ink-800'
                      : 'border border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                  }`}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void onSubmit({
                      requestMode: mode,
                      targetProfile,
                      instruction: instruction.trim(),
                    });
                  }}
                  data-testid="plan-ai-submit"
                  disabled={!canSubmit}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white bg-gradient-to-r ${accentClasses.bgGradient} disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] shadow-sm`}
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? 'Consultando IA...' : submitLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
