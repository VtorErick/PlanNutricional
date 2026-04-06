import { motion } from 'framer-motion';
import { Flame, Target } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { estimateDailyCaloriesFromObjectives } from '../../utils/nutrition';

const STATUS_LABELS = {
  low: 'Lejos de meta',
  near: 'Cerca de meta',
  high: 'Meta excedida',
} as const;

export default function CalorieMonitoringView() {
  const { perfilActivo, perfilesData, selecciones, diasDisponibles, isAmbos } = useDiet();

  const profileIds: Array<'el' | 'ella'> = isAmbos || perfilActivo === 'ambos'
    ? ['el', 'ella']
    : [perfilActivo === 'ella' ? 'ella' : 'el'];

  const metaCaloricaTotal = profileIds.reduce((acc, id) => {
    const p = perfilesData[id];
    return acc + (p.metaCaloricaKcalDia ?? estimateDailyCaloriesFromObjectives(p));
  }, 0);

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
                className={`h-full rounded-full transition-all ${paletteByProfile[item.status].split(' ')[0]}`}
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
