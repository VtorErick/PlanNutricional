import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Circle, ListChecks, PencilLine, Save, SlidersHorizontal, X } from 'lucide-react';
import type { AccentColors } from '../utils/theme';
import type { CatalogMealRecommendation, MealEditorDraft, MealOccurrence } from '../utils/mealEditing';

interface MealEditSheetProps {
  open: boolean;
  title: string;
  draft: MealEditorDraft;
  referencePortions: string;
  onDraftChange: (field: keyof MealEditorDraft, value: string) => void;
  onClose: () => void;
  onSave: (selectedOccurrenceIds: string[]) => void;
  affectedMeals: MealOccurrence[];
  currentOccurrenceId?: string;
  suggestions: { key: string; label: string; icon: string; cantidad: number }[];
  recommendations?: CatalogMealRecommendation[];
  onSelectRecommendation?: (recommendation: CatalogMealRecommendation) => void;
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
  currentOccurrenceId,
  suggestions,
  recommendations = [],
  onSelectRecommendation,
  isDarkMode = false,
  accentClasses,
  isSaving = false,
}: MealEditSheetProps) {
  const [showAllAffected, setShowAllAffected] = React.useState(false);
  const [showLinkedSelector, setShowLinkedSelector] = React.useState(false);
  const [selectedOccurrenceIds, setSelectedOccurrenceIds] = React.useState<string[]>([]);
  const [editMode, setEditMode] = React.useState<'recommended' | 'manual'>(
    recommendations.length > 0 ? 'recommended' : 'manual'
  );

  const currentOccurrence = currentOccurrenceId
    ? affectedMeals.find((occurrence) => occurrence.id === currentOccurrenceId) || null
    : null;
  const otherOccurrences = currentOccurrence
    ? affectedMeals.filter((occurrence) => occurrence.id !== currentOccurrence.id)
    : affectedMeals;
  const visibleOtherOccurrences = showAllAffected ? otherOccurrences : otherOccurrences.slice(0, 4);
  const linkedCount = otherOccurrences.length;
  const multiModeActive = showLinkedSelector;

  React.useEffect(() => {
    if (!open) {
      setShowAllAffected(false);
      setShowLinkedSelector(false);
      setSelectedOccurrenceIds([]);
      setEditMode(recommendations.length > 0 ? 'recommended' : 'manual');
    }
  }, [open, recommendations.length]);

  React.useEffect(() => {
    if (!open) return;
    setEditMode(recommendations.length > 0 ? 'recommended' : 'manual');
    if (currentOccurrenceId) {
      setSelectedOccurrenceIds([currentOccurrenceId]);
      return;
    }
    setSelectedOccurrenceIds(affectedMeals.map((occurrence) => occurrence.id));
  }, [affectedMeals, currentOccurrenceId, open, recommendations.length]);

  if (!open) return null;

  const inputClasses = isDarkMode
    ? 'w-full rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none'
    : 'w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none';
  const numericFieldClasses = `${inputClasses} tabular-nums`;
  const canSave = [
    draft.nombre.trim(),
    draft.detalle.trim(),
    draft.superText.trim(),
    draft.porciones.trim(),
    draft.caloriasKcal.trim(),
    draft.proteinaG.trim(),
    draft.grasasG.trim(),
  ].every(Boolean);
  const canConfirmSelection = selectedOccurrenceIds.length > 0;
  const selectedSummary = selectedOccurrenceIds.length === 1
    ? 'Los cambios se aplicaran solo en esta comida'
    : `Los cambios se aplicaran en ${selectedOccurrenceIds.length} comidas`;
  const linkedSummary = linkedCount === 0
    ? 'Esta comida no aparece en otros horarios'
    : `Tambien aparece en ${linkedCount} ${linkedCount === 1 ? 'comida' : 'comidas'} mas`;
  const actionLabel = selectedOccurrenceIds.length === 1
    ? 'Actualizar esta comida'
    : `Actualizar ${selectedOccurrenceIds.length} comidas`;

  const handleNumericChange = (field: 'caloriasKcal' | 'proteinaG' | 'grasasG', value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    onDraftChange(field, sanitized);
  };

  const toggleOccurrence = (occurrenceId: string) => {
    if (occurrenceId === currentOccurrenceId) return;
    setSelectedOccurrenceIds((prev) => (
      prev.includes(occurrenceId)
        ? prev.filter((id) => id !== occurrenceId)
        : [...prev, occurrenceId]
    ));
  };

  const handlePrimaryAction = () => {
    if (!canConfirmSelection) return;
    onSave(selectedOccurrenceIds);
  };

  const selectAllOccurrences = () => {
    setSelectedOccurrenceIds(affectedMeals.map((occurrence) => occurrence.id));
  };

  const selectOnlyCurrentOccurrence = () => {
    if (!currentOccurrenceId) return;
    setSelectedOccurrenceIds([currentOccurrenceId]);
  };

  const handleSelectRecommendation = (recommendation: CatalogMealRecommendation) => {
    onSelectRecommendation?.(recommendation);
    setEditMode('recommended');
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
                    Edita esta comida. Si quieres, tambien puedes aplicar el cambio en otros horarios donde aparece.
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
                <div className={`rounded-[22px] border p-4 ${
                  isDarkMode ? `${accentClasses.bgLight} ${accentClasses.border}` : `${accentClasses.bgLight} ${accentClasses.border}`
                }`}>
                  <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${accentClasses.text}`}>
                    Alcance de la edicion
                  </p>
                  <p className={`mt-1 text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {selectedSummary}
                  </p>
                  <p className={`mt-1 text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {linkedSummary}.
                  </p>

                  {currentOccurrence ? (
                    <div className={`mt-3 rounded-[22px] border px-3.5 py-3 text-xs ${
                      isDarkMode ? `${accentClasses.border} bg-slate-950 text-slate-100` : `${accentClasses.border} bg-white text-slate-800`
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${accentClasses.tagBg} ${accentClasses.tagText}`}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Actual
                        </span>
                        <span className={`text-[11px] font-semibold ${accentClasses.text}`}>
                          Siempre incluida
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-bold">
                        {currentOccurrence.dia} · {currentOccurrence.momentoLabel}
                      </div>
                      <div className={`mt-1 text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        {currentOccurrence.profileLabel || 'El'}
                      </div>
                    </div>
                  ) : null}

                  {linkedCount > 0 ? (
                    <div className="mt-3 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkedSelector(false);
                            selectOnlyCurrentOccurrence();
                          }}
                          data-testid="meal-edit-scope-single"
                          className={`rounded-[22px] border px-3.5 py-3 text-left transition ${
                            !multiModeActive
                              ? `${accentClasses.border} ${accentClasses.bgLight}`
                              : isDarkMode
                                ? 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-start gap-3">
                            {!multiModeActive ? (
                              <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                Solo esta comida
                              </span>
                              <span className={`mt-1 block text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Cambia solo el horario actual.
                              </span>
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkedSelector(true);
                            selectAllOccurrences();
                          }}
                          data-testid="meal-edit-scope-multiple"
                          className={`rounded-[22px] border px-3.5 py-3 text-left transition ${
                            multiModeActive
                              ? `${accentClasses.border} ${accentClasses.bgLight}`
                              : isDarkMode
                                ? 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-start gap-3">
                            {multiModeActive ? (
                              <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                Varias comidas
                              </span>
                              <span className={`mt-1 block text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Aplica el cambio aqui y en otras {linkedCount} comida{linkedCount === 1 ? '' : 's'}.
                              </span>
                            </span>
                          </span>
                        </button>
                      </div>

                      {showLinkedSelector ? (
                        <div className={`rounded-[22px] border p-3 ${
                          isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-white/80'
                        }`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${accentClasses.text}`}>
                              Tambien actualizar
                            </p>
                            <button
                              type="button"
                              onClick={selectAllOccurrences}
                              data-testid="meal-edit-select-all"
                              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                                selectedOccurrenceIds.length === affectedMeals.length
                                  ? `${accentClasses.tagBg} ${accentClasses.tagText}`
                                  : isDarkMode
                                    ? 'border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              Seleccionar todas
                            </button>
                          </div>

                          {currentOccurrence ? (
                            <div className={`mb-2 rounded-2xl border px-3 py-3 ${
                              isDarkMode ? `${accentClasses.border} bg-slate-950 text-slate-100` : `${accentClasses.border} bg-white text-slate-800`
                            }`}>
                              <span className="flex items-start gap-3">
                                <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold leading-tight">
                                    {currentOccurrence.dia} · {currentOccurrence.momentoLabel}
                                  </span>
                                  <span className={`mt-1 block text-[11px] ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                                    Actual · {currentOccurrence.profileLabel || 'El'}
                                  </span>
                                </span>
                              </span>
                            </div>
                          ) : null}

                          <div className="space-y-2">
                            {visibleOtherOccurrences.map((meal) => {
                              const isSelected = selectedOccurrenceIds.includes(meal.id);

                              return (
                                <button
                                  type="button"
                                  key={meal.id}
                                  onClick={() => toggleOccurrence(meal.id)}
                                  aria-pressed={isSelected}
                                  data-testid={`meal-edit-occurrence-${meal.id}`}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                                    isSelected
                                      ? isDarkMode
                                        ? `${accentClasses.border} bg-slate-950 text-slate-100`
                                        : `${accentClasses.border} bg-white text-slate-800`
                                      : isDarkMode
                                        ? 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700'
                                        : 'border-white/70 bg-white/70 text-slate-700 hover:border-slate-200'
                                  }`}
                                >
                                  <span className="flex items-start gap-3">
                                    {isSelected ? (
                                      <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                                    ) : (
                                      <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                    )}

                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-bold leading-tight">
                                        {meal.dia} · {meal.momentoLabel}
                                      </span>
                                      <span className={`mt-1 block text-[11px] ${
                                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                      }`}>
                                        {meal.profileLabel || 'El'}
                                      </span>
                                    </span>
                                  </span>
                                </button>
                              );
                            })}

                            {otherOccurrences.length > 4 ? (
                              <button
                                type="button"
                                onClick={() => setShowAllAffected((prev) => !prev)}
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${accentClasses.text}`}
                              >
                                {showAllAffected ? 'Mostrar menos' : `Ver ${otherOccurrences.length - 4} mas`}
                                {showAllAffected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {recommendations.length > 0 ? (
                  <div className={`rounded-[22px] border p-4 ${
                    isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          Platillos recomendados
                        </p>
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Opciones de la base de la app ajustadas al perfil y horario.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditMode(editMode === 'manual' ? 'recommended' : 'manual')}
                        data-testid="meal-edit-manual-mode"
                        className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-black transition ${
                          editMode === 'manual'
                            ? `${accentClasses.tagBg} ${accentClasses.tagText} ${accentClasses.border}`
                            : isDarkMode
                              ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {editMode === 'manual' ? <ListChecks className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                        {editMode === 'manual' ? 'Ver recomendadas' : 'Editar manual'}
                      </button>
                    </div>

                    {editMode === 'recommended' ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {recommendations.map((recommendation) => {
                          const isSelected = draft.nombre.trim() === recommendation.nombre;

                          return (
                            <button
                              type="button"
                              key={recommendation.id}
                              onClick={() => handleSelectRecommendation(recommendation)}
                              data-testid={`meal-edit-recommendation-${recommendation.id}`}
                              className={`rounded-2xl border px-3.5 py-3 text-left transition ${
                                isSelected
                                  ? `${accentClasses.border} ${accentClasses.bgLight}`
                                  : isDarkMode
                                    ? 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700'
                                    : 'border-white bg-white text-slate-700 hover:border-slate-200'
                              }`}
                            >
                              <span className="flex items-start gap-3">
                                {isSelected ? (
                                  <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                                ) : (
                                  <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className={`block text-sm font-black leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {recommendation.nombre}
                                  </span>
                                  <span className={`mt-1 block text-[11px] font-bold ${accentClasses.text}`}>
                                    {recommendation.caloriasKcal} kcal - {recommendation.proteinaG}g proteina - {recommendation.grasasG}g grasas
                                  </span>
                                  {recommendation.reasons.length > 0 ? (
                                    <span className="mt-2 flex flex-wrap gap-1.5">
                                      {recommendation.reasons.map((reason) => (
                                        <span
                                          key={`${recommendation.id}-${reason}`}
                                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${accentClasses.tagBg} ${accentClasses.tagText}`}
                                        >
                                          {reason}
                                        </span>
                                      ))}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {editMode === 'manual' ? (
                  <>
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
                  </>
                ) : null}

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
                    {draft.porciones || referencePortions}
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
              </div>
            </div>

            <div className={`border-t px-4 py-4 sm:px-6 ${
              isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-1">
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

                  <p className={`text-xs sm:text-right ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {selectedOccurrenceIds.length} de {affectedMeals.length} comidas seleccionadas
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  data-testid="meal-edit-save"
                  disabled={isSaving || !canSave || !canConfirmSelection}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white bg-gradient-to-r ${accentClasses.bgGradient} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Save className="w-4 h-4" />
                  {isSaving
                    ? 'Guardando...'
                    : actionLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
