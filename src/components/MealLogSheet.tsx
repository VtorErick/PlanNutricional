import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Flame,
  ImagePlus,
  Loader2,
  Pencil,
  RefreshCcw,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDiet } from '../context/DietContext';
import { analyzeFood, FoodAnalysisError, type FoodAnalysis } from '../services/foodAnalysisService';
import { fileToCompressedJpegBase64 } from '../utils/imageCompression';
import { getMealEmoji } from '../utils/mealEmoji';
import type { AccentColors } from '../utils/theme';
import type { MealItem } from '../types';

interface MealLogSheetProps {
  open: boolean;
  onClose: () => void;
  profileId: 'el' | 'ella';
  dia: string;
  momentoKey: string;
  momentoLabel: string;
  accentClasses: AccentColors;
  isDarkMode: boolean;
}

type PhotoState = { base64: string; mimeType: string; previewUrl: string } | null;
type AnalysisMeta = { source: 'image' | 'text'; modelUsed?: string; providerUsed?: string } | null;

export default function MealLogSheet({
  open,
  onClose,
  profileId,
  dia,
  momentoKey,
  momentoLabel,
  accentClasses,
  isDarkMode,
}: MealLogSheetProps) {
  const { logAnalyzedMeal, notify } = useDiet();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = React.useState<PhotoState>(null);
  const [description, setDescription] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<FoodAnalysis | null>(null);
  const [analysisMeta, setAnalysisMeta] = React.useState<AnalysisMeta>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<{ code: string; message: string } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setDescription('');
    setAnalyzing(false);
    setAnalysis(null);
    setAnalysisMeta(null);
    setIsEditing(false);
    setError(null);
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !analyzing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [analyzing, onClose, open]);

  if (!open) return null;

  const canAnalyze = !analyzing && (Boolean(photo) || description.trim().length >= 4);

  const handlePickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setError(null);
      const compressed = await fileToCompressedJpegBase64(file);
      setPhoto(compressed);
      setAnalysis(null);
    } catch (err: any) {
      setError({ code: 'IMAGE', message: err?.message || 'No fue posible procesar la foto.' });
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeFood({
        imageBase64: photo?.base64,
        imageMimeType: photo?.mimeType,
        description: description.trim() || undefined,
      });
      setAnalysis(result.analysis);
      setAnalysisMeta({
        source: result.source,
        modelUsed: result.modelUsed,
        providerUsed: result.providerUsed,
      });
      setIsEditing(false);
    } catch (err: any) {
      if (err instanceof FoodAnalysisError) {
        setError({ code: err.code, message: err.message });
        // Si la vision no esta disponible, guiamos al flujo de texto
        if (err.code === 'VISION_UNAVAILABLE') {
          setPhoto(null);
        }
      } else {
        setError({ code: 'UNKNOWN', message: 'No se pudo analizar la comida. Intenta de nuevo.' });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseMeal = () => {
    if (!analysis || !analysis.nombre.trim() || analysis.caloriasKcal <= 0) return;

    const meal: MealItem = {
      nombre: analysis.nombre,
      detalle: analysis.detalle,
      porciones: analysis.porciones,
      caloriasKcal: analysis.caloriasKcal,
      proteinaG: analysis.proteinaG,
      grasasG: analysis.grasasG,
      super: analysis.super,
      tags: analysis.tags,
      aiMeta: {
        analyzedSource: analysisMeta?.source,
        analyzedModel: analysisMeta?.modelUsed,
        confidence: analysis.confianza,
        loggedAt: new Date().toISOString(),
      },
    };

    logAnalyzedMeal(profileId, dia, momentoKey, meal);
    onClose();
    void notify(
      'Comida registrada',
      `${analysis.nombre} quedó en tu ${momentoLabel.toLowerCase()} de ${dia}. Tu plan, Kcal y compras ya están actualizados.`
    );
  };

  const updateAnalysisText = (field: 'nombre' | 'porciones', value: string) => {
    setAnalysis((current) => current ? { ...current, [field]: value.slice(0, field === 'nombre' ? 90 : 120) } : current);
  };

  const updateAnalysisNumber = (field: 'caloriasKcal' | 'proteinaG' | 'grasasG', value: string) => {
    const parsed = Number.parseInt(value, 10);
    setAnalysis((current) => current
      ? { ...current, [field]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }
      : current);
  };

  const confidenceLabel = analysis?.confianza === 'alta'
    ? 'Buena estimación'
    : analysis?.confianza === 'baja'
      ? 'Revisa la porción'
      : 'Estimación aproximada';

  const surfaceClass = isDarkMode
    ? 'border-ink-700 bg-ink-900 text-cream-100'
    : 'border-cream-200 bg-white text-ink-900';
  const mutedText = isDarkMode ? 'text-ink-400' : 'text-ink-400';

  return createPortal(
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
            className={`flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-3xl border sm:max-w-lg sm:rounded-3xl ${surfaceClass} shadow-lift`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-log-title"
          >
            {/* Header */}
            <div className={`border-b px-4 py-4 sm:px-5 ${isDarkMode ? 'border-ink-700' : 'border-cream-200'}`}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream-300 dark:bg-ink-600 sm:hidden" />
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${accentClasses.bgLight}`}>
                  <Camera className={`h-5 w-5 ${accentClasses.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    {momentoLabel} · {dia}
                  </p>
                  <h3 id="meal-log-title" className="font-display text-xl font-semibold tracking-tight leading-tight">
                    Registra lo que comiste
                  </h3>
                  <p className={`mt-1 text-xs font-medium leading-snug ${mutedText}`}>
                    Una foto o una frase es suficiente. Podrás revisar el resultado antes de guardarlo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="meal-log-close"
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
                    isDarkMode
                      ? 'border-ink-700 bg-ink-900 text-ink-200 hover:bg-ink-800'
                      : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                  }`}
                  aria-label="Cerrar registro de comida"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
              {!analysis ? (
                <div className="space-y-4">
                  {/* Photo input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    data-testid="meal-log-photo-input"
                    className="hidden"
                    onChange={(event) => void handlePickPhoto(event)}
                  />

                  {photo ? (
                    <div className="relative overflow-hidden rounded-2xl border border-cream-200 dark:border-ink-700">
                      <img src={photo.previewUrl} alt="Foto de tu comida" className="h-44 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/60 text-white backdrop-blur-sm transition active:scale-90"
                        aria-label="Quitar foto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="meal-log-photo-button"
                      className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 transition active:scale-[0.99] ${
                        isDarkMode
                          ? 'border-ink-600 bg-ink-800/40 hover:border-ink-500'
                          : `${accentClasses.border} bg-cream-50 hover:bg-cream-100`
                      }`}
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${accentClasses.tagBg} ${accentClasses.tagText}`}>
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <span className={`text-sm font-bold ${accentClasses.text}`}>
                        Tomar una foto
                      </span>
                      <span className={`text-xs ${mutedText}`}>
                        También puedes elegirla de tu galería
                      </span>
                    </button>
                  )}

                  {/* Description input */}
                  <div>
                    <p className={`mb-1.5 text-xs font-extrabold uppercase tracking-[0.14em] ${mutedText}`}>
                      {photo ? 'Añade un detalle (opcional)' : 'O escribe qué comiste'}
                    </p>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={2}
                      data-testid="meal-log-description"
                      placeholder="Ej. 2 tacos de pollo asado con salsa verde, cebolla y aguacate"
                      className={`w-full resize-none rounded-2xl border px-3.5 py-3 text-sm leading-relaxed focus:outline-none ${
                        isDarkMode
                          ? 'border-ink-600 bg-ink-800/60 text-cream-100 placeholder:text-ink-400 focus:border-ink-500'
                          : 'border-cream-200 bg-cream-50 text-ink-800 placeholder:text-ink-400 focus:border-pine-400 focus:bg-white'
                      }`}
                    />
                  </div>

                  {error ? (
                    <div
                      className={`rounded-2xl border px-3.5 py-3 text-xs font-medium leading-relaxed ${
                        error.code === 'VISION_UNAVAILABLE'
                          ? isDarkMode
                            ? 'border-apricot-800/60 bg-apricot-950/30 text-apricot-200'
                            : 'border-apricot-200 bg-apricot-50 text-apricot-700'
                          : isDarkMode
                            ? 'border-coral-900/60 bg-coral-950/30 text-coral-200'
                            : 'border-coral-200 bg-coral-50 text-coral-600'
                      }`}
                      role="alert"
                    >
                      {error.message}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void handleAnalyze()}
                    disabled={!canAnalyze}
                    data-testid="meal-log-analyze"
                    className={`inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r ${accentClasses.bgGradient} px-5 py-3 text-[15px] font-bold text-white shadow-sm transition enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analizando tu comida...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analizar automáticamente
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* ── Result ── */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className={`overflow-hidden rounded-2xl border ${isDarkMode ? 'border-ink-700 bg-ink-800/50' : 'border-cream-200 bg-cream-50'}`}>
                    {photo ? (
                      <div className="h-28 w-full overflow-hidden">
                        <img src={photo.previewUrl} alt="Comida analizada" className="h-full w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
                          {getMealEmoji(analysis.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug">{analysis.nombre}</h4>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold ${
                              analysis.necesitaRevision
                                ? isDarkMode ? 'bg-apricot-950/50 text-apricot-200' : 'bg-apricot-100 text-apricot-700'
                                : isDarkMode ? 'bg-pine-950/50 text-pine-200' : 'bg-pine-100 text-pine-700'
                            }`}>
                              {analysis.necesitaRevision ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              {confidenceLabel}
                            </span>
                          </div>
                          <p className={`mt-0.5 text-xs leading-relaxed ${mutedText}`}>{analysis.detalle}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className={`rounded-2xl px-2 py-2.5 ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
                          <p className={`flex items-center justify-center gap-1 font-display text-lg font-semibold ${isDarkMode ? 'text-pine-300' : 'text-pine-600'}`}>
                            <Flame className="h-3.5 w-3.5" />
                            {analysis.caloriasKcal}
                          </p>
                          <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>kcal</p>
                        </div>
                        <div className={`rounded-2xl px-2 py-2.5 ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
                          <p className="font-display text-lg font-semibold">{analysis.proteinaG}g</p>
                          <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>proteína</p>
                        </div>
                        <div className={`rounded-2xl px-2 py-2.5 ${isDarkMode ? 'bg-ink-900' : 'bg-white shadow-soft'}`}>
                          <p className="font-display text-lg font-semibold">{analysis.grasasG}g</p>
                          <p className={`text-xs font-bold uppercase tracking-wide ${mutedText}`}>grasas</p>
                        </div>
                      </div>

                      <p className={`mt-3 flex items-start gap-1.5 text-xs font-medium ${mutedText}`}>
                        <UtensilsCrossed className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {analysis.porciones}
                      </p>
                      {analysis.supuestos?.[0] ? (
                        <p className={`mt-2 text-xs leading-relaxed ${mutedText}`}>
                          Supuesto: {analysis.supuestos[0]}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing((current) => !current)}
                    data-testid="meal-log-edit-toggle"
                    className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-sm font-bold transition ${
                      isDarkMode
                        ? 'border-ink-700 bg-ink-900 text-ink-200 hover:bg-ink-800'
                        : 'border-cream-200 bg-white text-ink-600 hover:bg-cream-50'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> Corregir datos</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                  </button>

                  {isEditing ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`space-y-3 overflow-hidden rounded-2xl border p-3.5 ${isDarkMode ? 'border-ink-700 bg-ink-800/40' : 'border-cream-200 bg-white'}`}
                    >
                      <label className="block text-xs font-bold">
                        Nombre
                        <input
                          value={analysis.nombre}
                          onChange={(event) => updateAnalysisText('nombre', event.target.value)}
                          data-testid="meal-log-edit-name"
                          className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none ${isDarkMode ? 'border-ink-600 bg-ink-900' : 'border-cream-200 bg-cream-50'}`}
                        />
                      </label>
                      <label className="block text-xs font-bold">
                        Porción
                        <input
                          value={analysis.porciones}
                          onChange={(event) => updateAnalysisText('porciones', event.target.value)}
                          data-testid="meal-log-edit-portions"
                          className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-medium outline-none ${isDarkMode ? 'border-ink-600 bg-ink-900' : 'border-cream-200 bg-cream-50'}`}
                        />
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ['caloriasKcal', 'Kcal'],
                          ['proteinaG', 'Proteína'],
                          ['grasasG', 'Grasas'],
                        ] as const).map(([field, label]) => (
                          <label key={field} className="text-xs font-bold">
                            {label}
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={analysis[field]}
                              onChange={(event) => updateAnalysisNumber(field, event.target.value)}
                              data-testid={`meal-log-edit-${field}`}
                              className={`mt-1.5 w-full rounded-xl border px-2 py-2.5 text-center text-sm font-bold outline-none ${isDarkMode ? 'border-ink-600 bg-ink-900' : 'border-cream-200 bg-cream-50'}`}
                            />
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAnalysis(null);
                        setAnalysisMeta(null);
                        setIsEditing(false);
                      }}
                      className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition active:scale-[0.98] ${
                        isDarkMode
                          ? 'border-ink-600 bg-ink-900 text-ink-200 hover:bg-ink-800'
                          : 'border-cream-200 bg-white text-ink-500 hover:bg-cream-100'
                      }`}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Repetir
                    </button>
                    <button
                      type="button"
                      onClick={handleUseMeal}
                      disabled={!analysis.nombre.trim() || analysis.caloriasKcal <= 0}
                      data-testid="meal-log-use"
                      className={`inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r ${accentClasses.bgGradient} px-5 text-[15px] font-bold text-white shadow-sm transition enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:opacity-40`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      Guardar en mi plan
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
