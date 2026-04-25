import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Sparkles,
  ChefHat,
  Moon,
  Sun,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getProfileLabel } from '../../utils/profileLabels';

/* ─── constants ──────────────────────────────────────────────────── */
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

/* ─── CTA button ─────────────────────────────────────────────────── */
function CtaButton({ label, onClick, dataTestId }: { label: string; onClick: (e: React.MouseEvent) => void; dataTestId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={dataTestId}
      className="group relative w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold text-white backdrop-blur-sm transition-all duration-200 active:scale-[0.97] shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
    >
      <Sparkles className="w-3 h-3 transition-transform group-hover:rotate-12" />
      <span>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LANDING VIEW
   ═══════════════════════════════════════════════════════════════════ */
export default function LandingView() {
  const {
    setPerfilActivo: setActiveProfile,
    setDiaActivo: setActiveDay,
    setTab: setActiveTab,
    perfilesData: profilesData,
    profileLabels,
    dataVersions,
    setShowAdmin: setIsAdminOpen,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setQuestionnaireTargetProfile,
    setQuestionnaireEl,
    setQuestionnaireElla,
    setQuestionnairePortionMode,
    setQuestionnaireManualPortions,
    setQuestionnaireAdditionalNotes,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();

  const elReady = dataVersions.el === 'custom';
  const ellaReady = dataVersions.ella === 'custom';
  const labelEl = getProfileLabel(profileLabels, 'el');
  const labelElla = getProfileLabel(profileLabels, 'ella');

  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

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

  /* ── card data ── */
  const cards = [
    {
      id: 'el' as const, label: labelEl, emoji: '🧍‍♂️', ready: elReady,
      grad: isDarkMode ? 'from-[#1e3a5f] via-[#1e40af] to-[#312e81]' : 'from-[#6366f1] via-[#3b82f6] to-[#38bdf8]',
      shadow: isDarkMode ? 'shadow-[0_16px_40px_rgba(30,58,138,0.35)]' : 'shadow-[0_16px_40px_rgba(99,102,241,0.22)]',
      meta: profilesData.el.meta,
      onCard: () => { setActiveProfile('el'); setActiveDay('Lunes'); setActiveTab('plan'); },
      onIA: () => openQuestionnaire('el'),
    },
    {
      id: 'ella' as const, label: labelElla, emoji: '🧍‍♀️', ready: ellaReady,
      grad: isDarkMode ? 'from-[#5b1a3a] via-[#9d174d] to-[#be185d]' : 'from-[#ec4899] via-[#f472b6] to-[#fb923c]',
      shadow: isDarkMode ? 'shadow-[0_16px_40px_rgba(157,23,77,0.35)]' : 'shadow-[0_16px_40px_rgba(236,72,153,0.22)]',
      meta: profilesData.ella.meta,
      onCard: () => { setActiveProfile('ella'); setActiveDay('Lunes'); setActiveTab('plan'); },
      onIA: () => openQuestionnaire('ella'),
    },
  ];

  const ambosGrad = isDarkMode ? 'from-[#2e1065] via-[#4c1d95] to-[#6d28d9]' : 'from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]';
  const ambosShadow = isDarkMode ? 'shadow-[0_16px_40px_rgba(76,29,149,0.35)]' : 'shadow-[0_16px_40px_rgba(124,58,237,0.18)]';

  const statusLines = !elReady && !ellaReady
    ? { main: 'Aún no hay planes generados.', cta: 'Comienza con ✨ Personalizar mi plan.', sub: 'También puedes personalizar ambos para obtener más comidas compartidas.' }
    : elReady && ellaReady
      ? { main: 'Ambos planes listos.', cta: 'Puedes entrar individual o juntos.', sub: '' }
      : { main: `${elReady ? labelEl : labelElla} ya tiene plan.`, cta: 'Completa el otro cuando quieras.', sub: '' };

  /* ═══ RENDER ═══════════════════════════════════════════════════════ */
  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden bg-[#dde2ef] dark:bg-[#070b18]">

      {/* ── BACKGROUND MESH ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[100px] bg-indigo-300/40 dark:bg-indigo-900/20" />
        <div className="absolute -bottom-40 -right-24 w-[420px] h-[420px] rounded-full blur-[100px] bg-pink-200/40 dark:bg-pink-950/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full blur-[90px] bg-violet-200/30 dark:bg-violet-950/15" />
      </div>

      {/* ── CONTENT COLUMN ──────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6">

        {/* ── TOP BAR ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 pb-1 sm:pt-5 sm:pb-3">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">INICIO</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <button type="button" onClick={() => setIsDarkMode((p) => !p)} className="h-8 w-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-white/8 border border-slate-300/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/14 transition-all shadow-sm" title={isDarkMode ? 'Claro' : 'Oscuro'}>
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={() => setIsAdminOpen(true)} data-testid="landing-admin-button" className="group h-8 rounded-full flex items-center gap-1.5 px-3 bg-white/50 dark:bg-white/8 border border-slate-300/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/14 transition-all shadow-sm">
              <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
              <span className="text-[10px] font-bold hidden sm:inline">Ajustes avanzados</span>
            </button>
          </motion.div>
        </div>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center pb-1 sm:pb-3">
          <h1 className="text-[24px] sm:text-4xl font-black tracking-tight leading-[1.12] text-slate-800 dark:text-white">
            Nutrición inteligente,{' '}
            <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-pink-500 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>
          <p className="text-[12px] sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">
            Elige tu plan individual o armen su lista de compras juntos de forma automática.
          </p>

        </motion.div>

        {/* ── STATUS ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="pb-2 sm:pb-3">
          <div className="rounded-2xl bg-white/60 dark:bg-white/6 border border-slate-200/40 dark:border-white/8 px-4 py-2.5 backdrop-blur-sm shadow-sm text-center">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug">{statusLines.main}</p>
            <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-snug mt-0.5">
              Comienza con <Sparkles className="inline w-3 h-3 text-violet-500 -mt-0.5" /> <span className="font-black italic">Personalizar mi plan</span>.
            </p>
            {statusLines.sub && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{statusLines.sub}</p>}
          </div>
        </motion.div>

        {/* ── CARDS ────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 gap-3 sm:gap-4 pb-20 sm:pb-8 min-h-0">

          {/* El + Ella side-by-side */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.15 + i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                role="button" tabIndex={0}
                onClick={c.onCard} onKeyDown={onKey(c.onCard)}
                data-testid={`landing-profile-${c.id}-card`}
                className={`group relative overflow-hidden rounded-[20px] sm:rounded-3xl bg-gradient-to-br ${c.grad} ${c.shadow} transition-all duration-300 cursor-pointer flex flex-col ring-1 ring-white/15 dark:ring-white/10`}
              >
                {/* glass highlights */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/8 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

                {c.ready && (
                  <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-md text-white text-[9px] font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Listo
                  </div>
                )}

                {/* content */}
                <div className="relative z-10 p-3 sm:p-5 flex flex-col flex-1 gap-2 sm:gap-3">
                  {/* name */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/12 border border-white/10 flex items-center justify-center text-lg sm:text-xl shrink-0 leading-none backdrop-blur-sm">
                      {c.emoji}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">{c.label}</h3>
                  </div>

                  {/* meta */}
                  <p className="text-[10px] sm:text-xs font-medium leading-snug text-white/85 line-clamp-3">{c.meta}</p>

                  {/* spacer */}
                  <div className="flex-1 min-h-0" />

                  {/* CTA */}
                  <CtaButton
                    label={c.ready ? 'Personalizar mi plan' : 'Personalizar mi plan'}
                    dataTestId={`landing-customize-${c.id}`}
                    onClick={(e) => { e.stopPropagation(); c.onIA(); }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ambos */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28, delay: 0.3 }}
            whileTap={{ scale: 0.99 }}
            role="button" tabIndex={0}
            onClick={() => { setActiveProfile('ambos'); setActiveDay('Lunes'); setActiveTab('plan'); }}
            onKeyDown={onKey(() => { setActiveProfile('ambos'); setActiveDay('Lunes'); setActiveTab('plan'); })}
            data-testid="landing-profile-ambos-card"
            className={`group relative overflow-hidden rounded-[20px] sm:rounded-3xl bg-gradient-to-br ${ambosGrad} ${ambosShadow} transition-all duration-300 cursor-pointer ring-1 ring-white/15 dark:ring-white/10`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/8 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/12 border border-white/10 flex items-center justify-center text-xl sm:text-2xl shrink-0 leading-none backdrop-blur-sm">
                  👫
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">Ambos</h3>
                  <p className="text-[11px] sm:text-xs text-white/75 font-medium leading-snug mt-0.5">
                    Combina los planes de ambos en una sola vista y genera una lista de compras conjunta.
                  </p>
                </div>
              </div>

              <CtaButton
                label={elReady && ellaReady ? 'Actualizar plan conjunto' : 'Personalizar plan conjunto'}
                dataTestId="landing-customize-ambos"
                onClick={(e) => { e.stopPropagation(); openQuestionnaire('ambos'); }}
              />
            </div>
          </motion.div>
        </div>
      </div>


    </div>
  );
}
