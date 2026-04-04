import { useMemo, useState } from 'react';
import { Brain, Loader2, Plus, Trash2 } from 'lucide-react';

export type TargetProfile = 'vo' | 'va' | 'ambos';
export type PortionMode = 'manual' | 'auto';

export interface QuestionnairePayload {
  targetProfile: TargetProfile;
  profileToUpdate: TargetProfile;
  portionMode: PortionMode;
  profileContext: {
    currentWeightKg: string;
    heightCm: string;
    targetWeightKg: string;
    objective: string;
    objectiveTimelineWeeks: string;
  };
  healthContext: {
    diagnostics: string;
    medications: string;
    allergies: string;
    intolerances: string;
    digestiveSymptoms: string;
  };
  preferences: {
    favoriteFoods: string;
    dislikedFoods: string;
    favoriteCuisineStyles: string;
    budgetLevel: 'bajo' | 'medio' | 'alto';
    cookingTime: string;
  };
  routine: {
    wakeTime: string;
    sleepTime: string;
    activityLevel: string;
    trainingFrequency: string;
  };
  planConfig: {
    mealsPerDay: string;
    selectedMoments: { key: string; label: string; hora: string }[];
    manualPortionInstructions: string;
    additionalNotes: string;
  };
}

interface Props {
  onCancel: () => void;
  onGenerate: (payload: QuestionnairePayload) => Promise<void>;
  loading: boolean;
  errorMessage?: string;
}

const defaultMoments = [
  { key: 'desayuno', label: 'Desayuno', hora: '08:00' },
  { key: 'colacion_am', label: 'Colación AM', hora: '11:00' },
  { key: 'comida', label: 'Comida', hora: '14:00' },
  { key: 'colacion_pm', label: 'Colación PM', hora: '17:00' },
  { key: 'cena', label: 'Cena', hora: '20:00' },
];

export default function NutritionQuestionnaire({ onCancel, onGenerate, loading, errorMessage }: Props) {
  const [targetProfile, setTargetProfile] = useState<TargetProfile>('ambos');
  const [portionMode, setPortionMode] = useState<PortionMode>('auto');

  const [selectedMoments, setSelectedMoments] = useState(defaultMoments);

  const [profileContext, setProfileContext] = useState({
    currentWeightKg: '',
    heightCm: '',
    targetWeightKg: '',
    objective: '',
    objectiveTimelineWeeks: '',
  });

  const [healthContext, setHealthContext] = useState({
    diagnostics: '',
    medications: '',
    allergies: '',
    intolerances: '',
    digestiveSymptoms: '',
  });

  const [preferences, setPreferences] = useState({
    favoriteFoods: '',
    dislikedFoods: '',
    favoriteCuisineStyles: '',
    budgetLevel: 'medio' as 'bajo' | 'medio' | 'alto',
    cookingTime: '',
  });

  const [routine, setRoutine] = useState({
    wakeTime: '',
    sleepTime: '',
    activityLevel: '',
    trainingFrequency: '',
  });

  const [planConfig, setPlanConfig] = useState({
    mealsPerDay: '5',
    manualPortionInstructions: '',
    additionalNotes: '',
  });

  const isInvalid = useMemo(() => {
    return !profileContext.currentWeightKg || !profileContext.heightCm || !profileContext.objective || selectedMoments.length === 0;
  }, [profileContext, selectedMoments]);

  const updateMoment = (idx: number, field: 'key' | 'label' | 'hora', value: string) => {
    setSelectedMoments((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMoment = () => {
    setSelectedMoments((prev) => [...prev, { key: `momento_${prev.length + 1}`, label: `Momento ${prev.length + 1}`, hora: '12:00' }]);
  };

  const removeMoment = (idx: number) => {
    setSelectedMoments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid || loading) return;

    await onGenerate({
      targetProfile,
      profileToUpdate: targetProfile,
      portionMode,
      profileContext,
      healthContext,
      preferences,
      routine,
      planConfig: {
        mealsPerDay: planConfig.mealsPerDay,
        selectedMoments,
        manualPortionInstructions: planConfig.manualPortionInstructions,
        additionalNotes: planConfig.additionalNotes,
      },
    });
  };

  return (
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-emerald-900">Cuestionario profesional para generar plan con IA</h3>
          <p className="text-sm text-emerald-700">Diseñado para crear JSON completo compatible con VO/VA y equivalencias.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700">
          Cerrar
        </button>
      </div>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100">
          <h4 className="font-semibold text-slate-800 mb-3">1) Perfil a modificar</h4>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            {([
              ['vo', 'Solo VO'],
              ['va', 'Solo VA'],
              ['ambos', 'VO + VA (independiente)'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTargetProfile(value)}
                className={`rounded-xl border px-3 py-2 font-semibold transition ${targetProfile === value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100 grid md:grid-cols-2 gap-3">
          <h4 className="font-semibold text-slate-800 md:col-span-2">2) Antropometría y objetivos</h4>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Peso actual (kg)*" value={profileContext.currentWeightKg} onChange={(e) => setProfileContext((p) => ({ ...p, currentWeightKg: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Altura (cm)*" value={profileContext.heightCm} onChange={(e) => setProfileContext((p) => ({ ...p, heightCm: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Peso objetivo (kg)" value={profileContext.targetWeightKg} onChange={(e) => setProfileContext((p) => ({ ...p, targetWeightKg: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Horizonte objetivo (semanas)" value={profileContext.objectiveTimelineWeeks} onChange={(e) => setProfileContext((p) => ({ ...p, objectiveTimelineWeeks: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={2} placeholder="Objetivo principal (ej. recomposición, pérdida de grasa, salud metabólica)*" value={profileContext.objective} onChange={(e) => setProfileContext((p) => ({ ...p, objective: e.target.value }))} />
        </section>

        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100 grid md:grid-cols-2 gap-3">
          <h4 className="font-semibold text-slate-800 md:col-span-2">3) Salud y restricciones</h4>
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Diagnósticos relevantes" value={healthContext.diagnostics} onChange={(e) => setHealthContext((p) => ({ ...p, diagnostics: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Medicamentos actuales" value={healthContext.medications} onChange={(e) => setHealthContext((p) => ({ ...p, medications: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Alergias alimentarias" value={healthContext.allergies} onChange={(e) => setHealthContext((p) => ({ ...p, allergies: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Intolerancias" value={healthContext.intolerances} onChange={(e) => setHealthContext((p) => ({ ...p, intolerances: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={2} placeholder="Síntomas digestivos frecuentes" value={healthContext.digestiveSymptoms} onChange={(e) => setHealthContext((p) => ({ ...p, digestiveSymptoms: e.target.value }))} />
        </section>

        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100 grid md:grid-cols-2 gap-3">
          <h4 className="font-semibold text-slate-800 md:col-span-2">4) Preferencias, aversiones y contexto</h4>
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Comidas que sí quiere en su día" value={preferences.favoriteFoods} onChange={(e) => setPreferences((p) => ({ ...p, favoriteFoods: e.target.value }))} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Comidas que no le gustan" value={preferences.dislikedFoods} onChange={(e) => setPreferences((p) => ({ ...p, dislikedFoods: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Tipos de cocina preferidos" value={preferences.favoriteCuisineStyles} onChange={(e) => setPreferences((p) => ({ ...p, favoriteCuisineStyles: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Tiempo disponible para cocinar" value={preferences.cookingTime} onChange={(e) => setPreferences((p) => ({ ...p, cookingTime: e.target.value }))} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" value={preferences.budgetLevel} onChange={(e) => setPreferences((p) => ({ ...p, budgetLevel: e.target.value as 'bajo' | 'medio' | 'alto' }))}>
            <option value="bajo">Presupuesto bajo</option>
            <option value="medio">Presupuesto medio</option>
            <option value="alto">Presupuesto alto</option>
          </select>
        </section>

        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100 grid md:grid-cols-2 gap-3">
          <h4 className="font-semibold text-slate-800 md:col-span-2">5) Rutina y nivel de actividad</h4>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Hora de despertar" value={routine.wakeTime} onChange={(e) => setRoutine((p) => ({ ...p, wakeTime: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Hora de dormir" value={routine.sleepTime} onChange={(e) => setRoutine((p) => ({ ...p, sleepTime: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nivel de actividad (sedentario, moderado...)" value={routine.activityLevel} onChange={(e) => setRoutine((p) => ({ ...p, activityLevel: e.target.value }))} />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Frecuencia de entrenamiento" value={routine.trainingFrequency} onChange={(e) => setRoutine((p) => ({ ...p, trainingFrequency: e.target.value }))} />
        </section>

        <section className="bg-white/80 rounded-2xl p-4 border border-emerald-100 grid gap-3">
          <h4 className="font-semibold text-slate-800">6) Estructura de momentos y porciones</h4>

          <div className="grid md:grid-cols-2 gap-3">
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="¿Cuántas comidas al día desea?" value={planConfig.mealsPerDay} onChange={(e) => setPlanConfig((p) => ({ ...p, mealsPerDay: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPortionMode('auto')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${portionMode === 'auto' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>Porciones auto</button>
              <button type="button" onClick={() => setPortionMode('manual')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${portionMode === 'manual' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200'}`}>Porciones manual</button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedMoments.map((moment, idx) => (
              <div key={`${moment.key}-${idx}`} className="grid md:grid-cols-[1fr_1fr_120px_36px] gap-2 items-center">
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="key (ej. desayuno)" value={moment.key} onChange={(e) => updateMoment(idx, 'key', e.target.value)} />
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="label" value={moment.label} onChange={(e) => updateMoment(idx, 'label', e.target.value)} />
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="hora" value={moment.hora} onChange={(e) => updateMoment(idx, 'hora', e.target.value)} />
                <button type="button" onClick={() => removeMoment(idx)} className="h-9 w-9 rounded-lg border border-rose-200 text-rose-600 bg-white flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addMoment} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
              <Plus className="w-4 h-4" /> Agregar momento
            </button>
          </div>

          {portionMode === 'manual' && (
            <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="Indica porciones manuales por momento o por grupo alimenticio" value={planConfig.manualPortionInstructions} onChange={(e) => setPlanConfig((p) => ({ ...p, manualPortionInstructions: e.target.value }))} />
          )}

          <textarea className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="Notas adicionales para la IA (adherencia, alimentos locales, reglas familiares, etc.)" value={planConfig.additionalNotes} onChange={(e) => setPlanConfig((p) => ({ ...p, additionalNotes: e.target.value }))} />
        </section>

        {errorMessage && <p className="text-sm text-rose-600 font-medium">{errorMessage}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={isInvalid || loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 shadow-md">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {loading ? 'Generando...' : 'Generar JSON ideal con IA'}
          </button>
          <p className="text-xs text-slate-500">Este proceso es informativo y no sustituye evaluación clínica presencial.</p>
        </div>
      </form>
    </div>
  );
}
