import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, CheckCircle2, TrendingDown, Users, Calendar,
  BookOpen, Zap, Shield, Lightbulb, BarChart3, ArrowLeft,
  Sun, Coffee, UtensilsCrossed, Moon, Apple, AlertTriangle,
  Heart,
} from 'lucide-react';
import MealSelector from './components/MealSelector';
import EquivalenciasCard from './components/EquivalenciasCard';
import { perfilesData, equivalenciasData } from './data';

const momentoIcons: Record<string, any> = {
  desayuno: Sun,
  colacion_am: Apple,
  comida: UtensilsCrossed,
  colacion_pm: Coffee,
  cena: Moon,
};

export default function App() {
  const [perfilActivo, setPerfilActivo] = useState<'vo' | 'va' | null>(null);
  const [diaActivo, setDiaActivo] = useState('Lunes');
  const [selecciones, setSelecciones] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'plan' | 'equivalencias' | 'resumen'>('plan');

  const perfil = perfilActivo ? perfilesData[perfilActivo] : null;
  const diasDisponibles = perfil ? Object.keys(perfil.plan) : [];
  const equivalencias = perfilActivo ? equivalenciasData[perfilActivo] : [];

  const toggleSeleccion = (dia: string, momento: string, nombre: string) => {
    const key = `${dia}-${momento}-${nombre}`;
    setSelecciones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const progresoDia = useMemo(() => {
    if (!perfil) return 0;
    let marcadas = 0;
    perfil.momentos.forEach((m) => {
      const comidas = perfil.plan[diaActivo]?.[m.key] || [];
      const algunaMarcada = comidas.some((item) =>
        selecciones[`${diaActivo}-${m.key}-${item.nombre}`]
      );
      if (algunaMarcada) marcadas += 1;
    });
    return Math.round((marcadas / perfil.momentos.length) * 100);
  }, [diaActivo, perfil, selecciones]);

  // Landing / Profile selector screen
  if (!perfilActivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        {/* Hero section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/hero.png" alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-6">
                <ChefHat className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">Plan de alimentación 2026</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
                Tu plan de comidas<br />
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  personalizado
                </span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Elige tu perfil para ver tu menú semanal, equivalencias y recomendaciones personalizadas.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Profile cards */}
        <div className="flex-1 max-w-4xl mx-auto px-6 pb-16 w-full">
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* V(o) Card */}
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setPerfilActivo('vo'); setDiaActivo('Lunes'); setSelecciones({}); }}
              className="text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5">
                  <span className="text-2xl font-bold text-white">V(o)</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Perfil V(o)</h2>
                <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                  {perfilesData.vo.perfil}
                </p>
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>{perfilesData.vo.meta}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                  Ver mi plan →
                </div>
              </div>
            </motion.button>

            {/* V(a) Card */}
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setPerfilActivo('va'); setDiaActivo('Lunes'); setSelecciones({}); }}
              className="text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5">
                  <span className="text-2xl font-bold text-white">V(a)</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Perfil V(a)</h2>
                <p className="text-rose-100 text-sm mb-4 leading-relaxed">
                  {perfilesData.va.perfil}
                </p>
                <div className="flex items-center gap-2 text-rose-200 text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>{perfilesData.va.meta}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                  Ver mi plan →
                </div>
              </div>
            </motion.button>
          </div>

          {/* Meal prep image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 rounded-2xl overflow-hidden shadow-lg"
          >
            <img src="/images/meal-prep.png" alt="Preparación de comidas saludables" className="w-full h-48 md:h-64 object-cover" />
          </motion.div>
        </div>
      </div>
    );
  }

  // Main app with profile selected
  const isVo = perfilActivo === 'vo';
  const accentClasses = {
    bg: isVo ? 'bg-blue-500' : 'bg-rose-500',
    bgLight: isVo ? 'bg-blue-50' : 'bg-rose-50',
    bgLighter: isVo ? 'bg-blue-50/50' : 'bg-rose-50/50',
    bgGradient: isVo ? 'from-blue-500 to-indigo-600' : 'from-rose-500 to-pink-600',
    bgGradientLight: isVo ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
    bgGradientDark: isVo ? 'from-slate-900 via-blue-900 to-indigo-900' : 'from-slate-900 via-rose-900 to-pink-900',
    text: isVo ? 'text-blue-600' : 'text-rose-600',
    textDark: isVo ? 'text-blue-900' : 'text-rose-900',
    textLight: isVo ? 'text-blue-200' : 'text-rose-200',
    border: isVo ? 'border-blue-200' : 'border-rose-200',
    borderAccent: isVo ? 'border-blue-500' : 'border-rose-500',
    ring: isVo ? 'ring-blue-500' : 'ring-rose-500',
    tagBg: isVo ? 'bg-blue-100' : 'bg-rose-100',
    tagText: isVo ? 'text-blue-700' : 'text-rose-700',
    progressBg: isVo ? 'bg-blue-200' : 'bg-rose-200',
    progressFill: isVo ? 'from-blue-500 to-indigo-500' : 'from-rose-500 to-pink-500',
    btnActive: isVo
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
      : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    headerBg: isVo ? 'bg-white/90' : 'bg-white/90',
    dot: isVo ? 'bg-blue-500' : 'bg-rose-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" data-profile={perfilActivo}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 ${accentClasses.headerBg} backdrop-blur-xl border-b border-slate-200/60 shadow-sm`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPerfilActivo(null)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentClasses.bgGradient} flex items-center justify-center shadow-md`}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${accentClasses.text}`}>
                Plan de {perfil!.nombre}
              </h1>
              <p className="text-xs text-slate-500">{perfil!.perfil}</p>
            </div>
          </div>

          {/* Profile switcher */}
          <div className="flex gap-2">
            {(['vo', 'va'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPerfilActivo(p);
                  setDiaActivo('Lunes');
                  setSelecciones({});
                  setTab('plan');
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  perfilActivo === p
                    ? accentClasses.btnActive
                    : accentClasses.btnInactive
                }`}
              >
                {perfilesData[p].nombre}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Health note for V(a) */}
        {perfil!.notaSalud && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium leading-relaxed">{perfil!.notaSalud}</p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-slate-100 rounded-2xl p-1.5"
        >
          {([
            { key: 'plan' as const, label: 'Mi Plan', icon: Calendar },
            { key: 'equivalencias' as const, label: 'Equivalencias', icon: BookOpen },
            { key: 'resumen' as const, label: 'Resumen', icon: Lightbulb },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                tab === t.key
                  ? `bg-white shadow-md ${accentClasses.text}`
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Day selector */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className={`w-5 h-5 ${accentClasses.text}`} />
                  <h2 className="text-base font-bold text-slate-900">Día de la semana</h2>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {diasDisponibles.map((dia) => (
                    <button
                      key={dia}
                      onClick={() => setDiaActivo(dia)}
                      className={`py-2.5 px-1 rounded-xl font-semibold transition-all duration-300 text-sm ${
                        diaActivo === dia
                          ? `${accentClasses.btnActive} scale-105`
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {dia.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className={`bg-gradient-to-r ${accentClasses.bgGradientLight} rounded-2xl p-5 border ${accentClasses.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold ${accentClasses.textDark} flex items-center gap-2 text-sm`}>
                    <Zap className="w-4 h-4" />
                    Progreso del día
                  </h3>
                  <span className={`text-xl font-bold ${accentClasses.text}`}>{progresoDia}%</span>
                </div>
                <div className={`w-full ${accentClasses.progressBg} rounded-full h-2.5 overflow-hidden`}>
                  <motion.div
                    className={`h-full bg-gradient-to-r ${accentClasses.progressFill} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progresoDia}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  />
                </div>
              </div>

              {/* Meal times */}
              <div className="space-y-4">
                {perfil!.momentos.map((momento) => {
                  const MomentoIcon = momentoIcons[momento.key] || UtensilsCrossed;
                  const comidas = perfil!.plan[diaActivo]?.[momento.key] || [];
                  if (comidas.length === 0) return null;
                  return (
                    <div key={momento.key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentClasses.bgGradient} flex items-center justify-center`}>
                          <MomentoIcon className="w-4 h-4 text-white" />
                        </div>
                        {momento.label}
                        <span className="text-xs font-normal text-slate-400 ml-auto">{momento.hora}</span>
                      </h3>
                      <MealSelector
                        comidas={comidas}
                        dia={diaActivo}
                        momento={momento.key}
                        selecciones={selecciones}
                        onToggle={toggleSeleccion}
                        accentClasses={accentClasses}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {tab === 'equivalencias' && (
            <motion.div
              key="equivalencias"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid md:grid-cols-2 gap-4"
            >
              {equivalencias.map((eq, idx) => (
                <EquivalenciasCard key={idx} equivalencia={eq} delay={idx * 0.05} accentClasses={accentClasses} />
              ))}
            </motion.div>
          )}

          {tab === 'resumen' && (
            <motion.div
              key="resumen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Hero image */}
              <div className="relative rounded-2xl overflow-hidden shadow-sm">
                <img src="/images/meal-prep.png" alt="Plan de comidas" className="w-full h-40 object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-r ${accentClasses.bgGradient} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-7 h-7" />
                    Sobre {perfil!.nombre}
                  </h2>
                </div>
              </div>

              {/* Health note */}
              {perfil!.notaSalud && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">{perfil!.notaSalud}</p>
                </div>
              )}

              {/* Key points */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className={`font-bold text-slate-900 mb-4 flex items-center gap-2`}>
                  <Heart className={`w-5 h-5 ${accentClasses.text}`} />
                  Puntos clave de tu plan
                </h3>
                <div className="space-y-3">
                  {perfil!.resumenPersonal.map((linea, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`flex gap-3 p-3 rounded-xl bg-slate-50 border-l-3 ${accentClasses.borderAccent}`}
                      style={{ borderLeftWidth: '3px' }}
                    >
                      <div className={`w-2 h-2 rounded-full ${accentClasses.dot} mt-1.5 flex-shrink-0`} />
                      <p className="text-sm text-slate-700 leading-relaxed">{linea}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Daily distribution */}
              {perfil!.distribucionDiaria && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className={`w-5 h-5 ${accentClasses.text}`} />
                    Distribución diaria de porciones
                  </h3>
                  <div className="grid gap-2">
                    {perfil!.distribucionDiaria.map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${accentClasses.bgLight}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${accentClasses.text} text-lg w-8 text-center`}>{item.total}</span>
                          <span className="font-medium text-slate-800 text-sm">{item.grupo}</span>
                        </div>
                        <span className="text-xs text-slate-500">{item.detalle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`bg-gradient-to-br ${accentClasses.bgGradientLight} rounded-2xl p-5 border ${accentClasses.border}`}>
                  <h3 className={`font-bold ${accentClasses.textDark} mb-2 flex items-center gap-2 text-sm`}>
                    <TrendingDown className="w-4 h-4" />
                    Meta
                  </h3>
                  <p className={`${accentClasses.text} text-sm`}>{perfil!.meta}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200">
                  <h3 className="font-bold text-emerald-900 mb-2 text-sm">Perfil</h3>
                  <p className="text-emerald-700 text-sm">{perfil!.perfil}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/50 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-4 h-4" />
            Plan de alimentación personalizado — 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
