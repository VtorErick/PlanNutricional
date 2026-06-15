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
      <div className={`rounded-[18px] border p-3 shadow-[0_6px_16px_rgba(15,23,42,0.035)] ${isDarkMode ? 'border-slate-800 bg-slate-950/92' : 'border-slate-100 bg-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.16em] font-extrabold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
            <p className={`mt-1.5 text-xl font-black leading-none ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              {value}
              <span className={`ml-1 text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>
            </p>
          </div>
          <div className={`rounded-2xl px-2 py-0.5 text-[10px] font-bold ${statusPills[status]}`}>
            {percent}%
          </div>
        </div>

        <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${accent.progressFill}`}
            style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
          />
        </div>

        <p className={`mt-1.5 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
    const deltaLabel = `${active.delta > 0 ? '+' : ''}${active.delta} kcal`;

    return (
      <section className="space-y-3">
        <div className={`rounded-[22px] border-l-4 ${accent.borderAccent} p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] ${
          isDarkMode ? 'border-y-slate-800 border-r-slate-800 bg-slate-950/92' : 'border-y-slate-100 border-r-slate-100 bg-white'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] uppercase tracking-[0.18em] font-extrabold ${accent.text}`}>
                {getLabel(profileId)}
              </p>
              <h2 className={`mt-1.5 text-[34px] font-black leading-none tracking-tight ${isDarkMode ? 'text-slate-50' : 'text-slate-950'}`}>
                {active.kcal}
                <span className={`ml-1 text-base font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>kcal</span>
              </h2>
              <p className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <Target className={`h-4 w-4 ${accent.text}`} />
                Meta diaria: {metrics.calorieTarget} kcal
              </p>
            </div>

            <div className={`min-w-[108px] rounded-2xl px-3 py-2 text-right ${
              isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
              <p className={`text-[10px] uppercase tracking-[0.16em] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{diaActivo}</p>
              <p className={`mt-1 text-lg font-black ${accent.text}`}>{dayPercent}%</p>
              <p className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {deltaLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusPills[active.status]}`}>
              {STATUS_LABELS[active.status]}
            </span>
            <span className={`text-[12px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Diferencia: {deltaLabel}
            </span>
          </div>

          <div className={`mt-3 h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className={`h-full rounded-full bg-gradient-to-r ${accent.progressFill}`} style={{ width: `${Math.max(8, Math.min(100, dayPercent))}%` }} />
          </div>

          <div className={`mt-3 grid grid-cols-3 gap-2 rounded-2xl p-2 ${isDarkMode ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
            <div className="px-1">
              <p className={`text-[9px] uppercase tracking-[0.14em] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Promedio</p>
              <p className={`mt-0.5 text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{metrics.weeklyAverage}</p>
            </div>
            <div className="px-1">
              <p className={`text-[9px] uppercase tracking-[0.14em] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rango</p>
              <p className={`mt-0.5 text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{metrics.adherenceDays}/7</p>
            </div>
            <div className="min-w-0 px-1">
              <p className={`text-[9px] uppercase tracking-[0.14em] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Mejor</p>
              <p className={`mt-0.5 truncate text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{metrics.bestDay?.dia || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <MetricCard label="Calorías" value={metrics.selectedDayTotals.kcal} target={metrics.calorieTarget} unit="kcal" accent={accent} />
          <div className="grid grid-cols-2 gap-2.5">
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
      className="space-y-3"
    >
      <section className={`rounded-[22px] p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>Kcal por día</h3>
            <p className={`mt-0.5 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Toca un día para revisar sus metas.
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-600'}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Individual
          </div>
        </div>

        <div
          ref={dayScrollerRef}
          className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`inline-flex min-w-[78px] items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-black transition active:scale-[0.98] ${
                  active
                    ? `bg-gradient-to-br ${palette.hero} text-white shadow-sm`
                    : isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {dia.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </section>

      {isCombined ? (
        <section className={`rounded-[22px] p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ${isDarkMode ? 'bg-slate-950/92' : 'bg-white'}`}>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h3 className={`text-sm font-black ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Comparativa del día
            </h3>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {diaActivo}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
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
                  className={`rounded-[18px] border p-2.5 text-left transition active:scale-[0.98] ${
                    selected
                      ? `${accent.tagBg} ${accent.tagText} ${accent.borderAccent}`
                      : isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-100 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]">
                      {getLabel(profileId)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusPills[active.status]}`}>
                      {percent}%
                    </span>
                  </div>
                  <p className={`mt-1.5 text-xl font-black leading-none ${selected ? accent.tagText : ''}`}>{active.kcal}</p>
                  <p className={`mt-1 text-[11px] font-bold ${selected ? accent.tagText : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    de {metrics.calorieTarget} kcal
                  </p>
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${accent.progressFill}`}
                      style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
                    />
                  </div>
                  <p className={`mt-1.5 text-[10px] font-black ${selected ? accent.tagText : accent.text}`}>
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
