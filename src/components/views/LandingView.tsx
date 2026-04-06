import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Sparkles, Scale, Ruler, Calendar, ChefHat, ShoppingBasket } from 'lucide-react';
import { useDiet } from '../../context/DietContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const IMC_MIN = 16;
const IMC_MAX = 45;

// ─── IMC Horizontal Bar ───────────────────────────────────────────────────────
function ImcBar({ imc, label }: { imc: number; label: string }) {
  const pct = Math.min(100, Math.max(0, ((imc - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100));
  const barColor =
    imc < 18.5 ? '#38bdf8' : imc < 25 ? '#34d399' : imc < 30 ? '#fbbf24' : '#f87171';
  const badgeCls =
    imc < 18.5
      ? 'bg-sky-400/20 text-sky-100'
      : imc < 25
        ? 'bg-emerald-400/20 text-emerald-100'
        : imc < 30
          ? 'bg-amber-400/20 text-amber-100'
          : 'bg-rose-400/20 text-rose-100';

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">IMC</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tabular-nums">{imc.toFixed(1)}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {label}
          </span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full overflow-hidden bg-white/10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #38bdf8 0% 8.6%, #34d399 8.6% 31%, #fbbf24 31% 48.3%, #f87171 48.3% 100%)',
            opacity: 0.22,
          }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.4 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow"
          initial={{ left: 0 }}
          animate={{ left: `calc(${pct}% - 5px)` }}
          transition={{ duration: 0.85, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
      <div className="flex justify-between">
        {['16', '18.5', '25', '30', '45'].map((v) => (
          <span key={v} className="text-[9px] text-white/20 tabular-nums">{v}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Biometric chip ───────────────────────────────────────────────────────────
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
    <div className="inline-flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
      <Icon className="w-3 h-3 text-white/40 shrink-0" />
      <span className="text-[11px] font-semibold text-white/90 tabular-nums">
        {value}
        <span className="font-normal text-white/45 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

// ─── Unified IA / Editar button ───────────────────────────────────────────────
// Always uses the same pill style regardless of ready state
function PlanButton({
  label,
  onClick,
  tint, // 'blue' | 'rose' | 'emerald'
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  tint: 'blue' | 'rose' | 'emerald';
}) {
  const cls = {
    blue: 'bg-white/20 hover:bg-white/30 border-white/30 text-white',
    rose: 'bg-white/20 hover:bg-white/30 border-white/30 text-white',
    emerald: 'bg-white/20 hover:bg-white/30 border-white/30 text-white',
  }[tint];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm text-[11px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${cls}`}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingView() {
  const {
    setPerfilActivo,
    setDiaActivo,
    setTab,
    perfilesData,
    dataVersions,
    setShowAdmin,
    setShowQuestionnaire,
    setQuestionnaireTargetProfile,
  } = useDiet();

  const elReady = dataVersions.el === 'custom';
  const ellaReady = dataVersions.ella === 'custom';

  const getImcData = (text: string) => {
    const m = text.match(/IMC\s*[:\-]?\s*([\d]+(?:[.,]\d+)?)/i);
    const imc = m ? Number(m[1].replace(',', '.')) : null;
    if (!imc || isNaN(imc)) return null;
    const label =
      imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Saludable' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
    return { imc, label };
  };

  const getBio = (text: string) => ({
    weight: text.match(/(\d+)\s*kg/i)?.[1] ?? null,
    height: text.match(/(\d+(?:\.\d+)?)\s*m(?!\w)/i)?.[1] ?? null,
    age: text.match(/(\d+)\s*años/i)?.[1] ?? null,
  });

  const ambos = useMemo(() => {
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
            if (Array.isArray(m?.super)) m.super.forEach((i: string) => ing.add(norm(String(i))));
          });
        })
      );
      return { meals, ing };
    };
    const el = parse(perfilesData.el.plan);
    const ella = parse(perfilesData.ella.plan);
    const shared = [...el.meals].filter((n) => ella.meals.has(n)).length;
    const common = [...el.ing].filter((i) => ella.ing.has(i)).length;
    const union = new Set([...el.ing, ...ella.ing]).size;
    return { shared, pct: union > 0 ? Math.round((common / union) * 100) : 0 };
  }, [perfilesData.el.plan, perfilesData.ella.plan]);

  const elImc = getImcData(perfilesData.el.perfil);
  const ellaImc = getImcData(perfilesData.ella.perfil);
  const elBio = getBio(perfilesData.el.perfil);
  const ellaBio = getBio(perfilesData.ella.perfil);

  const onKey = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const profiles = [
    {
      id: 'el' as const,
      label: 'El',
      emoji: '🧍‍♂️',
      ready: elReady,
      gradient: 'from-blue-600 via-blue-700 to-indigo-800',
      shadowHover: 'hover:shadow-blue-500/20',
      metaCls: 'text-blue-100/75',
      bgImg: '/images/hero.png',
      imc: elImc,
      bio: elBio,
      meta: perfilesData.el.meta,
      onCard: () => { setPerfilActivo('el'); setDiaActivo('Lunes'); setTab('plan'); },
      onIA: () => { setQuestionnaireTargetProfile('el'); setShowQuestionnaire(true); },
    },
    {
      id: 'ella' as const,
      label: 'Ella',
      emoji: '🧍‍♀️',
      ready: ellaReady,
      gradient: 'from-rose-500 via-rose-600 to-pink-700',
      shadowHover: 'hover:shadow-rose-500/20',
      metaCls: 'text-rose-100/75',
      bgImg: '/images/meal-prep.png',
      imc: ellaImc,
      bio: ellaBio,
      meta: perfilesData.ella.meta,
      onCard: () => { setPerfilActivo('ella'); setDiaActivo('Lunes'); setTab('plan'); },
      onIA: () => { setQuestionnaireTargetProfile('ella'); setShowQuestionnaire(true); },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Ambient BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-emerald-50/30" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-emerald-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        {/* Top bar */}
        <div className="flex items-center justify-between pt-5 pb-4">
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-200/60"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              Bienvenido a su plan
            </span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowAdmin(true)}
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/60 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
          >
            <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
            Respalda/Exporta tu plan
          </motion.button>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-center pb-5"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
            Nutrición inteligente,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-3">
            Elige tu plan individual o armen su lista de compras juntos de forma automática.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/50 text-[11px] font-medium text-slate-600">
              <ChefHat className="w-3.5 h-3.5 text-emerald-500" /> Plan editable
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/50 text-[11px] font-medium text-slate-600">
              <ShoppingBasket className="w-3.5 h-3.5 text-blue-500" /> Lista de compras
            </div>
          </div>
        </motion.div>

        {/* Banners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.14 }}
          className="space-y-2 pb-4"
        >
          <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-2.5 text-center">
            <p className="text-xs text-sky-800 font-semibold">
              Selecciona un perfil para personalizar tu plan con IA.
            </p>
          </div>
          {elReady !== ellaReady && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs text-violet-900 font-semibold">
                {elReady ? '¡Plan de El listo! ¿Personalizamos el de Ella?' : '¡Plan de Ella listo! ¿Personalizamos el de El?'}
              </p>
              <button
                type="button"
                onClick={() => { setQuestionnaireTargetProfile(elReady ? 'ella' : 'el'); setShowQuestionnaire(true); }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generar
              </button>
            </div>
          )}
          {elReady && ellaReady && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-center">
              <p className="text-xs text-emerald-800 font-semibold">
                ✅ ¡Todo listo! Los planes personalizados para ambos han sido generados.
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Cards ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 pb-10">

          {/* El + Ella */}
          <div className="grid grid-cols-2 gap-4" style={{ alignItems: 'stretch' }}>
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 370, damping: 26, delay: 0.2 + i * 0.06 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                role="button"
                tabIndex={0}
                onClick={p.onCard}
                onKeyDown={onKey(p.onCard)}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.gradient} shadow-lg hover:shadow-xl ${p.shadowHover} transition-all duration-300 cursor-pointer flex flex-col`}
              >
                {/* BG texture */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.07] mix-blend-luminosity"
                  style={{ backgroundImage: `url('${p.bgImg}')` }}
                />
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Ready badge */}
                {p.ready && (
                  <div className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-[10px] font-bold">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Listo
                  </div>
                )}

                {/* ── Card body ──────────────────────────────────────────── */}
                <div className="relative z-10 p-5 flex flex-col flex-1 gap-4">

                  {/* Row 1: avatar + name + biometrics */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-2xl">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-white leading-none mb-1">{p.label}</h3>
                      {(p.bio.weight || p.bio.height || p.bio.age) && (
                        <div className="flex flex-wrap gap-1.5">
                          <BioChip icon={Scale} value={p.bio.weight} unit="kg" />
                          <BioChip icon={Ruler} value={p.bio.height} unit="m" />
                          <BioChip icon={Calendar} value={p.bio.age} unit="años" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10" />

                  {/* Row 2: IMC bar */}
                  {p.imc && <ImcBar imc={p.imc.imc} label={p.imc.label} />}

                  {/* Row 3: meta goal */}
                  <p className={`text-xs ${p.metaCls} font-medium leading-relaxed line-clamp-3 flex-1`}>
                    {p.meta}
                  </p>

                  {/* Row 4: CTA button — always same style */}
                  <PlanButton
                    label={p.ready ? 'Actualizar mi plan' : 'Personalizar mi plan'}
                    tint={p.id === 'el' ? 'blue' : 'rose'}
                    onClick={(e) => { e.stopPropagation(); p.onIA(); }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Ambos ───────────────────────────────────────────────────────── */}
          {/* Click on card body → view ambos profile
              Click on button → open ambos questionnaire */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 370, damping: 26, delay: 0.34 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            role="button"
            tabIndex={0}
            onClick={() => { setPerfilActivo('ambos'); setDiaActivo('Lunes'); setTab('plan'); }}
            onKeyDown={onKey(() => { setPerfilActivo('ambos'); setDiaActivo('Lunes'); setTab('plan'); })}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer"
          >
            {/* Main page hero image as BG (blended) */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.09] mix-blend-luminosity"
              style={{ backgroundImage: "url('/images/hero.png')" }}
            />
            {/* + meal-prep texture blended on top */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.05] mix-blend-overlay"
              style={{ backgroundImage: "url('/images/meal-prep.png')" }}
            />
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center gap-5">

              {/* Left: avatar + name + button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl">
                  👫
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-2xl font-bold text-white leading-none">Ambos</h3>
                  {/* Button always → questionnaire, stopPropagation prevents card nav */}
                  <PlanButton
                    label={elReady && ellaReady ? 'Actualizar mi plan' : 'Personalizar mi plan'}
                    tint="emerald"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuestionnaireTargetProfile('ambos');
                      setShowQuestionnaire(true);
                    }}
                  />
                </div>
              </div>

              {/* Center: description */}
              <p className="flex-1 text-xs text-emerald-100/75 font-medium leading-relaxed">
                Combina los planes de ambos en una sola vista y genera una lista de compras
                conjunta con un clic.
              </p>

              {/* Right: stats */}
              <div className="flex gap-3 shrink-0">
                {[
                  { val: String(ambos.shared), label: 'Compartidas', sub: 'comidas' },
                  { val: `${ambos.pct}%`, label: 'Sinergia', sub: 'ingredientes' },
                ].map(({ val, label, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center bg-white/10 border border-white/15 rounded-2xl px-4 py-3 min-w-[76px]"
                  >
                    <span className="text-[9px] text-emerald-100/45 font-bold uppercase tracking-widest mb-1">
                      {label}
                    </span>
                    <span className="text-2xl font-bold text-white tabular-nums leading-none">
                      {val}
                    </span>
                    <span className="text-[9px] text-emerald-100/35 mt-0.5">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}