import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Circle, PencilLine, Save, X } from 'lucide-react';
import type { AccentColors } from '../utils/theme';
import type { MealEditorDraft, MealOccurrence } from '../utils/mealEditing';

interface MealEditSheetProps {
  open: boolean;
  title: string;
  draft: MealEditorDraft;
  referencePortions: string;
  onDraftChange: (field: keyof MealEditorDraft, value: string) => void;
  onClose: () => void;
  onSave: (selectedOccurrenceIds: string[]) => void;
  affectedMeals: MealOccurrence[];
  suggestions: { key: string; label: string; icon: string; cantidad: number }[];
  isDarkMode?: boolean;
  accentClasses: AccentColors;
  isSaving?: boolean;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{label}</span>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export default function MealEditSheet({
  open,
  title,
  draft,
  referencePortions,
  onDraftChange,
  onClose,
  onSave,
  affectedMeals,
  suggestions,
  isDarkMode = false,
  accentClasses,
  isSaving = false,
}: MealEditSheetProps) {
  const [showAllAffected, setShowAllAffected] = React.useState(false);
  const [showSelectionStep, setShowSelectionStep] = React.useState(false);
  const [selectedOccurrenceIds, setSelectedOccurrenceIds] = React.useState<string[]>([]);
  const visibleAffected = showAllAffected ? affectedMeals : affectedMeals.slice(0, 4);

  React.useEffect(() => {
    if (!open) {
      setShowAllAffected(false);
      setShowSelectionStep(false);
      setSelectedOccurrenceIds([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    setSelectedOccurrenceIds(affectedMeals.map((occurrence) => occurrence.id));
  }, [affectedMeals, open]);

  if (!open) return null;

  const inputClasses = isDarkMode
    ? 'w-full rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none'
    : 'w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none';
  const numericFieldClasses = `${inputClasses} tabular-nums`;
  const canSave = [
    draft.nombre.trim(),
    draft.detalle.trim(),
    draft.superText.trim(),
    draft.caloriasKcal.trim(),
    draft.proteinaG.trim(),
    draft.grasasG.trim(),
  ].every(Boolean);
  const canConfirmSelection = selectedOccurrenceIds.length > 0;

  const handleNumericChange = (field: 'caloriasKcal' | 'proteinaG' | 'grasasG', value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    onDraftChange(field, sanitized);
  };

  const toggleOccurrence = (occurrenceId: string) => {
    setSelectedOccurrenceIds((prev) => (
      prev.includes(occurrenceId)
        ? prev.filter((id) => id !== occurrenceId)
        : [...prev, occurrenceId]
    ));
  };

  const handlePrimaryAction = () => {
    if (!showSelectionStep) {
      setShowSelectionStep(true);
      return;
    }

    if (!canConfirmSelection) return;
    onSave(selectedOccurrenceIds);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm"
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
                ? 'bg-slate-900 border-slate-700 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'bg-white border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${accentClasses.bgLight}`}>
                  <PencilLine className={`w-4 h-4 ${accentClasses.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    Editar platillo
                  </p>
                  <h3 className={`text-lg font-black tracking-tight leading-tight sm:text-xl ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    {title}
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    Ajusta la descripcion y los macros visibles del platillo. El cambio se aplica en todas sus apariciones vinculadas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-200 bg-slate-950 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                  }`}
                  aria-label="Cerrar editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-5">
                <div className="grid gap-4">
                  <Field label="Nombre">
                    <input
                      value={draft.nombre}
                      onChange={(event) => onDraftChange('nombre', event.target.value)}
                      className={inputClasses}
                      placeholder="Ej. Omelette con fruta"
                    />
                  </Field>

                  <Field label="Descripcion" hint="Texto principal del platillo">
                    <textarea
                      value={draft.detalle}
                      onChange={(event) => onDraftChange('detalle', event.target.value)}
                      rows={5}
                      className={`${inputClasses} min-h-[140px] resize-y`}
                      placeholder="Describe como queda el platillo y sus partes principales"
                    />
                  </Field>

                  <Field label="Ingredientes o extras" hint="Separados por coma">
                    <textarea
                      value={draft.superText}
                      onChange={(event) => onDraftChange('superText', event.target.value)}
                      rows={4}
                      className={`${inputClasses} min-h-[120px] resize-y`}
                      placeholder="Ej. huevo, tortilla, espinaca, aguacate"
                    />
                  </Field>

                  <Field label="Etiquetas" hint="Separadas por coma">
                    <input
                      value={draft.tagsText}
                      onChange={(event) => onDraftChange('tagsText', event.target.value)}
                      className={inputClasses}
                      placeholder="Ej. rapido, post-entreno, sin lacteos"
                    />
                  </Field>
                </div>

                <div className={`rounded-[22px] border p-4 ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                }`}>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    Valores del platillo
                  </p>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Edita las calorias, proteina y grasas que se mostraran para este platillo.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="kcal">
                      <input
                        inputMode="numeric"
                        type="text"
                        value={draft.caloriasKcal}
                        onChange={(event) => handleNumericChange('caloriasKcal', event.target.value)}
                        className={numericFieldClasses}
                        placeholder="Ej. 320"
                      />
                    </Field>

                    <Field label="Proteina (g)">
                      <input
                        inputMode="numeric"
                        type="text"
                        value={draft.proteinaG}
                        onChange={(event) => handleNumericChange('proteinaG', event.target.value)}
                        className={numericFieldClasses}
                        placeholder="Ej. 24"
                      />
                    </Field>

                    <Field label="Grasas (g)">
                      <input
                        inputMode="numeric"
                        type="text"
                        value={draft.grasasG}
                        onChange={(event) => handleNumericChange('grasasG', event.target.value)}
                        className={numericFieldClasses}
                        placeholder="Ej. 12"
                      />
                    </Field>
                  </div>
                </div>

                <div className={`rounded-[22px] border p-4 ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                }`}>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    Porciones de referencia
                  </p>
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Usalas como guia para mantener este platillo alineado con la estructura general del plan.
                  </p>
                  <div className={`mt-3 rounded-2xl border px-3.5 py-3 text-sm ${
                    isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                  }`}>
                    {referencePortions}
                  </div>

                  {suggestions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestions.map((item) => (
                        <span
                          key={`${item.key}-${item.cantidad}`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${accentClasses.tagBg} ${accentClasses.tagText}`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label} x{item.cantidad}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {showSelectionStep ? (
                  <div className={`rounded-[22px] border p-4 ${
                    isDarkMode ? `${accentClasses.bgLight} ${accentClasses.border}` : `${accentClasses.bgLight} ${accentClasses.border}`
                  }`}>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Este platillo se encontro en los dias y horarios, revisa cual(les) deseas actualizar.
                    </p>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Selecciona al menos una comida.
                    </p>

                    <div className="mt-3 space-y-2">
                      {visibleAffected.map((meal) => {
                        const isSelected = selectedOccurrenceIds.includes(meal.id);
                        return (
                          <button
                            type="button"
                            key={meal.id}
                            onClick={() => toggleOccurrence(meal.id)}
                            className={`w-full rounded-2xl px-3 py-2.5 text-xs ${
                              isDarkMode ? 'bg-slate-950/70 text-slate-200' : 'bg-white/70 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckCircle className={`h-4 w-4 ${accentClasses.text}`} />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400" />
                              )}
                              <span>{meal.dia} · {meal.momentoLabel} · {meal.profileLabel || 'El'}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {affectedMeals.length > 4 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllAffected((prev) => !prev)}
                        className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold ${accentClasses.text}`}
                      >
                        {showAllAffected ? 'Mostrar menos' : `Ver ${affectedMeals.length - 4} mas`}
                        {showAllAffected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                  onClick={handlePrimaryAction}
                  disabled={isSaving || !canSave || (showSelectionStep && !canConfirmSelection)}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white bg-gradient-to-r ${accentClasses.bgGradient} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving
                    ? 'Guardando...'
                    : showSelectionStep
                      ? `Actualizar ${selectedOccurrenceIds.length} comida${selectedOccurrenceIds.length === 1 ? '' : 's'}`
                      : `Continuar (${affectedMeals.length} comida${affectedMeals.length === 1 ? '' : 's'})`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
