import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Flame, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { estimateDailyCaloriesFromObjectives, estimateDailyMacroTargetsFromObjectives } from '../../utils/nutrition';
import { getAccentColors, getMonitoringPalette } from '../../utils/theme';
import { getProfileLabel } from '../../utils/profileLabels';

const STATUS_LABELS = {
  low: 'Debajo',
  near: 'En rango',
  high: 'Arriba',
} as const;

type StatusKey = keyof typeof STATUS_LABELS;
type ProfileId = 'el' | 'ella';

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function CalorieMonitoringView() {
  const {
    perfilActivo,
    perfilesData,
    profileLabels,
    selecciones,
    diasDisponibles,
    isAmbos,
    diaActivo,
    setDiaActivo,
    isDarkMode,
  } = useDiet();

  const profileIds: ProfileId[] = isAmbos || perfilActivo === 'ambos'
    ? ['el', 'ella']
    : [perfilActivo === 'ella' ? 'ella' : 'el'];
  const [expandedProfileId, setExpandedProfileId] = React.useState<ProfileId>('el');
  const isCombined = profileIds.length > 1;

  const palette = getMonitoringPalette(perfilActivo ?? (isAmbos ? 'ambos' : 'el'), isDarkMode);
  const getLabel = React.useCallback((profileId: ProfileId) => getProfileLabel(profileLabels, profileId), [profileLabels]);
  const dayScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const dayButtonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  React.useEffect(() => {
    const container = dayScrollerRef.current;
    const activeButton = dayButtonRefs.current[diaActivo];

    if (!container || !activeButton) return;

    const nextScrollLeft =
      activeButton.offsetLeft - container.clientWidth / 2 + activeButton.clientWidth / 2;

    container.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: 'smooth',
    });
  }, [diaActivo]);

  const getProfileMetrics = React.useCallback((profileId: ProfileId) => {
    const profile = perfilesData[profileId];
    const calorieTarget = profile.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(profile);
    const macroTargets = estimateDailyMacroTargetsFromObjectives(profile);

    const totalsForDay = (day: string) => {
      const dayPlan = profile?.plan?.[day] || {};
      return Object.entries(dayPlan).reduce((acc, [momentoKey, meals]) => {
        const selected = (meals || []).find((meal) => selecciones[`${profileId}-${day}-${momentoKey}-${meal.nombre}`]);
        return {
          kcal: acc.kcal + (selected?.caloriasKcal || 0),
          proteinG: acc.proteinG + (selected?.proteinaG || 0),
          fatG: acc.fatG + (selected?.grasasG || 0),
        };
      }, { kcal: 0, proteinG: 0, fatG: 0 });
    };

    const daySummaries = diasDisponibles.map((dia) => {
      const totals = totalsForDay(dia);
      const ratio = calorieTarget > 0 ? totals.kcal / calorieTarget : 0;
      const delta = totals.kcal - calorieTarget;
      const status: StatusKey = ratio < 0.85 ? 'low' : ratio <= 1.1 ? 'near' : 'high';

      return { dia, ...totals, ratio, delta, status };
    });

    const selectedDayTotals = totalsForDay(diaActivo);
    const activeDaySummary = daySummaries.find((item) => item.dia === diaActivo) || daySummaries[0];
    const adherenceDays = daySummaries.filter((item) => item.status === 'near').length;
    const weeklyAverage = daySummaries.length
      ? Math.round(daySummaries.reduce((acc, item) => acc + item.kcal, 0) / daySummaries.length)
      : 0;
    const bestDay = daySummaries.reduce((best, item) => {
      if (!best) return item;
      return Math.abs(item.delta) < Math.abs(best.delta) ? item : best;
    }, daySummaries[0]);

    return {
      profile,
      calorieTarget,
      macroTargets,
      selectedDayTotals,
      activeDaySummary,
      daySummaries,
      adherenceDays,
      weeklyAverage,
      bestDay,
    };
  }, [diaActivo, diasDisponibles, perfilesData, selecciones]);

  const metricsByProfile = React.useMemo(() => ({
    el: getProfileMetrics('el'),
    ella: getProfileMetrics('ella'),
  }), [getProfileMetrics]);

  const statusPills: Record<StatusKey, string> = {
    low: isDarkMode ? 'bg-amber-950/60 text-amber-200' : 'bg-amber-50 text-amber-700',
    near: isDarkMode ? 'bg-emerald-950/60 text-emerald-200' : 'bg-emerald-50 text-emerald-700',
    high: isDarkMode ? 'bg-rose-950/60 text-rose-200' : 'bg-rose-50 text-rose-700',
  };

  const MetricCard = ({
    label,
    value,
    target,
    unit,
    accent,
  }: {
    label: string;
    value: number;
    target: number;
    unit: string;
    accent: ReturnType<typeof getAccentColors>;
  }) => {
    const percent = target > 0 ? clampPercent((value / target) * 100) : 0;
    const status: StatusKey = percent > 110 ? 'high' : percent >= 85 ? 'near' : 'low';

    return (
      <div className={`rounded-[24px] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[11px] uppercase tracking-[0.18em] font-extrabold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
            <p className={`mt-2 text-2xl font-black leading-none ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {value}
              <span className={`text-sm font-bold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>
            </p>
          </div>
          <div className={`rounded-2xl px-2.5 py-1 text-[11px] font-bold ${statusPills[status]}`}>
            {percent}%
          </div>
        </div>

        <div className={`mt-4 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${accent.progressFill}`}
            style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
          />
        </div>

        <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Meta: {target} {unit}
        </p>
      </div>
    );
  };

  const ProfilePanel = ({ profileId }: { profileId: ProfileId }) => {
    const accent = getAccentColors(profileId, isDarkMode);
    const metrics = metricsByProfile[profileId];
    const active = metrics.activeDaySummary;
    const dayPercent = clampPercent(active.ratio * 100);

    return (
      <section className="space-y-3">
        <div className={`rounded-[28px] bg-gradient-to-br ${accent.bgGradient} p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-extrabold">
                {getLabel(profileId)}
              </p>
              <h2 className="mt-2 text-3xl font-black leading-none">{active.kcal} kcal</h2>
              <p className="mt-2 text-sm text-white/85 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Meta diaria: {metrics.calorieTarget} kcal
              </p>
            </div>

            <div className="rounded-2xl bg-white/14 px-3 py-2 backdrop-blur-sm text-right min-w-[104px]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-bold">{diaActivo}</p>
              <p className="mt-1 text-lg font-black">{dayPercent}%</p>
              <p className="text-[11px] text-white/70">
                {active.delta > 0 ? '+' : ''}{active.delta} kcal
              </p>
            </div>
          </div>

          <div className="mt-4 h-2.5 rounded-full overflow-hidden bg-white/15">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(8, Math.min(100, dayPercent))}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-white/12 px-3 py-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">Promedio</p>
              <p className="mt-1 text-lg font-black">{metrics.weeklyAverage}</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-3 py-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">Rango</p>
              <p className="mt-1 text-lg font-black">{metrics.adherenceDays}/7</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-3 py-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/65 font-bold">Mejor</p>
              <p className="mt-1 text-lg font-black truncate">{metrics.bestDay?.dia || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MetricCard label="Calorías" value={metrics.selectedDayTotals.kcal} target={metrics.calorieTarget} unit="kcal" accent={accent} />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Proteína" value={metrics.selectedDayTotals.proteinG} target={metrics.macroTargets.proteinG} unit="g" accent={accent} />
            <MetricCard label="Grasas" value={metrics.selectedDayTotals.fatG} target={metrics.macroTargets.fatG} unit="g" accent={accent} />
          </div>
        </div>

        <div className={`rounded-[24px] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${accent.text}`} />
            <h3 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Semana de {getLabel(profileId)}</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {metrics.daySummaries.map((item) => (
              <button
                key={`${profileId}-${item.dia}`}
                type="button"
                onClick={() => setDiaActivo(item.dia)}
                className={`rounded-2xl p-3 text-left transition active:scale-[0.98] ${
                  item.dia === diaActivo
                    ? `${accent.btnActive} shadow-sm`
                    : isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black">{item.dia.slice(0, 3)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.dia === diaActivo ? 'bg-white/15 text-white' : statusPills[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className="mt-2 text-lg font-black">{item.kcal}</p>
                <p className={`text-[11px] ${item.dia === diaActivo ? 'text-white/75' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.delta > 0 ? <TrendingUp className="mr-1 inline h-3 w-3" /> : <TrendingDown className="mr-1 inline h-3 w-3" />}
                  {item.delta > 0 ? '+' : ''}{item.delta} kcal
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
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
      <section className={`rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Kcal por día</h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Toca un día para revisar sus metas.
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-600'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Individual
          </div>
        </div>

        <div
          ref={dayScrollerRef}
          className="mt-4 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {diasDisponibles.map((dia) => {
            const active = dia === diaActivo;
            return (
              <button
                key={dia}
                ref={(element) => {
                  dayButtonRefs.current[dia] = element;
                }}
                type="button"
                onClick={() => setDiaActivo(dia)}
                className={`inline-flex min-w-[92px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.98] ${
                  active
                    ? `bg-gradient-to-br ${palette.hero} text-white shadow-sm`
                    : isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                {dia.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </section>

      {isCombined ? (
        <section className={`rounded-[28px] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Comparativa del día
            </h3>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {diaActivo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['el', 'ella'] as const).map((profileId) => {
              const metrics = metricsByProfile[profileId];
              const accent = getAccentColors(profileId, isDarkMode);
              const active = metrics.activeDaySummary;
              const percent = clampPercent(active.ratio * 100);
              const selected = expandedProfileId === profileId;

              return (
                <button
                  key={`compare-${profileId}`}
                  type="button"
                  onClick={() => setExpandedProfileId(profileId)}
                  className={`rounded-[24px] p-3 text-left transition active:scale-[0.98] ${
                    selected
                      ? `bg-gradient-to-br ${accent.bgGradient} text-white shadow-sm`
                      : isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]">
                      {getLabel(profileId)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selected ? 'bg-white/15 text-white' : statusPills[active.status]}`}>
                      {percent}%
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black leading-none">{active.kcal}</p>
                  <p className={`mt-1 text-xs font-bold ${selected ? 'text-white/75' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    de {metrics.calorieTarget} kcal
                  </p>
                  <div className={`mt-3 h-2 rounded-full overflow-hidden ${selected ? 'bg-white/18' : isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div
                      className={`h-full rounded-full ${selected ? 'bg-white' : `bg-gradient-to-r ${accent.progressFill}`}`}
                      style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
                    />
                  </div>
                  <p className={`mt-2 text-[11px] font-black ${selected ? 'text-white' : accent.text}`}>
                    Ver detalle
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="space-y-4">
        {(isCombined ? [expandedProfileId] : profileIds).map((profileId) => (
          <ProfilePanel key={profileId} profileId={profileId} />
        ))}
      </div>
    </motion.div>
  );
}
