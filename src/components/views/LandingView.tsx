import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Sparkles,
  Scale,
  Ruler,
  Calendar,
  ChefHat,
  ShoppingBasket,
  Moon,
  Sun,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { buildProfileInspectionText, extractProfileMetrics } from '../../utils/profileSummary';
import { getProfileLabel } from '../../utils/profileLabels';

/* ─── constants ──────────────────────────────────────────────────── */
const IMC_MIN = 16;
const IMC_MAX = 45;

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

/* ─── IMC bar ────────────────────────────────────────────────────── */
function ImcBar({ imc, label }: { imc: number; label: string }) {
  const pct = Math.min(100, Math.max(0, ((imc - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100));
  const barColor = imc < 18.5 ? '#38bdf8' : imc < 25 ? '#34d399' : imc < 30 ? '#fbbf24' : '#fb7185';
  const badgeCls =
    imc < 18.5
      ? 'bg-sky-400/20 text-sky-50 border border-sky-200/20'
      : imc < 25
        ? 'bg-emerald-400/20 text-emerald-50 border border-emerald-200/20'
        : imc < 30
          ? 'bg-amber-400/20 text-amber-50 border border-amber-200/20'
          : 'bg-rose-400/20 text-rose-50 border border-rose-200/20';

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">IMC</span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-white tabular-nums">{imc.toFixed(1)}</span>
          <span className={`text-[9px] font-semibold px-1.5 py-px rounded-full whitespace-nowrap ${badgeCls}`}>{label}</span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full overflow-hidden bg-white/15 ring-1 ring-white/10">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #38bdf8 0% 8.6%, #34d399 8.6% 31%, #fbbf24 31% 48.3%, #fb7185 48.3% 100%)', opacity: 0.2 }} />
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: barColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }} />
      </div>
      <div className="flex justify-between">
        {['16', '18.5', '25', '30', '45'].map((v) => (
          <span key={v} className="text-[8px] text-white/60 tabular-nums">{v}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Bio chip ───────────────────────────────────────────────────── */
function BioChip({ icon: Icon, value, unit }: { icon: React.ElementType; value: string | null; unit: string }) {
  if (!value) return null;
  return (
    <div className="inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg px-1.5 py-0.5 backdrop-blur-sm">
      <Icon className="w-2.5 h-2.5 text-white/80 shrink-0" />
      <span className="text-[10px] font-semibold text-white tabular-nums">
        {value}<span className="font-normal text-white/70 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

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

/* ─── helpers ────────────────────────────────────────────────────── */
function getImcData(text: string) {
  const { imc } = extractProfileMetrics(text);
  if (!imc || isNaN(imc)) return null;
  const label = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Saludable' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
  return { imc, label };
}

function getBio(text: string) {
  const m = extractProfileMetrics(text);
  return { weight: m.weightKg, height: m.heightM, age: m.age };
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

  const sharedPlanStats = useMemo(() => {
    const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const parse = (plan: Record<string, any>) => {
      const meals = new Set<string>();
      const ing = new Set<string>();
      Object.values(plan || {}).forEach((day: any) =>
        Object.values(day || {}).forEach((ms: any) => {
          if (!Array.isArray(ms)) return;
          ms.forEach((m: any) => {
            if (m?.nombre) meals.add(norm(String(m.nombre)));
            if (Array.isArray(m?.super)) m.super.forEach((i: string) => ing.add(norm(String(i))));
          });
        })
      );
      return { meals, ing };
    };
    const el = parse(profilesData.el.plan);
    const ella = parse(profilesData.ella.plan);
    const shared = [...el.meals].filter((n) => ella.meals.has(n)).length;
    const common = [...el.ing].filter((i) => ella.ing.has(i)).length;
    const union = new Set([...el.ing, ...ella.ing]).size;
    return { shared, pct: union > 0 ? Math.round((common / union) * 100) : 0 };
  }, [profilesData.el.plan, profilesData.ella.plan]);

  const elText = buildProfileInspectionText(profilesData.el.perfil, profilesData.el.detallesPerfil);
  const ellaText = buildProfileInspectionText(profilesData.ella.perfil, profilesData.ella.detallesPerfil);
  const elImc = getImcData(elText);
  const ellaImc = getImcData(ellaText);
  const elBio = getBio(elText);
  const ellaBio = getBio(ellaText);

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
      imc: elImc, bio: elBio, meta: profilesData.el.meta,
      onCard: () => { setActiveProfile('el'); setActiveDay('Lunes'); setActiveTab('plan'); },
      onIA: () => openQuestionnaire('el'),
    },
    {
      id: 'ella' as const, label: labelElla, emoji: '🧍‍♀️', ready: ellaReady,
      grad: isDarkMode ? 'from-[#5b1a3a] via-[#9d174d] to-[#be185d]' : 'from-[#ec4899] via-[#f472b6] to-[#fb923c]',
      shadow: isDarkMode ? 'shadow-[0_16px_40px_rgba(157,23,77,0.35)]' : 'shadow-[0_16px_40px_rgba(236,72,153,0.22)]',
      imc: ellaImc, bio: ellaBio, meta: profilesData.ella.meta,
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

          {/* Feature badges */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 dark:bg-white/8 border border-slate-300/40 dark:border-white/10 shadow-sm">
              <ChefHat className="w-3 h-3 text-violet-500 dark:text-violet-400" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Plan editable</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 dark:bg-white/8 border border-slate-300/40 dark:border-white/10 shadow-sm">
              <ShoppingBasket className="w-3 h-3 text-violet-500 dark:text-violet-400" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Lista de compras</span>
            </div>
          </div>
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

                  {/* bio chips */}
                  {(c.bio.weight || c.bio.height || c.bio.age) && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-1.5">
                      <BioChip icon={Scale} value={c.bio.weight} unit="kg" />
                      <BioChip icon={Ruler} value={c.bio.height} unit="m" />
                      <BioChip icon={Calendar} value={c.bio.age} unit="años" />
                    </div>
                  )}

                  {/* IMC */}
                  {c.imc && <ImcBar imc={c.imc.imc} label={c.imc.label} />}

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

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <CtaButton
                    label={elReady && ellaReady ? 'Actualizar plan conjunto' : 'Personalizar plan conjunto'}
                    dataTestId="landing-customize-ambos"
                    onClick={(e) => { e.stopPropagation(); openQuestionnaire('ambos'); }}
                  />
                </div>

                {/* stats (desktop) */}
                <div className="hidden sm:flex gap-2">
                  {[
                    { val: String(sharedPlanStats.shared), label: 'Compartidas' },
                    { val: `${sharedPlanStats.pct}%`, label: 'Sinergia' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-2 min-w-[72px] backdrop-blur-sm border border-white/8">
                      <span className="text-[8px] text-white/60 font-bold uppercase tracking-widest">{label}</span>
                      <span className="text-lg font-bold text-white tabular-nums leading-none">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>


    </div>
  );
}
