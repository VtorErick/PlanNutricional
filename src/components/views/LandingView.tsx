import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Sparkles,
  ChefHat,
  Moon,
  Sun,
  Calendar,
  ShoppingCart,
  Flame,
  SlidersHorizontal,
  Check,
  Clock,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getProfileLabel } from '../../utils/profileLabels';
import type { MealItem } from '../../types';

/* ─── constants ──────────────────────────────────────────────────── */
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const createDefaultQuestionnairePerson = (weight: string, height: string, age = '', targetWeightKg = '') => ({
  age,
  currentWeightKg: weight,
  heightCm: height,
  targetWeightKg,
  objectives: [],
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
  },
  assessmentReportPdf: null,
});

/* ─── helpers ────────────────────────────────────────────────────── */
function parseTimeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getNextMomento(momentos: Array<{ key: string; label: string; hora: string }>) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...momentos].sort((a, b) => parseTimeToMinutes(a.hora) - parseTimeToMinutes(b.hora));
  const next = sorted.find((m) => parseTimeToMinutes(m.hora) >= currentMinutes);
  return next || null;
}

/* ═══════════════════════════════════════════════════════════════════
   LANDING VIEW
   ═══════════════════════════════════════════════════════════════════ */
export default function LandingView() {
  const {
    setPerfilActivo: setActiveProfile,
    setDiaActivo: setActiveDay,
    setTab: setActiveTab,
    perfilesData,
    profileLabels,
    setShowAdmin: setIsAdminOpen,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setQuestionnaireTargetProfile,
    setQuestionnaireEl,
    setQuestionnaireElla,
    setQuestionnairePortionMode,
    setQuestionnaireManualPortions,
    setQuestionnaireAdditionalNotes,
    selecciones,
    toggleSeleccion,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();

  const [dashProfile, setDashProfile] = useState<'el' | 'ella' | 'ambos'>(() => {
    try {
      const stored = window.localStorage.getItem('perfilActivo');
      if (stored === 'el' || stored === 'ella' || stored === 'ambos') return stored;
    } catch { /* noop */ }
    return 'el';
  });

  const labelEl = getProfileLabel(profileLabels, 'el');
  const labelElla = getProfileLabel(profileLabels, 'ella');

  const openQuestionnaire = (target: 'el' | 'ella' | 'ambos') => {
    setQuestionnaireTargetProfile(target);
    setQuestionnaireEl((prev: any) =>
      prev && (prev.currentWeightKg || prev.age) ? prev : createDefaultQuestionnairePerson('80', '170', '30', '70')
    );
    setQuestionnaireElla((prev: any) =>
      prev && (prev.currentWeightKg || prev.age) ? prev : createDefaultQuestionnairePerson('65', '162', '28', '57')
    );
    setQuestionnairePortionMode('auto');
    setQuestionnaireManualPortions({});
    setQuestionnaireAdditionalNotes('');
    setIsQuestionnaireOpen(true);
  };

  /* ═══ DASHBOARD PRINCIPAL ════════════════════════════════════════ */
  const isAmbos = dashProfile === 'ambos';
  const profileEl = perfilesData.el;
  const profileElla = perfilesData.ella;
  const activeProfileObj = isAmbos ? profileEl : (dashProfile === 'ella' ? profileElla : profileEl);
  const activeMomentoCompletado = (key: string) => {
    if (isAmbos) {
      const elDone = (profileEl.plan[diaHoy]?.[key] || []).some((m: MealItem) => selecciones[`el-${diaHoy}-${key}-${m.nombre}`]);
      const ellaDone = (profileElla.plan[diaHoy]?.[key] || []).some((m: MealItem) => selecciones[`ella-${diaHoy}-${key}-${m.nombre}`]);
      return elDone && ellaDone;
    }
    return (activeProfileObj.plan[diaHoy]?.[key] || []).some((m: MealItem) => selecciones[`${dashProfile}-${diaHoy}-${key}-${m.nombre}`]);
  };

  const now = new Date();
  const diaHoy = DIAS_SEMANA[now.getDay()];
  const greeting = getGreeting();
  const nextMomento = getNextMomento(activeProfileObj.momentos || []);

  const momentosCompletados = (activeProfileObj.momentos || []).filter((m) => activeMomentoCompletado(m.key)).length;
  const totalMomentos = (activeProfileObj.momentos || []).length;
  const progressPct = totalMomentos > 0 ? Math.round((momentosCompletados / totalMomentos) * 100) : 0;

  const nextMeals = nextMomento
    ? (activeProfileObj.plan[diaHoy]?.[nextMomento.key] || [])
    : [];

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[120px] bg-violet-200/30 dark:bg-violet-900/15" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] bg-blue-200/25 dark:bg-blue-900/10" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-5xl mx-auto w-full px-5 sm:px-6">

        {/* top bar */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">PlanNutricional</span>
          </motion.div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openQuestionnaire('el')}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personalizar</span>
            </button>
            <button type="button" onClick={() => setIsDarkMode((p) => !p)} className="h-9 w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => setIsAdminOpen(true)} data-testid="landing-admin-button" className="h-9 w-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* greeting + day */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pt-2 pb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{greeting}, hoy es {diaHoy}</p>
        </motion.div>

        {/* profile selector pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 pb-4">
          <button
            type="button"
            onClick={() => setDashProfile('el')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${dashProfile === 'el' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {labelEl}
          </button>
          <button
            type="button"
            onClick={() => setDashProfile('ella')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${dashProfile === 'ella' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {labelElla}
          </button>
          <button
            type="button"
            onClick={() => setDashProfile('ambos')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${dashProfile === 'ambos' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            Ambos
          </button>
        </motion.div>

        {/* next meal card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={dashProfile}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pb-4"
          >
            {nextMomento ? (
              <div className="rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-500">Siguiente comida</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{nextMomento.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{nextMomento.hora}</p>

                {isAmbos ? (
                  <div className="space-y-4">
                    {/* El */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2">{labelEl}</p>
                      <div className="space-y-2">
                        {(profileEl.plan[diaHoy]?.[nextMomento.key] || []).map((meal: MealItem, idx: number) => {
                          const selected = selecciones[`el-${diaHoy}-${nextMomento.key}-${meal.nombre}`];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleSeleccion('el', diaHoy, nextMomento.key, meal.nombre)}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selected ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}>
                                {selected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{meal.nombre}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{meal.caloriasKcal || 0} kcal</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Ella */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500 mb-2">{labelElla}</p>
                      <div className="space-y-2">
                        {(profileElla.plan[diaHoy]?.[nextMomento.key] || []).map((meal: MealItem, idx: number) => {
                          const selected = selecciones[`ella-${diaHoy}-${nextMomento.key}-${meal.nombre}`];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleSeleccion('ella', diaHoy, nextMomento.key, meal.nombre)}
                              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selected ? 'bg-pink-50 dark:bg-pink-950/30 border-2 border-pink-500' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-pink-500 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}>
                                {selected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{meal.nombre}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{meal.caloriasKcal || 0} kcal</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nextMeals.map((meal: MealItem, idx: number) => {
                      const selected = selecciones[`${dashProfile}-${diaHoy}-${nextMomento.key}-${meal.nombre}`];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleSeleccion(dashProfile, diaHoy, nextMomento.key, meal.nombre)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${selected ? 'bg-violet-50 dark:bg-violet-950/30 border-2 border-violet-500' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-violet-500 text-white' : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}>
                            {selected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{meal.nombre}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{meal.caloriasKcal || 0} kcal</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">¡Plan completado!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Has registrado todas las comidas de hoy.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="pb-4">
          <div className="rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Progreso del día</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{momentosCompletados}/{totalMomentos}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{progressPct}% completado</p>
          </div>
        </motion.div>

        {/* quick actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="grid grid-cols-4 gap-2 pb-24">
          <button
            type="button"
            onClick={() => { setActiveProfile(dashProfile); setActiveDay(diaHoy); setActiveTab('plan'); }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Mi plan</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveProfile(dashProfile); setActiveDay(diaHoy); setActiveTab('calorias'); }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Progreso</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveProfile(dashProfile); setActiveDay(diaHoy); setActiveTab('compras'); }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-teal-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Compras</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveProfile(dashProfile); setActiveDay(diaHoy); setActiveTab('plan'); /* abriría ajuste con IA */ }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Ajustar</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
