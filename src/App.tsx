import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, CheckCircle2, TrendingDown, Calendar,
  BookOpen, Zap, Shield, Lightbulb, BarChart3, ArrowLeft,
  Sun, Coffee, UtensilsCrossed, Moon, Apple, AlertTriangle,
  Heart, ChevronDown, ChevronUp,
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
  const [progressExpanded, setProgressExpanded] = useState(false);

  // Refs para hacer scroll a cada sección de comida
  const mealSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMomento = useCallback((momentoKey: string) => {
    const el = mealSectionRefs.current[momentoKey];
    if (!el) return;
    // Cerrar panel expandido primero para que el offset sea el correcto (compacto)
    setProgressExpanded(false);
    // Offset = header principal (~56px) + barra compacta (~44px) + margen extra (8px)
    const offset = 56 + 44 + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const perfil = perfilActivo ? perfilesData[perfilActivo] : null;
  const diasDisponibles = perfil ? Object.keys(perfil.plan) : [];
  const equivalencias = perfilActivo ? equivalenciasData[perfilActivo] : [];

  const toggleSeleccion = (dia: string, momento: string, nombre: string) => {
    const key = `${dia}-${momento}-${nombre}`;
    setSelecciones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const momentoCompletado = useMemo(() => {
    if (!perfil) return {} as Record<string, boolean>;
    const result: Record<string, boolean> = {};
    perfil.momentos.forEach((m) => {
      const comidas = perfil.plan[diaActivo]?.[m.key] || [];
      result[m.key] = comidas.some((item) =>
        selecciones[`${diaActivo}-${m.key}-${item.nombre}`]
      );
    });
    return result;
  }, [diaActivo, perfil, selecciones]);

  const progresoDia = useMemo(() => {
    if (!perfil) return 0;
    const total = perfil.momentos.length;
    const completados = Object.values(momentoCompletado).filter(Boolean).length;
    return Math.round((completados / total) * 100);
  }, [perfil, momentoCompletado]);

  const completadosCount = Object.values(momentoCompletado).filter(Boolean).length;

  // Collapse progress when tab changes or day changes
  useEffect(() => {
    setProgressExpanded(false);
  }, [tab, diaActivo]);

  // ─── Landing / Profile selector ───────────────────────────────────────────
  if (!perfilActivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
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

        <div className="flex-1 max-w-4xl mx-auto px-6 pb-16 w-full">
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <motion.button
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
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
                <p className="text-blue-100 text-sm mb-4 leading-relaxed">{perfilesData.vo.perfil}</p>
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <TrendingDown className="w-4 h-4" /><span>{perfilesData.vo.meta}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                  Ver mi plan →
                </div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
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
                <p className="text-rose-100 text-sm mb-4 leading-relaxed">{perfilesData.va.perfil}</p>
                <div className="flex items-center gap-2 text-rose-200 text-sm">
                  <TrendingDown className="w-4 h-4" /><span>{perfilesData.va.meta}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors">
                  Ver mi plan →
                </div>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-10 rounded-2xl overflow-hidden shadow-lg"
          >
            <img src="/images/meal-prep.png" alt="Preparación de comidas saludables" className="w-full h-48 md:h-64 object-cover" />
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Main app ────────────────────────────────────────────────────────────────
  const isVo = perfilActivo === 'vo';
  const ac = {
    color500: isVo ? '#3b82f6' : '#f43f5e',
    bg: isVo ? 'bg-blue-500' : 'bg-rose-500',
    bgLight: isVo ? 'bg-blue-50' : 'bg-rose-50',
    bgGradient: isVo ? 'from-blue-500 to-indigo-600' : 'from-rose-500 to-pink-600',
    bgGradientLight: isVo ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
    text: isVo ? 'text-blue-600' : 'text-rose-600',
    textDark: isVo ? 'text-blue-900' : 'text-rose-900',
    border: isVo ? 'border-blue-200' : 'border-rose-200',
    borderAccent: isVo ? 'border-blue-500' : 'border-rose-500',
    tagBg: isVo ? 'bg-blue-100' : 'bg-rose-100',
    tagText: isVo ? 'text-blue-700' : 'text-rose-700',
    progressBg: isVo ? 'bg-blue-100' : 'bg-rose-100',
    progressFill: isVo ? 'from-blue-500 to-indigo-500' : 'from-rose-500 to-pink-500',
    btnActive: isVo
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
      : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
    btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
    dot: isVo ? 'bg-blue-500' : 'bg-rose-500',
    cardDone: isVo
      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-blue-200'
      : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400 shadow-rose-200',
    cardPending: 'bg-white border-slate-200 shadow-sm',
    iconDone: 'bg-white/20',
    iconPending: isVo ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100',
    iconColorPending: isVo ? 'text-blue-400' : 'text-rose-400',
    headerBg: isVo
      ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
      : 'bg-gradient-to-r from-rose-500 to-pink-600',
  };

  const accentColors = {
    bg: ac.bg, bgLight: ac.bgLight, bgGradient: ac.bgGradient,
    text: ac.text, border: ac.border, borderAccent: ac.borderAccent,
    tagBg: ac.tagBg, tagText: ac.tagText,
  };

  const totalMomentos = perfil!.momentos.length;

  // Header height approx: 52px mobile, 56px desktop
  // Progress bar sticky height: ~56px (compact) or ~auto (expanded)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50" data-profile={perfilActivo}>

      {/* ── Header principal (sticky, z-50) ──────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setPerfilActivo(null)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center shadow-md flex-shrink-0 hidden sm:flex`}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-sm sm:text-base font-bold ${ac.text} truncate`}>Plan de {perfil!.nombre}</h1>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">{perfil!.perfil}</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {(['vo', 'va'] as const).map((p) => (
              <button key={p}
                onClick={() => { setPerfilActivo(p); setDiaActivo('Lunes'); setSelecciones({}); setTab('plan'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${perfilActivo === p ? ac.btnActive : ac.btnInactive}`}
              >
                {perfilesData[p].nombre}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ── PROGRESO DEL DÍA — Sticky justo bajo el header (solo en tab=plan) ── */}
      <AnimatePresence>
        {tab === 'plan' && (
          <motion.div
            key={`progress-${perfilActivo}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`sticky top-[52px] sm:top-[56px] z-40 bg-white/97 backdrop-blur-xl border-b ${ac.border} shadow-md`}
          >
            {/* ── Barra compacta siempre visible ── */}
            <div
              className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setProgressExpanded((e) => !e)}
            >
              {/* Día activo */}
              <span className={`text-[11px] sm:text-xs font-bold ${ac.text} whitespace-nowrap flex-shrink-0`}>
                {diaActivo}
              </span>

              {/* Indicadores de momentos — clickeables para ir a esa sección */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {perfil!.momentos.map((momento) => {
                  const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                  const done = momentoCompletado[momento.key];
                  return (
                    <button
                      key={momento.key}
                      title={`Ir a ${momento.label}`}
                      onClick={(e) => { e.stopPropagation(); scrollToMomento(momento.key); }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                        done
                          ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-80`
                          : `${ac.bgLight} border ${ac.border} hover:opacity-70`
                      }`}
                    >
                      {done
                        ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        : <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${ac.iconColorPending}`} />
                      }
                    </button>
                  );
                })}
              </div>

              {/* Barra de progreso */}
              <div className={`flex-1 h-1.5 ${ac.progressBg} rounded-full overflow-hidden`}>
                <motion.div
                  className={`h-full bg-gradient-to-r ${ac.progressFill} rounded-full`}
                  animate={{ width: `${progresoDia}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                />
              </div>

              {/* Porcentaje */}
              <span className={`text-[11px] sm:text-xs font-bold ${progresoDia === 100 ? 'text-emerald-600' : ac.text} flex-shrink-0 tabular-nums w-7 sm:w-8 text-right`}>
                {progresoDia}%
              </span>

              {/* Toggle expand */}
              <button
                className={`flex-shrink-0 p-1 rounded-full hover:${ac.bgLight} transition-colors`}
                onClick={(e) => { e.stopPropagation(); setProgressExpanded((x) => !x); }}
                aria-label={progressExpanded ? 'Colapsar progreso' : 'Expandir progreso'}
              >
                {progressExpanded
                  ? <ChevronUp className={`w-4 h-4 ${ac.text}`} />
                  : <ChevronDown className={`w-4 h-4 ${ac.text}`} />
                }
              </button>
            </div>

            {/* ── Panel expandido con tarjetas de momentos ── */}
            <AnimatePresence>
              {progressExpanded && (
                <motion.div
                  key="progress-expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className={`max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1`}>
                    {/* Encabezado */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] text-slate-500">
                        {completadosCount} de {totalMomentos} momentos completados
                      </p>
                      {progresoDia === 100 && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Día completo! 🎉
                        </span>
                      )}
                    </div>

                    {/* Tarjetas de momentos — clickeables para ir a la sección */}
                    <div className="grid grid-cols-5 gap-2">
                      {perfil!.momentos.map((momento) => {
                        const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                        const done = momentoCompletado[momento.key];
                        const shortLabel = momento.label
                          .replace('Colación ', 'Col. ')
                          .replace('mañana', 'AM')
                          .replace('tarde', 'PM');
                        return (
                          <motion.button
                            key={momento.key}
                            animate={{ scale: done ? 1.03 : 1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            onClick={() => scrollToMomento(momento.key)}
                            className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${
                              done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`
                            }`}
                          >
                            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${done ? ac.iconDone : ac.iconPending}`}>
                              {done
                                ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                : <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${ac.iconColorPending}`} />
                              }
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight ${done ? 'text-white' : 'text-slate-700'}`}>
                              {shortLabel}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] text-center leading-tight ${done ? 'text-white/70' : 'text-slate-400'}`}>
                              {momento.hora}
                            </span>
                            {done && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center shadow"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* Health note */}
        {perfil!.notaSalud && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">{perfil!.notaSalud}</p>
          </motion.div>
        )}

        {/* ── Tab nav */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-1 bg-slate-100 rounded-2xl p-1.5">
          {([
            { key: 'plan' as const, label: 'Mi Plan', icon: Calendar },
            { key: 'equivalencias' as const, label: 'Equivalencias', icon: BookOpen },
            { key: 'resumen' as const, label: 'Resumen', icon: Lightbulb },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-4 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 ${tab === t.key ? `bg-white shadow-md ${ac.text}` : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab content */}
        <AnimatePresence mode="wait">

          {/* ════ PLAN ════ */}
          {tab === 'plan' && (
            <motion.div key="plan"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}
              className="space-y-4">

              {/* Selector de día */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar className={`w-4 h-4 ${ac.text}`} />
                  <h2 className="text-sm font-bold text-slate-900">Día de la semana</h2>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x scrollbar-none">
                  {diasDisponibles.map((dia) => (
                    <button key={dia} onClick={() => setDiaActivo(dia)}
                      className={`py-1.5 px-2.5 sm:px-3 rounded-xl font-semibold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${diaActivo === dia ? `${ac.btnActive} scale-105` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                      <span className="sm:hidden">{dia.slice(0, 3)}</span>
                      <span className="hidden sm:inline">{dia}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tarjetas de comidas ──────────────────────────────────── */}
              <div className="space-y-4">
                {perfil!.momentos.map((momento) => {
                  const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                  const comidas = perfil!.plan[diaActivo]?.[momento.key] || [];
                  if (comidas.length === 0) return null;
                  const done = momentoCompletado[momento.key];
                  return (
                    <div
                      key={momento.key}
                      ref={(el) => { mealSectionRefs.current[momento.key] = el; }}
                      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border ${done ? ac.borderAccent : 'border-slate-100'} transition-all duration-300`}
                    >
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="truncate">{momento.label}</span>
                        {done && (
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isVo ? 'text-blue-500' : 'text-rose-500'}`} />
                        )}
                        <span className="text-[10px] font-normal text-slate-400 ml-auto whitespace-nowrap">{momento.hora}</span>
                      </h3>
                      <MealSelector
                        comidas={comidas}
                        dia={diaActivo}
                        momento={momento.key}
                        selecciones={selecciones}
                        onToggle={toggleSeleccion}
                        accentClasses={accentColors}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ════ EQUIVALENCIAS ════ */}
          {tab === 'equivalencias' && (
            <motion.div key="equivalencias"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}
              className="grid md:grid-cols-2 gap-4">
              {equivalencias.map((eq, idx) => (
                <EquivalenciasCard key={idx} equivalencia={eq} delay={idx * 0.05} accentClasses={accentColors} />
              ))}
            </motion.div>
          )}

          {/* ════ RESUMEN ════ */}
          {tab === 'resumen' && (
            <motion.div key="resumen"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}
              className="space-y-4">

              <div className="relative rounded-2xl overflow-hidden shadow-sm">
                <img src="/images/meal-prep.png" alt="Plan de comidas" className="w-full h-36 sm:h-44 object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-r ${ac.bgGradient} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    Sobre {perfil!.nombre}
                  </h2>
                </div>
              </div>

              {perfil!.notaSalud && (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">{perfil!.notaSalud}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Heart className={`w-4 h-4 ${ac.text}`} />
                  Puntos clave de tu plan
                </h3>
                <div className="space-y-2.5">
                  {perfil!.resumenPersonal.map((linea, idx) => (
                    <motion.div key={idx}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.07 }}
                      className="flex gap-3 p-3 rounded-xl bg-slate-50"
                      style={{ borderLeft: `3px solid ${ac.color500}` }}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ac.dot} mt-1.5 flex-shrink-0`} />
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{linea}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {perfil!.distribucionDiaria && (
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <BarChart3 className={`w-4 h-4 ${ac.text}`} />
                    Distribución diaria de porciones
                  </h3>
                  <div className="grid gap-2">
                    {perfil!.distribucionDiaria.map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl ${ac.bgLight}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`font-bold ${ac.text} text-base w-7 text-center flex-shrink-0`}>{item.total}</span>
                          <span className="font-medium text-slate-800 text-xs sm:text-sm">{item.grupo}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-slate-500 text-right max-w-[120px] sm:max-w-none">{item.detalle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`bg-gradient-to-br ${ac.bgGradientLight} rounded-2xl p-4 border ${ac.border}`}>
                  <h3 className={`font-bold ${ac.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                    <TrendingDown className="w-3.5 h-3.5" /> Meta
                  </h3>
                  <p className={`${ac.text} text-xs sm:text-sm`}>{perfil!.meta}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200">
                  <h3 className="font-bold text-emerald-900 mb-1.5 text-xs sm:text-sm">Perfil</h3>
                  <p className="text-emerald-700 text-xs sm:text-sm">{perfil!.perfil}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/50 mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-slate-500 text-xs sm:text-sm">
          <p className="flex items-center justify-center gap-2">
            <ChefHat className="w-3.5 h-3.5" />
            Plan de alimentación personalizado — 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
