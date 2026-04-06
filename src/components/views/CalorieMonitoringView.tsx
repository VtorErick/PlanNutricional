import { motion } from 'framer-motion';
import { Flame, Target } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { estimateDailyCaloriesFromObjectives, estimateDailyMacroTargetsFromObjectives } from '../../utils/nutrition';

const STATUS_LABELS = {
  low: 'Lejos de meta',
  near: 'Cerca de meta',
  high: 'Meta excedida',
} as const;

export default function CalorieMonitoringView() {
  const { perfilActivo, perfilesData, selecciones, diasDisponibles, isAmbos, diaActivo } = useDiet();

  const profileIds: Array<'el' | 'ella'> = isAmbos || perfilActivo === 'ambos'
    ? ['el', 'ella']
    : [perfilActivo === 'ella' ? 'ella' : 'el'];

  const metaCaloricaTotal = profileIds.reduce((acc, id) => {
    const p = perfilesData[id];
    return acc + (p.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(p));
  }, 0);

  const macroTargets = profileIds.reduce((acc, id) => {
    const profile = perfilesData[id];
    const t = estimateDailyMacroTargetsFromObjectives(profile);
    return {
      proteinG: acc.proteinG + t.proteinG,
      fatG: acc.fatG + t.fatG,
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

  const daySummaries = diasDisponibles.map((dia) => {
    const kcal = profileIds.reduce((accProfiles, profileId) => {
      const dayPlan = perfilesData[profileId]?.plan?.[dia] || {};
      const dayKcal = Object.entries(dayPlan).reduce((acc, [momentoKey, meals]) => {
        const selected = (meals || []).find((meal) => selecciones[`${profileId}-${dia}-${momentoKey}-${meal.nombre}`]);
        return acc + (selected?.caloriasKcal || 0);
      }, 0);
      return accProfiles + dayKcal;
    }, 0);

    const ratio = metaCaloricaTotal > 0 ? kcal / metaCaloricaTotal : 0;
    const status = ratio < 0.85 ? 'low' : ratio <= 1.1 ? 'near' : 'high';

    return { dia, kcal, ratio, status };
  });

  const paletteByProfile = isAmbos || perfilActivo === 'ambos'
    ? {
        low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        near: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        high: 'bg-teal-100 text-teal-800 border-teal-300',
      }
    : perfilActivo === 'ella'
      ? {
          low: 'bg-rose-50 text-rose-700 border-rose-200',
          near: 'bg-rose-100 text-rose-800 border-rose-300',
          high: 'bg-pink-100 text-pink-800 border-pink-300',
        }
      : {
          low: 'bg-blue-50 text-blue-700 border-blue-200',
          near: 'bg-blue-100 text-blue-800 border-blue-300',
          high: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        };

  const barColorByProfile = isAmbos || perfilActivo === 'ambos'
    ? { low: 'bg-emerald-300', near: 'bg-emerald-500', high: 'bg-teal-600' }
    : perfilActivo === 'ella'
      ? { low: 'bg-rose-300', near: 'bg-rose-500', high: 'bg-pink-600' }
      : { low: 'bg-blue-300', near: 'bg-blue-500', high: 'bg-indigo-600' };

  const ringColorByProfile = isAmbos || perfilActivo === 'ambos'
    ? '#10b981'
    : perfilActivo === 'ella'
      ? '#f43f5e'
      : '#3b82f6';

  const RingChart = ({
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
    const safeTarget = Math.max(1, target || 0);
    const percent = Math.max(0, Math.round((value / safeTarget) * 100));
    const boundedPercent = Math.min(100, percent);
    const radius = 24;
    const stroke = 7;
    const c = 2 * Math.PI * radius;
    const offset = c * (1 - boundedPercent / 100);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
        <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={ringColorByProfile}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
          />
          <text x="32" y="36" textAnchor="middle" className="text-[10px] font-black fill-slate-700">
            {percent}%
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">{label}</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">
            {value}{unit} / {target}{unit}
          </p>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="calorias"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Meta calórica diaria</p>
        <p className="text-2xl font-black text-slate-800 mt-1">{metaCaloricaTotal} kcal</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          Basada en tu perfil y objetivo de peso.
        </p>
      </div>

      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-slate-800 px-1">
          Indicadores de {diaActivo}
        </h3>
        <RingChart label="Calorías" value={selectedDayTotals.kcal} target={metaCaloricaTotal} unit=" kcal" />
        <RingChart label="Proteína" value={selectedDayTotals.proteinG} target={macroTargets.proteinG} unit=" g" />
        <RingChart label="Grasas" value={selectedDayTotals.fatG} target={macroTargets.fatG} unit=" g" />
      </div>

      <div className="space-y-2.5">
        {daySummaries.map((item) => (
          <div
            key={item.dia}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-slate-800 text-sm">{item.dia}</p>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${paletteByProfile[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xl font-black text-slate-800">{item.kcal} kcal</p>
              <p className="text-[11px] text-slate-500 font-semibold">
                Meta: {metaCaloricaTotal} kcal
              </p>
            </div>

            <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColorByProfile[item.status]}`}
                style={{ width: `${Math.min(100, Math.round(item.ratio * 100))}%` }}
              />
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              {Math.round(item.ratio * 100)}% de tu meta diaria.
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
