import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Circle, Search, UtensilsCrossed, X } from 'lucide-react';
import type { MealItem, Profile } from '../types';
import type { AccentColors } from '../utils/theme';
import {
  getRecommendedCatalogMealsForSlot,
  type CatalogMealRecommendation,
} from '../utils/mealEditing';

type ProfileId = 'el' | 'ella';
type TargetProfile = ProfileId | 'ambos';

export interface LocalMealReplacementItem {
  profileId: ProfileId;
  profileLabel: string;
  dia: string;
  momentoKey: string;
  momentoLabel: string;
  optionIndex: number;
  occurrenceId: string;
  currentMeal: MealItem;
  replacement: CatalogMealRecommendation;
}

interface ReplacementSlot {
  dia: string;
  momentoKey: string;
  momentoLabel: string;
  optionIndex: number;
}

interface WeeklyMealReplacementSheetProps {
  open: boolean;
  targetProfile: TargetProfile;
  profilesData: Record<ProfileId, Profile>;
  profileLabels: Record<ProfileId, string>;
  questionnaireContexts: Partial<Record<ProfileId, any>>;
  selecciones: Record<string, boolean>;
  onClose: () => void;
  onApply: (items: LocalMealReplacementItem[]) => Promise<void> | void;
  isDarkMode?: boolean;
  accentClasses: AccentColors;
  isSaving?: boolean;
}

const PROFILE_IDS: ProfileId[] = ['el', 'ella'];

function getActiveProfiles(targetProfile: TargetProfile): ProfileId[] {
  return targetProfile === 'ambos' ? PROFILE_IDS : [targetProfile];
}

function getMeal(profile: Profile, slot: ReplacementSlot) {
  return profile.plan?.[slot.dia]?.[slot.momentoKey]?.[slot.optionIndex] || null;
}

function getMomentLabel(profile: Profile, momentoKey: string) {
  return profile.momentos.find((momento) => momento.key === momentoKey)?.label || momentoKey;
}

function buildSlots(profiles: Profile[], selectedDay: string): ReplacementSlot[] {
  const momentKeys = Array.from(new Set(profiles.flatMap((profile) => profile.momentos.map((momento) => momento.key))));
  const slots: ReplacementSlot[] = [];

  momentKeys.forEach((momentoKey) => {
    const maxOptions = Math.max(
      ...profiles.map((profile) => profile.plan?.[selectedDay]?.[momentoKey]?.length || 0),
      0
    );

    for (let optionIndex = 0; optionIndex < maxOptions; optionIndex += 1) {
      const profileWithMoment = profiles.find((profile) => profile.momentos.some((momento) => momento.key === momentoKey));
      slots.push({
        dia: selectedDay,
        momentoKey,
        momentoLabel: profileWithMoment ? getMomentLabel(profileWithMoment, momentoKey) : momentoKey,
        optionIndex,
      });
    }
  });

  return slots;
}

function getSlotKey(slot: ReplacementSlot) {
  return `${slot.dia}::${slot.momentoKey}::${slot.optionIndex}`;
}

export default function WeeklyMealReplacementSheet({
  open,
  targetProfile,
  profilesData,
  profileLabels,
  questionnaireContexts,
  selecciones,
  onClose,
  onApply,
  isDarkMode = false,
  accentClasses,
  isSaving = false,
}: WeeklyMealReplacementSheetProps) {
  const activeProfiles = React.useMemo(() => getActiveProfiles(targetProfile), [targetProfile]);
  const dayKeys = React.useMemo(() => {
    const days = new Set<string>();
    activeProfiles.forEach((profileId) => {
      Object.keys(profilesData[profileId].plan || {}).forEach((day) => days.add(day));
    });
    return Array.from(days);
  }, [activeProfiles, profilesData]);
  const [selectedDay, setSelectedDay] = React.useState(dayKeys[0] || 'Lunes');
  const slots = React.useMemo(() => (
    buildSlots(activeProfiles.map((profileId) => profilesData[profileId]), selectedDay)
  ), [activeProfiles, profilesData, selectedDay]);
  const [selectedSlotKey, setSelectedSlotKey] = React.useState('');
  const [selectedRecommendationIds, setSelectedRecommendationIds] = React.useState<Record<ProfileId, string>>({
    el: '',
    ella: '',
  });
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setSelectedDay(dayKeys[0] || 'Lunes');
    setSelectedSlotKey('');
    setSelectedRecommendationIds({ el: '', ella: '' });
    setSearchQuery('');
  }, [dayKeys, open, targetProfile]);

  React.useEffect(() => {
    if (!open || selectedSlotKey || slots.length === 0) return;
    setSelectedSlotKey(getSlotKey(slots[0]));
  }, [open, selectedSlotKey, slots]);

  const selectedSlot = React.useMemo(() => {
    if (!selectedSlotKey) return slots[0] || null;
    return slots.find((slot) => getSlotKey(slot) === selectedSlotKey) || slots[0] || null;
  }, [selectedSlotKey, slots]);

  const recommendationsByProfile = React.useMemo(() => {
    if (!selectedSlot) return {} as Record<ProfileId, CatalogMealRecommendation[]>;

    return activeProfiles.reduce((acc, profileId) => {
      const currentMeal = getMeal(profilesData[profileId], selectedSlot);
      acc[profileId] = currentMeal
        ? getRecommendedCatalogMealsForSlot(
          profilesData[profileId],
          profileId,
          selectedSlot.momentoKey,
          questionnaireContexts[profileId],
          currentMeal.id,
          8
        )
        : [];
      return acc;
    }, {} as Record<ProfileId, CatalogMealRecommendation[]>);
  }, [activeProfiles, profilesData, questionnaireContexts, selectedSlot]);

  React.useEffect(() => {
    if (!selectedSlot) return;
    setSelectedRecommendationIds((prev) => {
      const next = { ...prev };
      activeProfiles.forEach((profileId) => {
        const options = recommendationsByProfile[profileId] || [];
        if (!options.some((item) => item.id === next[profileId])) {
          next[profileId] = options[0]?.id || '';
        }
      });
      return next;
    });
  }, [activeProfiles, recommendationsByProfile, selectedSlot]);

  if (!open) return null;

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleSlots = normalizedSearch
    ? slots.filter((slot) => activeProfiles.some((profileId) => {
      const meal = getMeal(profilesData[profileId], slot);
      return `${slot.dia} ${slot.momentoLabel} opcion ${slot.optionIndex + 1} ${meal?.nombre || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    }))
    : slots;

  const selectedItems = selectedSlot
    ? activeProfiles.map((profileId) => {
      const currentMeal = getMeal(profilesData[profileId], selectedSlot);
      const replacement = (recommendationsByProfile[profileId] || [])
        .find((item) => item.id === selectedRecommendationIds[profileId]);
      if (!currentMeal || !replacement) return null;

      return {
        profileId,
        profileLabel: profileLabels[profileId],
        dia: selectedSlot.dia,
        momentoKey: selectedSlot.momentoKey,
        momentoLabel: selectedSlot.momentoLabel,
        optionIndex: selectedSlot.optionIndex,
        occurrenceId: `${selectedSlot.dia}::${selectedSlot.momentoKey}::${selectedSlot.optionIndex}`,
        currentMeal,
        replacement,
      };
    }).filter((item): item is LocalMealReplacementItem => item !== null)
    : [];
  const canApply = selectedItems.length === activeProfiles.length && selectedItems.length > 0;

  const panelClasses = isDarkMode
    ? 'border-slate-800 bg-slate-950/70 text-slate-100'
    : 'border-slate-200 bg-slate-50/80 text-slate-900';
  const itemBaseClasses = isDarkMode
    ? 'border-slate-800 bg-slate-950 text-slate-100 hover:border-slate-700'
    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm"
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
            className={`flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[32px] ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 shadow-[0_20px_60px_rgba(2,6,23,0.55)]'
                : 'border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b px-4 py-4 sm:px-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${accentClasses.bgLight}`}>
                  <UtensilsCrossed className={`h-4 w-4 ${accentClasses.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${accentClasses.text}`}>
                    Reemplazo local
                  </p>
                  <h3 className={`text-lg font-black leading-tight tracking-tight sm:text-xl ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                    Elegir comida de la semana
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    Selecciona dia, tiempo y opcion exacta. En vista Ambos se reemplaza el mismo espacio para los dos perfiles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="local-replacement-close"
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                  aria-label="Cerrar reemplazo local"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <section className={`rounded-[24px] border p-3 sm:p-4 ${panelClasses}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {dayKeys.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedSlotKey('');
                          }}
                          data-testid={`local-replacement-day-${day}`}
                          className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
                            selectedDay === day
                              ? `${accentClasses.tagBg} ${accentClasses.tagText} ${accentClasses.border}`
                              : isDarkMode
                                ? 'border border-slate-800 bg-slate-900 text-slate-300'
                                : 'border border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <label className={`flex h-11 items-center gap-2 rounded-2xl border px-3 ${
                      isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                    }`}>
                      <Search className={`h-4 w-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Buscar comida, tiempo u opcion"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-2" data-testid="local-replacement-slot-list">
                    {visibleSlots.map((slot) => {
                      const slotKey = getSlotKey(slot);
                      const isSelected = selectedSlot ? getSlotKey(selectedSlot) === slotKey : false;

                      return (
                        <button
                          type="button"
                          key={slotKey}
                          onClick={() => setSelectedSlotKey(slotKey)}
                          data-testid={`local-replacement-slot-${slot.dia}-${slot.momentoKey}-${slot.optionIndex}`}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                            isSelected
                              ? `${accentClasses.border} ${accentClasses.bgLight}`
                              : itemBaseClasses
                          }`}
                        >
                          <span className="flex items-start gap-3">
                            {isSelected ? (
                              <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${accentClasses.text}`} />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[11px] font-black uppercase tracking-[0.14em] ${accentClasses.text}`}>
                                {slot.dia} - {slot.momentoLabel} - opcion {slot.optionIndex + 1}
                              </span>
                              <span className="mt-2 grid gap-2">
                                {activeProfiles.map((profileId) => {
                                  const meal = getMeal(profilesData[profileId], slot);
                                  const selectionKey = meal ? `${profileId}-${slot.dia}-${slot.momentoKey}-${meal.nombre}` : '';
                                  const isCurrentSelection = Boolean(selectionKey && selecciones[selectionKey]);

                                  return (
                                    <span
                                      key={`${slotKey}-${profileId}`}
                                      className={`rounded-xl px-2.5 py-2 text-xs ${
                                        isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'
                                      }`}
                                    >
                                      <span className="font-black">{profileLabels[profileId]}</span>
                                      <span className="mx-1">-</span>
                                      <span>{meal?.nombre || 'Sin comida en esta opcion'}</span>
                                      {isCurrentSelection ? (
                                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black ${accentClasses.tagBg} ${accentClasses.tagText}`}>
                                          elegida
                                        </span>
                                      ) : null}
                                    </span>
                                  );
                                })}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className={`rounded-[24px] border p-3 sm:p-4 ${panelClasses}`}>
                  {selectedSlot ? (
                    <div className="space-y-4">
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${accentClasses.text}`}>
                          Reemplazo para
                        </p>
                        <p className={`mt-1 text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {selectedSlot.dia} - {selectedSlot.momentoLabel} - opcion {selectedSlot.optionIndex + 1}
                        </p>
                      </div>

                      {activeProfiles.map((profileId) => {
                        const currentMeal = getMeal(profilesData[profileId], selectedSlot);
                        const recommendations = recommendationsByProfile[profileId] || [];

                        return (
                          <div key={profileId} className={`rounded-2xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-xs font-black ${accentClasses.text}`}>
                                  {profileLabels[profileId]}
                                </p>
                                <p className={`mt-1 text-sm font-bold leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                  {currentMeal?.nombre || 'Sin comida actual'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2">
                              {recommendations.map((recommendation) => {
                                const isSelected = selectedRecommendationIds[profileId] === recommendation.id;

                                return (
                                  <button
                                    key={`${profileId}-${recommendation.id}`}
                                    type="button"
                                    onClick={() => setSelectedRecommendationIds((prev) => ({
                                      ...prev,
                                      [profileId]: recommendation.id,
                                    }))}
                                    data-testid={`local-replacement-recommendation-${profileId}-${recommendation.id}`}
                                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                                      isSelected
                                        ? `${accentClasses.border} ${accentClasses.bgLight}`
                                        : itemBaseClasses
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
                                          {recommendation.caloriasKcal} kcal - {recommendation.proteinaG}g proteina
                                        </span>
                                        <span className={`mt-1 block text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                          {recommendation.porciones}
                                        </span>
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`rounded-2xl p-4 text-center text-sm font-semibold ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      Selecciona una comida de la semana.
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className={`border-t px-4 py-4 sm:px-6 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
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
                  onClick={() => {
                    if (!canApply) return;
                    void onApply(selectedItems);
                  }}
                  data-testid="local-replacement-apply"
                  disabled={!canApply || isSaving}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white bg-gradient-to-r ${accentClasses.bgGradient} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  {isSaving
                    ? 'Aplicando...'
                    : targetProfile === 'ambos'
                      ? 'Reemplazar en ambos'
                      : 'Reemplazar comida'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
