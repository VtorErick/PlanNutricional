import React, { useMemo, useState } from 'react';
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

// Constants
const IMC_MIN = 16;
const IMC_MAX = 45;

// BMI progress bar
function ImcBar({ imc, label }: { imc: number; label: string }) {
  const pct = Math.min(100, Math.max(0, ((imc - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100));

  const barColor =
    imc < 18.5 ? '#38bdf8' : imc < 25 ? '#34d399' : imc < 30 ? '#fbbf24' : '#fb7185';

  const badgeCls =
    imc < 18.5
      ? 'bg-sky-400/20 text-sky-50 border border-sky-200/20'
      : imc < 25
        ? 'bg-emerald-400/20 text-emerald-50 border border-emerald-200/20'
        : imc < 30
          ? 'bg-amber-400/20 text-amber-50 border border-amber-200/20'
          : 'bg-rose-400/20 text-rose-50 border border-rose-200/20';

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/85">
          IMC
        </span>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white tabular-nums drop-shadow-sm">
            {imc.toFixed(1)}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap ${badgeCls}`}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="relative h-2.5 w-full rounded-full overflow-hidden bg-white/15 ring-1 ring-white/10 shadow-inner">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #38bdf8 0% 8.6%, #34d399 8.6% 31%, #fbbf24 31% 48.3%, #fb7185 48.3% 100%)',
            opacity: 0.24,
          }}
        />

        <motion.div
          className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.15)]"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.4 }}
        />

        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-white/70 shadow-[0_2px_10px_rgba(255,255,255,0.45)]"
          initial={{ left: 0 }}
          animate={{ left: `calc(${pct}% - 6px)` }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.4 }}
        />
      </div>

      <div className="flex justify-between">
        {['16', '18.5', '25', '30', '45'].map((v) => (
          <span key={v} className="text-[9px] text-white/70 tabular-nums">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

// Biometric chip
function BioChip({
  icon: Icon,
  value,
  unit,
}: {
  icon: React.ElementType;
  value: string | null;
  unit: string;
}) {
  if (!value) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-white/12 border border-white/12 rounded-xl px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
      <Icon className="w-3 h-3 text-white shrink-0" />
      <span className="text-[11px] font-semibold text-white tabular-nums">
        {value}
        <span className="font-normal text-white/90 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

// Shared AI/edit button
function PlanButton({
  label,
  onClick,
  tint,
  dataTestId,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  tint: 'blue' | 'rose' | 'emerald';
  dataTestId?: string;
}) {
  const cls = {
    blue: 'border-blue-200/20 bg-white/10 hover:bg-white/16 shadow-[0_8px_24px_rgba(29,78,216,0.22)] hover:shadow-[0_12px_30px_rgba(29,78,216,0.32)]',
    rose: 'border-rose-200/20 bg-white/10 hover:bg-white/16 shadow-[0_8px_24px_rgba(190,24,93,0.22)] hover:shadow-[0_12px_30px_rgba(190,24,93,0.32)]',
    emerald:
      'border-emerald-200/20 bg-white/10 hover:bg-white/16 shadow-[0_8px_24px_rgba(5,150,105,0.22)] hover:shadow-[0_12px_30px_rgba(5,150,105,0.32)]',
  }[tint];

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={dataTestId}
      className={`
        relative overflow-hidden group
        inline-flex items-center justify-center gap-1.5
        px-3 py-1.5
        rounded-full border backdrop-blur-md
        text-[11px] font-semibold text-white
        transition-all duration-200
        hover:scale-[1.03] active:scale-95
        ${cls}
      `}
    >
      <span className="absolute inset-0 rounded-full bg-white/10 blur-md opacity-60 pointer-events-none" />

      <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <span className="absolute top-0 left-[-75%] h-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] shimmer" />
      </span>

      <Sparkles className="w-3 h-3 relative z-10" />
      <span className="relative z-10 whitespace-nowrap">{label}</span>
    </button>
  );
}

// Helpers
function getImcData(text: string) {
  const { imc } = extractProfileMetrics(text);
  if (!imc || isNaN(imc)) return null;

  const label =
    imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Saludable' : imc < 30 ? 'Sobrepeso' : 'Obesidad';

  return { imc, label };
}

function getBio(text: string) {
  const metrics = extractProfileMetrics(text);

  return {
    weight: metrics.weightKg,
    height: metrics.heightM,
    age: metrics.age,
  };
}

// Main view
export default function LandingView() {
  const {
    setPerfilActivo: setActiveProfile,
    setDiaActivo: setActiveDay,
    setTab: setActiveTab,
    perfilesData: profilesData,
    dataVersions,
    setShowAdmin: setIsAdminOpen,
    setShowQuestionnaire: setIsQuestionnaireOpen,
    setQuestionnaireTargetProfile,
    geminiApiKey,
    geminiModel,
    setGeminiModel,
    refreshGeminiAvailability,
    notify,
    isDarkMode,
    setIsDarkMode,
  } = useDiet();
  const [checkingQuestionnaire, setCheckingQuestionnaire] = useState(false);

  const elReady = dataVersions.el === 'custom';
  const ellaReady = dataVersions.ella === 'custom';

  const sharedPlanStats = useMemo(() => {
    const norm = (v: string) =>
      v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const parse = (plan: Record<string, any>) => {
      const meals = new Set<string>();
      const ing = new Set<string>();

      Object.values(plan || {}).forEach((day: any) =>
        Object.values(day || {}).forEach((ms: any) => {
          if (!Array.isArray(ms)) return;

          ms.forEach((m: any) => {
            if (m?.nombre) meals.add(norm(String(m.nombre)));
            if (Array.isArray(m?.super)) {
              m.super.forEach((i: string) => ing.add(norm(String(i))));
            }
          });
        })
      );

      return { meals, ing };
    };

    const el = parse(profilesData.el.plan);
    const ella = parse(profilesData.ella.plan);
    const shared = [...el.meals].filter((name) => ella.meals.has(name)).length;
    const common = [...el.ing].filter((ingredient) => ella.ing.has(ingredient)).length;
    const union = new Set([...el.ing, ...ella.ing]).size;

    return { shared, pct: union > 0 ? Math.round((common / union) * 100) : 0 };
  }, [profilesData.el.plan, profilesData.ella.plan]);

  const elProfileText = buildProfileInspectionText(
    profilesData.el.perfil,
    profilesData.el.detallesPerfil
  );
  const ellaProfileText = buildProfileInspectionText(
    profilesData.ella.perfil,
    profilesData.ella.detallesPerfil
  );
  const elImc = getImcData(elProfileText);
  const ellaImc = getImcData(ellaProfileText);
  const elBio = getBio(elProfileText);
  const ellaBio = getBio(ellaProfileText);

  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  const openQuestionnaireWithCheck = async (target: 'el' | 'ella' | 'ambos') => {
    if (checkingQuestionnaire) return;

    setCheckingQuestionnaire(true);
    try {
      const status = await refreshGeminiAvailability({
        customApiKey: geminiApiKey,
        preferredModel: geminiModel,
        checkGeneration: true,
      });

      if (!status?.ok) {
        await notify(
          'Gemini no disponible',
          status?.error || 'No fue posible validar la API key actual de Gemini.'
        );
        return;
      }

      if (status.selectedModel && status.selectedModel !== geminiModel) {
        setGeminiModel(status.selectedModel);
      }

      setQuestionnaireTargetProfile(target);
      setIsQuestionnaireOpen(true);
    } finally {
      setCheckingQuestionnaire(false);
    }
  };

  const profiles = [
    {
      id: 'el' as const,
      label: 'El',
      emoji: '🧍‍♂️',
      ready: elReady,
      gradient: 'from-[#2563eb] via-[#1d4ed8] to-[#172554]',
      shadowHover: 'hover:shadow-[0_22px_60px_rgba(37,99,235,0.28)]',
      metaCls: 'text-blue-50/85',
      bgImg: '/images/hero.png',
      imc: elImc,
      bio: elBio,
      meta: profilesData.el.meta,
      onCard: () => {
        setActiveProfile('el');
        setActiveDay('Lunes');
        setActiveTab('plan');
      },
      onIA: () => {
        void openQuestionnaireWithCheck('el');
      },
    },
    {
      id: 'ella' as const,
      label: 'Ella',
      emoji: '🧍‍♀️',
      ready: ellaReady,
      gradient: 'from-[#ec4899] via-[#db2777] to-[#831843]',
      shadowHover: 'hover:shadow-[0_22px_60px_rgba(236,72,153,0.28)]',
      metaCls: 'text-rose-50/85',
      bgImg: '/images/meal-prep.png',
      imc: ellaImc,
      bio: ellaBio,
      meta: profilesData.ella.meta,
      onCard: () => {
        setActiveProfile('ella');
        setActiveDay('Lunes');
        setActiveTab('plan');
      },
      onIA: () => {
        void openQuestionnaireWithCheck('ella');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#f3f6fb_48%,_#edf7f1_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)]" />

        <div className="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute top-[10%] -right-20 w-[26rem] h-[26rem] rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[18%] w-[30rem] h-[30rem] rounded-full bg-violet-300/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148,163,184,0.10) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148,163,184,0.10) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_60%,_rgba(15,23,42,0.04)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_60%,_rgba(2,6,23,0.55)_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 pt-5 pb-4 px-1 sm:px-0 bg-transparent border-transparent shadow-none">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0 flex items-center gap-2"
          >
            <ChefHat className="w-4 h-4 text-emerald-500" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              INICIO
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="inline-flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/75 text-slate-600 text-[11px] font-bold hover:bg-white transition-all shrink-0 sm:px-3 sm:py-2 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-900"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            type="button"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
            <span className="sr-only">{isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsAdminOpen(true)}
            data-testid="landing-admin-button"
            className="group inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/75 px-3.5 py-2 text-[0px] font-bold hover:bg-white transition-all shrink-0 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900"
            title="Ajustes avanzados"
            type="button"
          >
            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-200 group-hover:rotate-45 transition-transform duration-300" />
            <span className="whitespace-nowrap text-[11px] text-slate-600 dark:text-slate-200">Ajustes avanzados</span>
            Opciones de respaldo y restauración
          </motion.button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-center pb-5"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-2 dark:text-slate-50">
            Nutrición inteligente,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>

          <p className="text-sm text-slate-500 max-w-md mx-auto mb-3 dark:text-slate-300">
            Elige tu plan individual o armen su lista de compras juntos de forma automática.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-white/70 shadow-[0_6px_18px_rgba(15,23,42,0.05)] text-[11px] font-medium text-slate-600 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-200">
              <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
              Plan editable
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-white/70 shadow-[0_6px_18px_rgba(15,23,42,0.05)] text-[11px] font-medium text-slate-600 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-200">
              <ShoppingBasket className="w-3.5 h-3.5 text-blue-500" />
              Lista de compras
            </div>
          </div>
        </motion.div>

        {/* Status banners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="space-y-2 pb-4"
        >
          {!elReady && !ellaReady && (
            <div className="rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-violet-50/85 dark:bg-violet-950/35 shadow-[0_10px_30px_rgba(139,92,246,0.08)] dark:shadow-[0_12px_30px_rgba(54,11,84,0.28)] px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 text-center leading-relaxed">
                Aún no hay planes generados.
                <br />
                Comienza con <Sparkles className="w-3 h-3 inline mx-1" />
                <span className="font-bold italic text-base text-violet-900 dark:text-violet-100">Personalizar mi plan</span>.
                <span className="block text-[11px] font-medium text-violet-600 dark:text-violet-300 mt-1">
                  También puedes personalizar ambos para obtener más comidas compartidas.
                </span>
              </p>
            </div>
          )}

          {elReady !== ellaReady && (
            <div className="rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-violet-50/85 dark:bg-violet-950/35 shadow-[0_10px_30px_rgba(139,92,246,0.08)] dark:shadow-[0_12px_30px_rgba(54,11,84,0.28)] px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 text-center leading-relaxed">
                <Sparkles className="w-3 h-3 inline mr-1" />
                <span className="font-bold italic text-base text-violet-900 dark:text-violet-100">{elReady ? 'El' : 'Ella'}</span>{' '}
                ya tiene un plan listo.
                <br />
                Ahora puedes generar el de{' '}
                <span className="font-bold italic text-base text-violet-900 dark:text-violet-100">{elReady ? 'Ella' : 'El'}</span>{' '}
                desde <Sparkles className="w-3 h-3 inline mx-1" />
                <span className="font-bold italic text-base text-violet-900 dark:text-violet-100">Personalizar mi plan</span>.
                <span className="block text-[11px] font-medium text-violet-600 dark:text-violet-300 mt-1">
                  O personaliza ambos para obtener más comidas compartidas.
                </span>
              </p>
            </div>
          )}

          {elReady && ellaReady && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/85 shadow-[0_10px_30px_rgba(16,185,129,0.08)] px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-emerald-700 text-center leading-relaxed">
                Los planes de <span className="font-bold italic text-base">El</span> y{' '}
                <span className="font-bold italic text-base">Ella</span> ya están listos.
                <span className="block text-[11px] font-medium text-emerald-600/80 mt-1">
                  Si quieres más comidas compartidas, puedes volver a personalizar ambos.
                </span>
              </p>
            </div>
          )}
        </motion.div>

        {/* Profile cards */}
        <div className="flex flex-col gap-4 pb-10">
          {/* Individual profiles */}
          <div className="grid grid-cols-2 gap-4 items-stretch">
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 370,
                  damping: 26,
                  delay: 0.2 + i * 0.06,
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                role="button"
                tabIndex={0}
                onClick={p.onCard}
                onKeyDown={onKey(p.onCard)}
                data-testid={`landing-profile-${p.id}-card`}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.gradient} shadow-[0_18px_44px_rgba(15,23,42,0.16)] hover:shadow-[0_24px_56px_rgba(15,23,42,0.2)] ${p.shadowHover} transition-all duration-300 cursor-pointer flex flex-col ring-1 ring-white/10 min-h-[300px] sm:min-h-[340px]`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.07] mix-blend-luminosity"
                  style={{ backgroundImage: `url('${p.bgImg}')` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_42%)] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {p.ready && (
                  <div className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/18 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                    Listo
                  </div>
                )}

                <div className="relative z-10 p-4 sm:p-5 flex flex-col flex-1 gap-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/14 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0 text-[22px] backdrop-blur-sm">
                      {p.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-none tracking-tight drop-shadow-sm">
                          {p.label}
                        </h3>

                        {(p.bio.weight || p.bio.height || p.bio.age) && (
                          <div className="flex flex-wrap gap-1.5">
                            <BioChip icon={Scale} value={p.bio.weight} unit="kg" />
                            <BioChip icon={Ruler} value={p.bio.height} unit="m" />
                            <BioChip icon={Calendar} value={p.bio.age} unit="años" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/18" />

                  <div className="flex flex-col gap-3 flex-1">
                    {p.imc && <ImcBar imc={p.imc.imc} label={p.imc.label} />}

                    <div className="min-h-[48px] sm:min-h-[60px]">
                      <p className={`text-xs sm:text-sm ${p.metaCls} font-medium leading-relaxed text-white/90 line-clamp-3`}>
                        {p.meta}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <PlanButton
                      label={p.ready ? 'Actualizar mi plan' : 'Personalizar mi plan'}
                      tint={p.id === 'el' ? 'blue' : 'rose'}
                      dataTestId={`landing-customize-${p.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        p.onIA();
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Combined view */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 370, damping: 26, delay: 0.34 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveProfile('ambos');
              setActiveDay('Lunes');
              setActiveTab('plan');
            }}
            data-testid="landing-profile-ambos-card"
            onKeyDown={onKey(() => {
              setActiveProfile('ambos');
              setActiveDay('Lunes');
              setActiveTab('plan');
            })}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#0f766e] shadow-[0_18px_44px_rgba(15,23,42,0.16)] hover:shadow-[0_24px_56px_rgba(15,23,42,0.2)] hover:shadow-[0_22px_60px_rgba(16,185,129,0.24)] transition-all duration-300 cursor-pointer ring-1 ring-white/10"
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.09] mix-blend-luminosity"
              style={{ backgroundImage: "url('/images/hero.png')" }}
            />
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.05] mix-blend-overlay"
              style={{ backgroundImage: "url('/images/meal-prep.png')" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_44%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-5 items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/14 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-[22px] backdrop-blur-sm shrink-0">
                    👫
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm whitespace-nowrap">
                    Ambos
                  </h3>
                </div>

                <p className="text-sm text-white/90 font-medium leading-relaxed max-w-xl">
                  Combina los planes de ambos en una sola vista y genera una lista de compras conjunta con un clic.
                </p>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-3">
                <PlanButton
                  label={elReady && ellaReady ? 'Actualizar mi plan' : 'Personalizar mi plan'}
                  tint="emerald"
                  dataTestId="landing-customize-ambos"
                  onClick={(e) => {
                    e.stopPropagation();
                    void openQuestionnaireWithCheck('ambos');
                  }}
                />

                <div className="flex flex-wrap lg:flex-nowrap justify-start lg:justify-end gap-3">
                  {[
                    { val: String(sharedPlanStats.shared), label: 'Compartidas', sub: 'comidas' },
                    { val: `${sharedPlanStats.pct}%`, label: 'Sinergia', sub: 'ingredientes' },
                  ].map(({ val, label, sub }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center bg-white/10 border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.08)] rounded-2xl px-4 py-3 min-w-[96px] backdrop-blur-sm"
                    >
                      <span className="text-[9px] text-emerald-50/70 font-bold uppercase tracking-widest mb-1">
                        {label}
                      </span>
                      <span className="text-2xl font-bold text-white tabular-nums leading-none drop-shadow-sm">
                        {val}
                      </span>
                      <span className="text-[9px] text-emerald-50/55 mt-0.5">{sub}</span>
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
