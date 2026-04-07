import { motion } from 'framer-motion';
import { Flame, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { estimateDailyCaloriesFromObjectives, estimateDailyMacroTargetsFromObjectives } from '../../utils/nutrition';

const STATUS_LABELS = {
  low: 'Lejos de meta',
  near: 'Buen rango',
  high: 'Por arriba',
} as const;

type StatusKey = keyof typeof STATUS_LABELS;

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function CalorieMonitoringView() {
  const { perfilActivo, perfilesData, selecciones, diasDisponibles, isAmbos, diaActivo } = useDiet();

  const profileIds: Array<'el' | 'ella'> = isAmbos || perfilActivo === 'ambos'
    ? ['el', 'ella']
    : [perfilActivo === 'ella' ? 'ella' : 'el'];

  const metaCaloricaTotal = profileIds.reduce((acc, id) => {
    const profile = perfilesData[id];
    return acc + (profile.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(profile));
  }, 0);

  const macroTargets = profileIds.reduce((acc, id) => {
    const profile = perfilesData[id];
    const targets = estimateDailyMacroTargetsFromObjectives(profile);
    return {
      proteinG: acc.proteinG + targets.proteinG,
      fatG: acc.fatG + targets.fatG,
    };
  }, { proteinG: 0, fatG: 0 });

  const selectedDayTotals = profileIds.reduce((accProfiles, profileId) => {
    const dayPlan = perfilesData[profileId]?.plan?.[diaActivo] || {};
    const totals = Object.entries(dayPlan).reduce((acc, [momentoKey, meals]) => {
      const selected = (meals || []).find((meal) => selecciones[`${profileId}-${diaActivo}-${momentoKey}-${meal.nombre}`]);
      return {
        kcal: acc.kcal + (selected?.caloriasKcal || 0),
        proteinG: acc.proteinG + (selected?.proteinaG || 0),
        fatG: acc.fatG + (selected?.grasasG || 0),
      };
    }, { kcal: 0, proteinG: 0, fatG: 0 });

    return {
      kcal: accProfiles.kcal + totals.kcal,
      proteinG: accProfiles.proteinG + totals.proteinG,
      fatG: accProfiles.fatG + totals.fatG,
    };
  }, { kcal: 0, proteinG: 0, fatG: 0 });

  const daySummaries: Array<{ dia: string; kcal: number; ratio: number; delta: number; status: StatusKey }> = diasDisponibles.map((dia) => {
    const kcal = profileIds.reduce((accProfiles, profileId) => {
      const dayPlan = perfilesData[profileId]?.plan?.[dia] || {};
      const dayKcal = Object.entries(dayPlan).reduce((acc, [momentoKey, meals]) => {
        const selected = (meals || []).find((meal) => selecciones[`${profileId}-${dia}-${momentoKey}-${meal.nombre}`]);
        return acc + (selected?.caloriasKcal || 0);
      }, 0);
      return accProfiles + dayKcal;
    }, 0);

    const ratio = metaCaloricaTotal > 0 ? kcal / metaCaloricaTotal : 0;
    const delta = kcal - metaCaloricaTotal;
    const status: StatusKey = ratio < 0.85 ? 'low' : ratio <= 1.1 ? 'near' : 'high';

    return { dia, kcal, ratio, delta, status };
  });

  const activeDaySummary = daySummaries.find((item) => item.dia === diaActivo) || daySummaries[0];
  const adherenceDays = daySummaries.filter((item) => item.status === 'near').length;
  const weeklyAverage = daySummaries.length
    ? Math.round(daySummaries.reduce((acc, item) => acc + item.kcal, 0) / daySummaries.length)
    : 0;
  const bestDay = daySummaries.reduce((best, item) => {
    if (!best) return item;
    return Math.abs(item.delta) < Math.abs(best.delta) ? item : best;
  }, daySummaries[0]);

  const palette = isAmbos || perfilActivo === 'ambos'
    ? {
        hero: 'from-emerald-500 via-teal-500 to-cyan-500',
        soft: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        bar: 'bg-emerald-500',
        mutedBar: 'bg-emerald-300',
        accent: 'text-emerald-700',
      }
    : perfilActivo === 'ella'
      ? {
          hero: 'from-rose-500 via-pink-500 to-fuchsia-500',
          soft: 'bg-rose-50 border-rose-200 text-rose-900',
          bar: 'bg-rose-500',
          mutedBar: 'bg-rose-300',
          accent: 'text-rose-700',
        }
      : {
          hero: 'from-blue-500 via-indigo-500 to-cyan-500',
          soft: 'bg-blue-50 border-blue-200 text-blue-900',
          bar: 'bg-blue-500',
          mutedBar: 'bg-blue-300',
          accent: 'text-blue-700',
        };

  const statusPills: Record<StatusKey, string> = {
    low: 'bg-amber-50 border-amber-200 text-amber-700',
    near: `${palette.soft}`,
    high: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const MetricCard = ({
    label,
    value,
    target,
    unit,
  }: {
    label: string;
    value: number;
    target: number;
    unit: string;
  }) => {
    const percent = target > 0 ? clampPercent((value / target) * 100) : 0;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-extrabold">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900 leading-none">
              {value}
              <span className="text-sm font-bold text-slate-500 ml-1">{unit}</span>
            </p>
          </div>
          <div className={`rounded-2xl px-2.5 py-1 text-[11px] font-bold border ${statusPills[percent > 110 ? 'high' : percent >= 85 ? 'near' : 'low']}`}>
            {percent}%
          </div>
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${percent >= 85 ? palette.bar : palette.mutedBar}`}
            style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Meta: {target}{unit}
        </p>
      </div>
    );
  };

  return (
    <motion.div
      key="calorias"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="space-y-4"
    >
      <section className={`rounded-[28px] bg-gradient-to-br ${palette.hero} p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-extrabold">Calorias del dia</p>
            <h2 className="mt-2 text-3xl font-black leading-none">{activeDaySummary?.kcal || 0} kcal</h2>
            <p className="mt-2 text-sm text-white/85 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              Meta diaria: {metaCaloricaTotal} kcal
            </p>
          </div>

          <div className="rounded-2xl bg-white/14 border border-white/15 px-3 py-2 backdrop-blur-sm text-right min-w-[112px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">{diaActivo}</p>
            <p className="mt-1 text-lg font-black">
              {activeDaySummary?.delta > 0 ? '+' : ''}{activeDaySummary?.delta || 0}
            </p>
            <p className="text-[11px] text-white/70">
              {activeDaySummary?.delta === 0 ? 'Justo en meta' : activeDaySummary?.delta > 0 ? 'Sobre meta' : 'Debajo de meta'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white/12 px-3 py-3 border border-white/12 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">Promedio</p>
            <p className="mt-1 text-lg font-black">{weeklyAverage}</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-3 border border-white/12 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">En rango</p>
            <p className="mt-1 text-lg font-black">{adherenceDays}/7</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-3 border border-white/12 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">Mejor dia</p>
            <p className="mt-1 text-lg font-black truncate">{bestDay?.dia || '-'}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <MetricCard label="Calorias" value={selectedDayTotals.kcal} target={metaCaloricaTotal} unit="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Proteina" value={selectedDayTotals.proteinG} target={macroTargets.proteinG} unit="g" />
          <MetricCard label="Grasas" value={selectedDayTotals.fatG} target={macroTargets.fatG} unit="g" />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Semana en un vistazo</h3>
            <p className="text-xs text-slate-500 mt-1">Desliza para comparar tus dias.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            {adherenceDays} dias en rango
          </div>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {daySummaries.map((item) => {
            const percent = clampPercent(item.ratio * 100);
            const isActive = item.dia === diaActivo;
            return (
              <div
                key={item.dia}
                className={`min-w-[180px] snap-start rounded-[24px] border p-4 shadow-sm ${
                  isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{item.dia}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${isActive ? 'border-white/20 bg-white/10 text-white' : statusPills[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <p className={`mt-3 text-2xl font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>{item.kcal}</p>
                <p className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-500'}`}>kcal seleccionadas</p>

                <div className={`mt-4 h-2.5 rounded-full overflow-hidden ${isActive ? 'bg-white/15' : 'bg-white'}`}>
                  <div
                    className={`h-full rounded-full ${isActive ? 'bg-white' : item.status === 'near' ? palette.bar : item.status === 'high' ? 'bg-rose-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
                  />
                </div>

                <div className={`mt-3 flex items-center justify-between text-xs ${isActive ? 'text-white/75' : 'text-slate-500'}`}>
                  <span>{percent}% de meta</span>
                  <span className="inline-flex items-center gap-1">
                    {item.delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {item.delta > 0 ? '+' : ''}{item.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${palette.accent}`} />
          <h3 className="text-sm font-black text-slate-900">Lectura rapida</h3>
        </div>

        <div className="mt-3 space-y-2.5 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-3">
            Hoy vas en <span className="font-black text-slate-900">{clampPercent((selectedDayTotals.kcal / Math.max(metaCaloricaTotal, 1)) * 100)}%</span> de tu meta.
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-3">
            Tu día más equilibrado hasta ahora es <span className="font-black text-slate-900">{bestDay?.dia || '-'}</span>.
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-3">
            Esta semana promedias <span className="font-black text-slate-900">{weeklyAverage} kcal</span> por día seleccionado.
          </div>
        </div>
      </section>
    </motion.div>
  );
}
