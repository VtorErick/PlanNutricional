import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, CheckCircle2, TrendingDown, Calendar, BookOpen, Shield, Lightbulb, BarChart3, ArrowLeft, Sun, Coffee, UtensilsCrossed, Moon, Apple, AlertTriangle, Heart, ChevronDown, ChevronUp, ShoppingCart, ListChecks } from 'lucide-react';
import MealSelector from './components/MealSelector';
import EquivalenciasCard from './components/EquivalenciasCard';
import { perfilesData, equivalenciasData } from './data';
const momentoIcons = {
    desayuno: Sun,
    colacion_am: Apple,
    comida: UtensilsCrossed,
    colacion_pm: Coffee,
    cena: Moon,
};
export default function App() {
    const [perfilActivo, setPerfilActivo] = useState(() => {
        try {
            const saved = localStorage.getItem('perfilActivo');
            return saved ? saved : null;
        }
        catch {
            return null;
        }
    });
    const [diaActivo, setDiaActivo] = useState(() => {
        try {
            return localStorage.getItem('diaActivo') || 'Lunes';
        }
        catch {
            return 'Lunes';
        }
    });
    const [selecciones, setSelecciones] = useState(() => {
        try {
            const saved = localStorage.getItem('seleccionesDieta');
            return saved ? JSON.parse(saved) : {};
        }
        catch {
            return {};
        }
    });
    const [momentosColapsados, setMomentosColapsados] = useState({});
    const [tab, setTab] = useState('plan');
    const [progressExpanded, setProgressExpanded] = useState(false);
    const [vistaFiltrada, setVistaFiltrada] = useState(() => {
        try {
            return localStorage.getItem('vistaFiltrada') === 'true';
        }
        catch {
            return false;
        }
    });
    const [comprasCheck, setComprasCheck] = useState(() => {
        try {
            const saved = localStorage.getItem('comprasCheck');
            return saved ? JSON.parse(saved) : {};
        }
        catch {
            return {};
        }
    });
    const [ambosSubTab, setAmbosSubTab] = useState('vo');
    // Guardar en LocalStorage cada que cambian
    useEffect(() => {
        localStorage.setItem('comprasCheck', JSON.stringify(comprasCheck));
    }, [comprasCheck]);
    useEffect(() => {
        if (perfilActivo)
            localStorage.setItem('perfilActivo', perfilActivo);
    }, [perfilActivo]);
    useEffect(() => {
        localStorage.setItem('diaActivo', diaActivo);
    }, [diaActivo]);
    useEffect(() => {
        localStorage.setItem('seleccionesDieta', JSON.stringify(selecciones));
    }, [selecciones]);
    useEffect(() => {
        localStorage.setItem('vistaFiltrada', String(vistaFiltrada));
    }, [vistaFiltrada]);
    // Refs to handle auto-scrolling to each meal section
    const mealSectionRefs = useRef({});
    const scrollToMomento = useCallback((momentoKey, isExpanded) => {
        const doScroll = () => {
            const el = mealSectionRefs.current[momentoKey];
            if (!el)
                return;
            // Offset = header (~56px) + dias (~48px) + progreso (~44px) + margen (12px)
            const offset = 56 + 48 + 44 + 12;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        };
        if (isExpanded) {
            // Close expanded panel first and wait for the animation to finish
            setProgressExpanded(false);
            setTimeout(doScroll, 260); // 260ms delay to account for the 0.25s animation
        }
        else {
            doScroll();
        }
    }, []);
    const isAmbos = perfilActivo === 'ambos';
    const isVo = perfilActivo === 'vo';
    // perfilBase is used to extract days and general structure (both share identical days and moments)
    const perfilBase = perfilActivo && perfilActivo !== 'ambos' ? perfilesData[perfilActivo] : perfilesData.vo;
    const perfil = perfilBase;
    const diasDisponibles = perfilActivo ? Object.keys(perfilBase.plan) : [];
    const equivalencias = (perfilActivo && perfilActivo !== 'ambos') ? equivalenciasData[perfilActivo] : [];
    const toggleSeleccion = (perfilId, dia, momento, nombre) => {
        const key = `${perfilId}-${dia}-${momento}-${nombre}`;
        setSelecciones((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const momentoCompletadoVo = useMemo(() => {
        if (!perfilActivo)
            return {};
        const result = {};
        perfilesData.vo.momentos.forEach((m) => {
            const comidas = perfilesData.vo.plan[diaActivo]?.[m.key] || [];
            result[m.key] = comidas.some((item) => selecciones[`vo-${diaActivo}-${m.key}-${item.nombre}`]);
        });
        return result;
    }, [diaActivo, perfilActivo, selecciones]);
    const momentoCompletadoVa = useMemo(() => {
        if (!perfilActivo)
            return {};
        const result = {};
        perfilesData.va.momentos.forEach((m) => {
            const comidas = perfilesData.va.plan[diaActivo]?.[m.key] || [];
            result[m.key] = comidas.some((item) => selecciones[`va-${diaActivo}-${m.key}-${item.nombre}`]);
        });
        return result;
    }, [diaActivo, perfilActivo, selecciones]);
    const momentoCompletado = useMemo(() => {
        if (!perfilActivo)
            return {};
        if (isAmbos) {
            // In "both" mode, it's better for global progress to track exactly 10 meals (5 per profile)
            // Visual checks at the top-level indicate completion only when both profiles complete the meal
            const result = {};
            perfilBase.momentos.forEach((m) => {
                result[m.key] = momentoCompletadoVo[m.key] && momentoCompletadoVa[m.key];
            });
            return result;
        }
        return isVo ? momentoCompletadoVo : momentoCompletadoVa;
    }, [isAmbos, isVo, momentoCompletadoVo, momentoCompletadoVa, perfilBase]);
    const progresoDia = useMemo(() => {
        if (!perfilActivo)
            return 0;
        if (isAmbos) {
            const cVo = Object.values(momentoCompletadoVo).filter(Boolean).length;
            const cVa = Object.values(momentoCompletadoVa).filter(Boolean).length;
            const total = perfilesData.vo.momentos.length * 2;
            return Math.round(((cVo + cVa) / total) * 100);
        }
        const total = perfilBase.momentos.length;
        const completados = Object.values(momentoCompletado).filter(Boolean).length;
        return Math.round((completados / total) * 100);
    }, [perfilActivo, isAmbos, perfilBase, momentoCompletado, momentoCompletadoVo, momentoCompletadoVa]);
    const completadosCount = isAmbos
        ? Object.values(momentoCompletadoVo).filter(Boolean).length + Object.values(momentoCompletadoVa).filter(Boolean).length
        : Object.values(momentoCompletado).filter(Boolean).length;
    const totalMomentosProgress = isAmbos ? perfilBase.momentos.length * 2 : perfilBase.momentos.length;
    // Auto-collapse moment when it becomes completed
    const prevCompletado = useRef(momentoCompletado);
    useEffect(() => {
        const timeoutIds = [];
        Object.entries(momentoCompletado).forEach(([key, isDone]) => {
            if (isDone && !prevCompletado.current[key]) {
                const tid = setTimeout(() => {
                    setMomentosColapsados(p => ({ ...p, [key]: true }));
                }, 800);
                timeoutIds.push(tid);
            }
        });
        prevCompletado.current = momentoCompletado;
        return () => timeoutIds.forEach(clearTimeout);
    }, [momentoCompletado]);
    // Collapse progress when tab changes or day changes
    useEffect(() => {
        setProgressExpanded(false);
        setMomentosColapsados({});
    }, [tab, diaActivo, perfilActivo]);
    const listaCompras = useMemo(() => {
        const map = {};
        Object.entries(selecciones).forEach(([key, isSelected]) => {
            if (!isSelected)
                return;
            const parts = key.split('-');
            if (parts.length < 4)
                return;
            const [p, d, m, ...nParts] = parts;
            if (perfilActivo !== 'ambos' && p !== perfilActivo)
                return;
            const nombre = nParts.join('-'); // in case nombre had a dash
            const perfilObj = perfilesData[p];
            if (!perfilObj)
                return;
            const comidas = perfilObj.plan[d]?.[m] || [];
            const comida = comidas.find(c => c.nombre === nombre);
            if (comida) {
                comida.super.forEach(ing => {
                    if (!map[ing])
                        map[ing] = [];
                    const label = `${d} - ${m.replace('colacion_am', 'Col. AM').replace('colacion_pm', 'Col. PM')} (${perfilObj.nombre}): ${comida.nombre}`;
                    map[ing].push({ texto: label, perfil: p });
                });
            }
        });
        // Sort alphabetically
        return Object.keys(map).sort().map(ing => ({
            ingrediente: ing,
            usos: map[ing]
        }));
    }, [selecciones, perfilActivo]);
    // ─── Landing / Profile selector ───────────────────────────────────────────
    if (!perfilActivo) {
        return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col", children: [_jsxs("div", { className: "relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("img", { src: "/images/hero.png", alt: "", className: "w-full h-full object-cover opacity-20" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white" })] }), _jsx("div", { className: "relative max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-4 text-center", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 400, damping: 30 }, children: [_jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.1 }, className: "inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm mb-4 border border-white/50", children: [_jsx("div", { className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-xs font-bold tracking-wide text-slate-700 uppercase", children: "Bienvenido a su plan" })] }), _jsxs("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]", children: ["Nutrici\u00F3n inteligente,", _jsx("br", { className: "hidden sm:block" }), _jsx("span", { className: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm", children: "sin complicaciones." })] }), _jsx("p", { className: "text-sm md:text-lg text-slate-600 max-w-xl mx-auto font-medium leading-relaxed", children: "Elige de forma individual o armen su lista de compras juntos de forma autom\u00E1tica." })] }) })] }), _jsxs("div", { className: "flex-1 max-w-4xl mx-auto px-4 md:px-6 pb-12 w-full z-10 relative -mt-2", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6", children: [_jsxs(motion.button, { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.1 }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => { setPerfilActivo('vo'); setDiaActivo('Lunes'); setTab('plan'); }, className: "text-left group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0", children: [_jsx("div", { className: "absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl" }), _jsx("div", { className: "absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5", children: _jsx("span", { className: "text-2xl font-bold text-white", children: "V(o)" }) }), _jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Perfil V(o)" }), _jsx("p", { className: "text-blue-100 text-sm mb-4 leading-relaxed", children: perfilesData.vo.perfil }), _jsxs("div", { className: "flex items-center gap-2 text-blue-200 text-sm", children: [_jsx(TrendingDown, { className: "w-4 h-4" }), _jsx("span", { children: perfilesData.vo.meta })] }), _jsx("div", { className: "mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors", children: "Ver mi plan \u2192" })] })] }), _jsxs(motion.button, { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.15 }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => { setPerfilActivo('va'); setDiaActivo('Lunes'); setTab('plan'); }, className: "text-left group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0", children: [_jsx("div", { className: "absolute -top-10 -right-10 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" }), _jsx("div", { className: "absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5", children: _jsx("span", { className: "text-2xl font-bold text-white", children: "V(a)" }) }), _jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Perfil V(a)" }), _jsx("p", { className: "text-rose-100 text-sm mb-4 leading-relaxed", children: perfilesData.va.perfil }), _jsxs("div", { className: "flex items-center gap-2 text-rose-200 text-sm", children: [_jsx(TrendingDown, { className: "w-4 h-4" }), _jsx("span", { children: perfilesData.va.meta })] }), _jsx("div", { className: "mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium group-hover:bg-white/30 transition-colors", children: "Ver mi plan \u2192" })] })] }), _jsxs(motion.button, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.2 }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, onClick: () => { setPerfilActivo('ambos'); setDiaActivo('Lunes'); setTab('plan'); }, className: "sm:col-span-2 text-left group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0", children: [_jsx("div", { className: "absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" }), _jsx("div", { className: "absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" }), _jsxs("div", { className: "relative flex items-center gap-6", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0", children: _jsx(Heart, { className: "w-8 h-8 text-white" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-1", children: "Plan de Ambos" }), _jsx("p", { className: "text-emerald-100 text-sm leading-relaxed", children: "Ve y selecciona platillos para ambos perfiles de forma simult\u00E1nea. \u00A1Ideal para planear y armar la lista del supermercado juntos!" })] })] })] })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.25 }, className: "mt-10 rounded-2xl overflow-hidden shadow-lg", children: _jsx("img", { src: "/images/meal-prep.png", alt: "Preparaci\u00F3n de comidas saludables", className: "w-full h-48 md:h-64 object-cover" }) })] })] }));
    }
    // ─── Main app ────────────────────────────────────────────────────────────────
    const ac = {
        color500: isAmbos ? '#10b981' : isVo ? '#3b82f6' : '#f43f5e',
        bg: isAmbos ? 'bg-emerald-500' : isVo ? 'bg-blue-500' : 'bg-rose-500',
        bgLight: isAmbos ? 'bg-emerald-50' : isVo ? 'bg-blue-50' : 'bg-rose-50',
        bgGradient: isAmbos ? 'from-emerald-500 to-teal-600' : isVo ? 'from-blue-500 to-indigo-600' : 'from-rose-500 to-pink-600',
        bgGradientLight: isAmbos ? 'from-emerald-50 to-teal-50' : isVo ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
        text: isAmbos ? 'text-emerald-600' : isVo ? 'text-blue-600' : 'text-rose-600',
        textDark: isAmbos ? 'text-emerald-900' : isVo ? 'text-blue-900' : 'text-rose-900',
        border: isAmbos ? 'border-emerald-200' : isVo ? 'border-blue-200' : 'border-rose-200',
        borderAccent: isAmbos ? 'border-emerald-500' : isVo ? 'border-blue-500' : 'border-rose-500',
        tagBg: isAmbos ? 'bg-emerald-100' : isVo ? 'bg-blue-100' : 'bg-rose-100',
        tagText: isAmbos ? 'text-emerald-700' : isVo ? 'text-blue-700' : 'text-rose-700',
        progressBg: isAmbos ? 'bg-emerald-100' : isVo ? 'bg-blue-100' : 'bg-rose-100',
        progressFill: isAmbos ? 'from-emerald-500 to-teal-500' : isVo ? 'from-blue-500 to-indigo-500' : 'from-rose-500 to-pink-500',
        btnActive: isAmbos
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
            : isVo
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25',
        btnInactive: 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
        dot: isAmbos ? 'bg-emerald-500' : isVo ? 'bg-blue-500' : 'bg-rose-500',
        cardDone: isAmbos
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-200'
            : isVo
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-blue-200'
                : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400 shadow-rose-200',
        cardPending: 'bg-white border-slate-200 shadow-sm',
        iconDone: 'bg-white/20',
        iconPending: isAmbos ? 'bg-emerald-50 border border-emerald-100' : isVo ? 'bg-blue-50 border border-blue-100' : 'bg-rose-50 border border-rose-100',
        iconColorPending: isAmbos ? 'text-emerald-400' : isVo ? 'text-blue-400' : 'text-rose-400',
        headerBg: isAmbos ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : isVo
            ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
            : 'bg-gradient-to-r from-rose-500 to-pink-600',
    };
    const accentColors = {
        bg: ac.bg, bgLight: ac.bgLight, bgGradient: ac.bgGradient,
        text: ac.text, border: ac.border, borderAccent: ac.borderAccent,
        tagBg: ac.tagBg, tagText: ac.tagText,
    };
    const totalMomentos = perfil.momentos.length;
    // Header height approx: 52px mobile, 56px desktop
    // Progress bar sticky height: ~56px (compact) or ~auto (expanded)
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50", "data-profile": perfilActivo, children: [_jsx(motion.header, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 sm:gap-3 min-w-0", children: [_jsx("button", { onClick: () => setPerfilActivo(null), className: "p-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-slate-600" }) }), _jsx("div", { className: `w-8 h-8 rounded-xl bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center shadow-md flex-shrink-0 hidden sm:flex`, children: _jsx(ChefHat, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("h1", { className: `text-sm sm:text-base font-bold ${ac.text} truncate`, children: ["Plan de ", isAmbos ? 'Ambos' : perfil.nombre] }), _jsx("p", { className: "text-[11px] text-slate-500 truncate hidden sm:block", children: isAmbos ? 'Vista combinada de V(o) y V(a)' : perfil.perfil })] })] }), _jsx("div", { className: "flex gap-1.5 flex-shrink-0", children: ['vo', 'va', 'ambos'].map((p) => (_jsx("button", { onClick: () => { setPerfilActivo(p); setDiaActivo('Lunes'); setTab('plan'); }, className: `px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${perfilActivo === p ? ac.btnActive : ac.btnInactive}`, children: p === 'ambos' ? 'Ambos' : perfilesData[p].nombre }, p))) })] }) }), _jsx(AnimatePresence, { children: tab === 'plan' && (_jsxs(motion.div, { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: { type: "spring", stiffness: 400, damping: 35 }, className: `sticky top-[52px] sm:top-[56px] z-40 bg-white/97 backdrop-blur-xl border-b ${ac.border} shadow-md`, children: [_jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100/60", children: _jsx("div", { className: "flex gap-1.5 overflow-x-auto snap-x scrollbar-none items-center", children: diasDisponibles.map((dia) => (_jsxs("button", { onClick: (e) => { e.stopPropagation(); setDiaActivo(dia); }, className: `py-1.5 px-3 rounded-xl font-bold transition-all duration-300 text-xs whitespace-nowrap snap-start flex-shrink-0 ${diaActivo === dia ? `${ac.btnActive} shadow-sm` : 'bg-slate-100/80 hover:bg-slate-200 text-slate-600'}`, children: [_jsx("span", { className: "sm:hidden", children: dia.slice(0, 3) }), _jsx("span", { className: "hidden sm:inline", children: dia })] }, dia))) }) }), _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 cursor-pointer select-none", onClick: () => setProgressExpanded((e) => !e), children: [_jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${ac.bgGradient} flex-shrink-0 shadow-sm`, children: _jsx(TrendingDown, { className: "w-3 h-3 text-white" }) }), _jsx("div", { className: "flex items-center gap-1 flex-shrink-0", children: perfil.momentos.map((momento) => {
                                        const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                                        const done = momentoCompletado[momento.key];
                                        return (_jsx("button", { title: `Ir a ${momento.label}`, onClick: (e) => { e.stopPropagation(); scrollToMomento(momento.key, progressExpanded); }, className: `w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${done
                                                ? `bg-gradient-to-br ${ac.bgGradient} shadow-sm hover:opacity-80`
                                                : `${ac.bgLight} border ${ac.border} hover:opacity-70`}`, children: done
                                                ? _jsx(CheckCircle2, { className: "w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" })
                                                : _jsx(Icon, { className: `w-2.5 h-2.5 sm:w-3 sm:h-3 ${ac.iconColorPending}` }) }, momento.key));
                                    }) }), _jsx("div", { className: `flex-1 h-1.5 ${ac.progressBg} rounded-full overflow-hidden`, children: _jsx(motion.div, { className: `h-full bg-gradient-to-r ${ac.progressFill} rounded-full`, animate: { width: `${progresoDia}%` }, transition: { type: 'spring', stiffness: 80, damping: 15 } }) }), _jsxs("span", { className: `text-[11px] sm:text-xs font-bold ${progresoDia === 100 ? 'text-emerald-600' : ac.text} flex-shrink-0 tabular-nums w-7 sm:w-8 text-right`, children: [progresoDia, "%"] }), _jsx("button", { className: `flex-shrink-0 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${vistaFiltrada ? `bg-gradient-to-br ${ac.bgGradient} text-white shadow-sm scale-105` : `hover:${ac.bgLight} ${ac.text}`}`, onClick: (e) => { e.stopPropagation(); setVistaFiltrada((v) => !v); }, title: vistaFiltrada ? 'Desactivar filtro' : 'Mostrar solo comidas seleccionadas', children: _jsx(ListChecks, { className: "w-4 h-4 sm:w-4 sm:h-4 text-inherit" }) }), _jsx("button", { className: `flex-shrink-0 p-1 rounded-full hover:${ac.bgLight} transition-colors`, onClick: (e) => { e.stopPropagation(); setProgressExpanded((x) => !x); }, "aria-label": progressExpanded ? 'Colapsar progreso' : 'Expandir progreso', children: progressExpanded
                                        ? _jsx(ChevronUp, { className: `w-4 h-4 ${ac.text}` })
                                        : _jsx(ChevronDown, { className: `w-4 h-4 ${ac.text}` }) })] }), _jsx(AnimatePresence, { children: progressExpanded && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { type: "spring", stiffness: 400, damping: 35 }, className: "overflow-hidden", children: _jsxs("div", { className: `max-w-5xl mx-auto px-4 sm:px-6 pb-4 pt-1`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("p", { className: "text-[11px] text-slate-500", children: [completadosCount, " de ", totalMomentos, " momentos completados"] }), progresoDia === 100 && (_jsxs("span", { className: "text-[11px] font-semibold text-emerald-600 flex items-center gap-1", children: [_jsx(CheckCircle2, { className: "w-3.5 h-3.5" }), "\u00A1D\u00EDa completo! \uD83C\uDF89"] }))] }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: perfil.momentos.map((momento) => {
                                                const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                                                const done = momentoCompletado[momento.key];
                                                const shortLabel = momento.label
                                                    .replace('Colación ', 'Col. ')
                                                    .replace('mañana', 'AM')
                                                    .replace('tarde', 'PM');
                                                return (_jsxs(motion.button, { animate: { scale: done ? 1.03 : 1 }, whileTap: { scale: 0.95 }, transition: { type: 'spring', stiffness: 260, damping: 20 }, onClick: (e) => { e.stopPropagation(); scrollToMomento(momento.key, true); }, className: `relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border shadow-sm transition-all duration-300 cursor-pointer text-left w-full ${done ? ac.cardDone : `${ac.cardPending} hover:shadow-md`}`, children: [_jsx("div", { className: `w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${done ? ac.iconDone : ac.iconPending}`, children: done
                                                                ? _jsx(CheckCircle2, { className: "w-4 h-4 sm:w-5 sm:h-5 text-white" })
                                                                : _jsx(Icon, { className: `w-4 h-4 sm:w-5 sm:h-5 ${ac.iconColorPending}` }) }), _jsx("span", { className: `text-[9px] sm:text-[10px] font-semibold text-center leading-tight ${done ? 'text-white' : 'text-slate-700'}`, children: shortLabel }), _jsx("span", { className: `text-[8px] sm:text-[9px] text-center leading-tight ${done ? 'text-white/70' : 'text-slate-400'}`, children: momento.hora }), done && (_jsx(motion.span, { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, className: "absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center shadow", children: _jsx(CheckCircle2, { className: "w-2.5 h-2.5 text-white" }) }))] }, momento.key));
                                            }) })] }) }, "progress-expanded")) })] }, `progress-${perfilActivo}`)) }), _jsxs("main", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-28 sm:pb-8 space-y-4", children: [perfil.notaSalud && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-xs sm:text-sm text-amber-800 font-medium leading-relaxed", children: perfil.notaSalud })] })), _jsx("div", { className: "hidden sm:block", children: _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 400, damping: 30 }, className: "flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl", children: ([
                                { key: 'plan', label: 'Mi Plan', icon: Calendar },
                                { key: 'equivalencias', label: 'Equivalencias', icon: BookOpen },
                                { key: 'compras', label: 'Compras', icon: ShoppingCart },
                                { key: 'resumen', label: 'Resumen', icon: Lightbulb },
                            ]).map((t) => (_jsxs("button", { onClick: () => setTab(t.key), className: `flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] font-bold text-sm transition-all duration-300 active:scale-95 ${tab === t.key ? `bg-white shadow-sm ${ac.text}` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`, children: [_jsx(t.icon, { className: "w-4 h-4 flex-shrink-0" }), _jsx("span", { children: t.label })] }, t.key))) }) }), _jsx("div", { className: "sm:hidden fixed bottom-0 left-0 right-0 z-50 px-2 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_30px_rgba(0,0,0,0.04)]", style: { paddingBottom: 'env(safe-area-inset-bottom)' }, children: _jsx("div", { className: "flex justify-around items-center max-w-sm mx-auto pt-1.5 pb-1.5", children: ([
                                { key: 'plan', label: 'Plan', icon: Calendar },
                                { key: 'equivalencias', label: 'Extras', icon: BookOpen },
                                { key: 'compras', label: 'Compras', icon: ShoppingCart },
                                { key: 'resumen', label: 'Resumen', icon: Lightbulb },
                            ]).map((t) => {
                                const active = tab === t.key;
                                return (_jsxs("button", { onClick: () => setTab(t.key), className: `relative flex flex-col items-center justify-center gap-1 w-[72px] py-1 transition-all duration-200 active:scale-95 ${active ? ac.text : 'text-slate-400 hover:text-slate-500'}`, children: [_jsxs("div", { className: `relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${active ? `bg-gradient-to-br ${ac.bgGradientLight} shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-${ac.border.split('-')[1]}-100` : 'bg-transparent'}`, children: [_jsx(t.icon, { className: `w-[18px] h-[18px] ${active ? `fill-current opacity-20 absolute` : ''}` }), _jsx(t.icon, { className: "w-[18px] h-[18px] relative z-10", strokeWidth: active ? 2.5 : 2 })] }), _jsx("span", { className: `text-[10px] tracking-wide ${active ? `font-extrabold ${ac.textDark}` : 'font-medium'}`, children: t.label })] }, t.key));
                            }) }) }), _jsxs(AnimatePresence, { mode: "wait", children: [tab === 'plan' && (_jsx(motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { type: "spring", stiffness: 400, damping: 30 }, className: "space-y-4", children: _jsx("div", { className: "space-y-4", children: perfilBase.momentos.map((momento) => {
                                        const Icon = momentoIcons[momento.key] || UtensilsCrossed;
                                        const done = momentoCompletado[momento.key];
                                        // Helper para filtrar comidas seleccionadas
                                        const filterMeals = (perfilId, meals) => {
                                            if (!vistaFiltrada)
                                                return meals;
                                            return meals.filter(m => selecciones[`${perfilId}-${diaActivo}-${momento.key}-${m.nombre}`]);
                                        };
                                        const mealsSingle = filterMeals(perfilActivo, perfilBase.plan[diaActivo]?.[momento.key] || []);
                                        const mealsVO = filterMeals('vo', perfilesData.vo.plan[diaActivo]?.[momento.key] || []);
                                        const mealsVA = filterMeals('va', perfilesData.va.plan[diaActivo]?.[momento.key] || []);
                                        // Si la vista está filtrada y no hay comidas seleccionadas en este momento para el perfil activo
                                        const isElegidoVacio = vistaFiltrada && (isAmbos ? (mealsVO.length === 0 && mealsVA.length === 0) : mealsSingle.length === 0);
                                        return (_jsxs(motion.div, { layout: true, ref: (el) => { mealSectionRefs.current[momento.key] = el; }, className: `bg-white rounded-[28px] sm:rounded-3xl shadow-sm border overflow-hidden ${done ? ac.borderAccent : 'border-slate-100'}`, children: [_jsxs("button", { onClick: () => {
                                                        if (!vistaFiltrada) {
                                                            setMomentosColapsados(p => ({ ...p, [momento.key]: !p[momento.key] }));
                                                        }
                                                    }, className: `w-full flex items-center justify-between text-left p-4 sm:p-5 transition-colors focus:outline-none ${done ? 'bg-slate-50/50' : 'hover:bg-slate-50'} ${vistaFiltrada ? 'cursor-default' : ''}`, children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900 flex items-center gap-2", children: [_jsx("div", { className: `w-7 h-7 rounded-lg bg-gradient-to-br ${ac.bgGradient} flex items-center justify-center flex-shrink-0`, children: _jsx(Icon, { className: "w-3.5 h-3.5 text-white" }) }), _jsx("span", { className: "truncate", children: momento.label }), done && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 400, damping: 25 }, children: _jsx(CheckCircle2, { className: `w-4 h-4 flex-shrink-0 ${isVo ? 'text-blue-500' : 'text-rose-500'}` }) })), _jsx("span", { className: "text-[10px] font-normal text-slate-400 ml-2 whitespace-nowrap", children: momento.hora })] }), vistaFiltrada ? (_jsx("div", { className: `w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br ${ac.bgGradient}` })) : (_jsx(motion.div, { animate: { rotate: momentosColapsados[momento.key] ? -180 : 0 }, transition: { type: "spring", damping: 20 }, children: _jsx(ChevronUp, { className: "w-5 h-5 text-slate-400" }) }))] }), _jsx(AnimatePresence, { initial: false, children: (!momentosColapsados[momento.key] || vistaFiltrada) && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { type: "spring", damping: 26, stiffness: 200 }, children: _jsx("div", { className: "px-4 sm:px-5 pb-4 sm:pb-5 pt-0", children: isElegidoVacio ? (_jsxs("div", { className: "text-center py-6 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200", children: [_jsx("p", { className: "text-slate-500 text-sm font-medium", children: "Ning\u00FAn platillo reservado" }), _jsx("p", { className: "text-slate-400 text-xs mt-1", children: "Desactiva el filtro superior para ver las opciones disponibles y marcar tu comida." })] })) : (_jsxs(_Fragment, { children: [!isAmbos && (vistaFiltrada ? (_jsx("div", { className: "space-y-3", children: mealsSingle.map((meal, idx) => (_jsxs("div", { className: `p-4 rounded-xl border border-slate-100 bg-gradient-to-r ${ac.bgLight} to-transparent`, children: [_jsx("h4", { className: `font-bold text-sm mb-1 ${ac.text}`, children: meal.nombre }), _jsx("p", { className: "text-slate-600 text-xs leading-relaxed", children: meal.detalle }), meal.super && meal.super.length > 0 && (_jsxs("div", { className: "mt-2 text-[10px] text-slate-400 font-medium", children: ["\u2728 ", meal.super.join(', ')] }))] }, idx))) })) : (_jsx(MealSelector, { perfil: perfilActivo, comidas: mealsSingle, dia: diaActivo, momento: momento.key, selecciones: selecciones, onToggle: toggleSeleccion, accentClasses: accentColors }))), isAmbos && (vistaFiltrada ? (_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [(mealsVO.length > 0 || mealsVA.length === 0) && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2", children: ["Para ", perfilesData.vo.nombre] }), mealsVO.map((meal, idx) => (_jsxs("div", { className: "p-4 rounded-xl border border-blue-50 bg-gradient-to-r from-blue-50 to-transparent", children: [_jsx("h4", { className: "font-bold text-sm mb-1 text-blue-800", children: meal.nombre }), _jsx("p", { className: "text-slate-600 text-xs leading-relaxed", children: meal.detalle }), meal.super && meal.super.length > 0 && (_jsxs("div", { className: "mt-2 text-[10px] text-blue-400/80 font-medium tracking-tight", children: ["\u2728 ", meal.super.join(', ')] }))] }, idx)))] })), (mealsVA.length > 0 || mealsVO.length === 0) && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2", children: ["Para ", perfilesData.va.nombre] }), mealsVA.map((meal, idx) => (_jsxs("div", { className: "p-4 rounded-xl border border-rose-50 bg-gradient-to-r from-rose-50 to-transparent", children: [_jsx("h4", { className: "font-bold text-sm mb-1 text-rose-800", children: meal.nombre }), _jsx("p", { className: "text-slate-600 text-xs leading-relaxed", children: meal.detalle }), meal.super && meal.super.length > 0 && (_jsxs("div", { className: "mt-2 text-[10px] text-rose-400/80 font-medium tracking-tight", children: ["\u2728 ", meal.super.join(', ')] }))] }, idx)))] }))] })) : (_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-3 bg-blue-50/50 rounded-xl border border-blue-100", children: [_jsxs("h4", { className: "font-bold text-blue-800 text-xs mb-2", children: ["Para ", perfilesData.vo.nombre] }), _jsx(MealSelector, { perfil: "vo", comidas: mealsVO, dia: diaActivo, momento: momento.key, selecciones: selecciones, onToggle: toggleSeleccion, accentClasses: {
                                                                                            bg: 'bg-blue-500', bgLight: 'bg-blue-50', bgGradient: 'from-blue-500 to-indigo-600',
                                                                                            text: 'text-blue-600', border: 'border-blue-200', borderAccent: 'border-blue-500',
                                                                                            tagBg: 'bg-blue-100', tagText: 'text-blue-700'
                                                                                        } })] }), _jsxs("div", { className: "p-3 bg-rose-50/50 rounded-xl border border-rose-100", children: [_jsxs("h4", { className: "font-bold text-rose-800 text-xs mb-2", children: ["Para ", perfilesData.va.nombre] }), _jsx(MealSelector, { perfil: "va", comidas: mealsVA, dia: diaActivo, momento: momento.key, selecciones: selecciones, onToggle: toggleSeleccion, accentClasses: {
                                                                                            bg: 'bg-rose-500', bgLight: 'bg-rose-50', bgGradient: 'from-rose-500 to-pink-600',
                                                                                            text: 'text-rose-600', border: 'border-rose-200', borderAccent: 'border-rose-500',
                                                                                            tagBg: 'bg-rose-100', tagText: 'text-rose-700'
                                                                                        } })] })] })))] })) }) }, "content")) })] }, momento.key));
                                    }) }) }, "plan")), tab === 'equivalencias' && (_jsx(motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { type: "spring", stiffness: 400, damping: 30 }, className: "space-y-6", children: isAmbos ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-2 mx-auto max-w-xs shadow-inner w-full", children: [_jsx("button", { onClick: () => setAmbosSubTab('vo'), className: `flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'vo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`, children: perfilesData.vo.nombre }), _jsx("button", { onClick: () => setAmbosSubTab('va'), className: `flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'va' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`, children: perfilesData.va.nombre })] }), _jsxs("div", { className: "grid lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: `${ambosSubTab === 'vo' ? 'block' : 'hidden lg:block'}`, children: [_jsxs("h3", { className: "text-sm font-bold text-blue-800 mb-3 px-1 uppercase tracking-wider", children: ["Equivalencias de ", perfilesData.vo.nombre] }), _jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4", children: equivalenciasData.vo.map((eq, idx) => (_jsx(EquivalenciasCard, { equivalencia: eq, delay: idx * 0.05, accentClasses: { ...ac, bgLight: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100', tagText: 'text-blue-700' } }, 'vo' + idx))) })] }), _jsxs("div", { className: `${ambosSubTab === 'va' ? 'block' : 'hidden lg:block'}`, children: [_jsxs("h3", { className: "text-sm font-bold text-rose-800 mb-3 px-1 uppercase tracking-wider", children: ["Equivalencias de ", perfilesData.va.nombre] }), _jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4", children: equivalenciasData.va.map((eq, idx) => (_jsx(EquivalenciasCard, { equivalencia: eq, delay: idx * 0.05, accentClasses: { ...ac, bgLight: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100', tagText: 'text-rose-700' } }, 'va' + idx))) })] })] })] })) : (_jsx("div", { className: "grid md:grid-cols-2 gap-4", children: equivalencias.map((eq, idx) => (_jsx(EquivalenciasCard, { equivalencia: eq, delay: idx * 0.05, accentClasses: accentColors }, idx))) })) }, "equivalencias")), tab === 'resumen' && (_jsxs(motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { type: "spring", stiffness: 400, damping: 30 }, className: `w-full overflow-hidden sm:overflow-visible flex flex-col`, children: [isAmbos && (_jsxs("div", { className: "lg:hidden flex bg-slate-100 p-1.5 rounded-xl mb-4 mx-auto max-w-xs shadow-inner w-full", children: [_jsx("button", { onClick: () => setAmbosSubTab('vo'), className: `flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'vo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`, children: perfilesData.vo.nombre }), _jsx("button", { onClick: () => setAmbosSubTab('va'), className: `flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${ambosSubTab === 'va' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`, children: perfilesData.va.nombre })] })), _jsx("div", { className: isAmbos ? "grid lg:grid-cols-2 gap-8" : "space-y-10", children: (isAmbos ? [perfilesData.vo, perfilesData.va] : [perfil]).map((p, pIdx) => {
                                            const isFirst = pIdx === 0;
                                            const pfKey = isFirst ? 'vo' : 'va';
                                            const hiddenClass = isAmbos ? (ambosSubTab === pfKey ? 'block' : 'hidden lg:block') : 'block';
                                            const dynamicAc = isAmbos ? {
                                                ...ac,
                                                color500: isFirst ? '#3b82f6' : '#f43f5e',
                                                text: isFirst ? 'text-blue-600' : 'text-rose-600',
                                                textDark: isFirst ? 'text-blue-900' : 'text-rose-900',
                                                bgLight: isFirst ? 'bg-blue-50' : 'bg-rose-50',
                                                bgGradientLight: isFirst ? 'from-blue-50 to-indigo-50' : 'from-rose-50 to-pink-50',
                                                border: isFirst ? 'border-blue-200' : 'border-rose-200',
                                                dot: isFirst ? 'bg-blue-500' : 'bg-rose-500',
                                            } : ac;
                                            return (_jsxs("div", { className: `space-y-4 ${hiddenClass}`, children: [isAmbos && (_jsxs("h3", { className: `text-lg font-bold pb-2 border-b-2 mt-4 ${isFirst ? 'text-blue-800 border-blue-200' : 'text-rose-800 border-rose-200'}`, children: ["Resumen de ", p.nombre] })), p.objetivosPorMomento && (_jsxs("div", { className: "bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100/80 overflow-hidden relative w-full", children: [_jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10" }), _jsxs("h3", { className: "font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base", children: [_jsx(BarChart3, { className: `w-4 h-4 ${dynamicAc.text}` }), "Tabla de Macros y Porciones"] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:hidden mt-4", children: [
                                                                    { key: 'frutas', label: 'Frutas', icon: '🍎' },
                                                                    { key: 'verduras', label: 'Verduras', icon: '🥦' },
                                                                    { key: 'cereales', label: 'Cereales', icon: '🥐' },
                                                                    { key: 'proteina', label: 'Proteína', icon: '🥩' },
                                                                    { key: 'grasas', label: 'Grasas', icon: '🥑' },
                                                                    { key: 'leche', label: 'Leche', icon: '🥛' },
                                                                ].map(cat => {
                                                                    const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                                                                    const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento[m]?.[cat.key] || 0), 0);
                                                                    if (total === 0 && cat.key !== 'leche')
                                                                        return null;
                                                                    return (_jsxs("div", { className: "bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "font-medium text-slate-700 text-xs flex items-center gap-1.5", children: [_jsx("span", { className: "text-sm", children: cat.icon }), " ", _jsx("span", { className: "truncate", children: cat.label })] }), _jsx("span", { className: `font-black ${dynamicAc.text} text-sm bg-white shadow-sm px-1.5 rounded-md`, children: total })] }), _jsx("div", { className: "flex justify-between items-center text-[10px] text-slate-400 font-medium px-1", children: mKeys.map(m => {
                                                                                    const val = p.objetivosPorMomento[m]?.[cat.key] || 0;
                                                                                    return _jsx("span", { className: val > 0 ? 'text-slate-600 font-bold' : 'opacity-20', children: val > 0 ? val : '-' }, m);
                                                                                }) })] }, cat.key));
                                                                }) }), _jsxs("div", { className: "flex justify-between items-center sm:hidden mt-2 px-1 text-[7px] uppercase tracking-widest text-slate-400 font-bold opacity-60", children: [_jsx("span", {}), _jsxs("div", { className: "flex gap-2", children: [_jsx("span", { children: "Des" }), _jsx("span", { children: "Cam" }), _jsx("span", { children: "Com" }), _jsx("span", { children: "Cpm" }), _jsx("span", { children: "Cen" })] })] }), _jsx("div", { className: "hidden sm:block overflow-x-auto w-full scrollbar-none", children: _jsxs("table", { className: "w-full text-left text-sm min-w-max", children: [_jsx("thead", { children: _jsxs("tr", { className: `border-b-2 ${dynamicAc.border} text-slate-400 font-bold uppercase tracking-wider text-[11px]`, children: [_jsx("th", { className: "p-3 pb-3 sticky left-0 bg-white/95 backdrop-blur-md z-10 w-28", children: "Grupo" }), ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'].map(l => _jsx("th", { className: "p-3 pb-3 text-center w-16", children: l }, l)), _jsx("th", { className: "p-3 pb-3 text-center bg-slate-50/50 rounded-tr-xl w-16", children: "Total" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100/60", children: [
                                                                                { key: 'frutas', label: 'Frutas', icon: '🍎' },
                                                                                { key: 'verduras', label: 'Verduras', icon: '🥦' },
                                                                                { key: 'cereales', label: 'Cereales', icon: '🥐' },
                                                                                { key: 'proteina', label: 'Proteína', icon: '🥩' },
                                                                                { key: 'grasas', label: 'Grasas', icon: '🥑' },
                                                                                { key: 'leche', label: 'Leche', icon: '🥛' },
                                                                            ].map((cat) => {
                                                                                const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];
                                                                                const total = mKeys.reduce((acc, m) => acc + (p.objetivosPorMomento[m]?.[cat.key] || 0), 0);
                                                                                if (total === 0 && cat.key !== 'leche')
                                                                                    return null;
                                                                                return (_jsxs("tr", { className: "hover:bg-slate-50/70 transition-colors group", children: [_jsxs("td", { className: "p-3 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-md z-10 font-bold text-slate-700 flex items-center gap-2 border-r border-transparent group-hover:border-slate-100/50 transition-colors", children: [_jsx("span", { className: "text-base drop-shadow-sm", children: cat.icon }), " ", cat.label] }), mKeys.map(m => {
                                                                                            const val = p.objetivosPorMomento[m]?.[cat.key] || 0;
                                                                                            return (_jsx("td", { className: `p-3 text-center font-medium ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`, children: val > 0 ? val : '-' }, m));
                                                                                        }), _jsx("td", { className: `p-3 text-center font-bold ${dynamicAc.text} bg-slate-50/50`, children: total })] }, cat.key));
                                                                            }) })] }) })] })), _jsxs("div", { className: "relative rounded-2xl overflow-hidden shadow-sm", children: [_jsx("img", { src: "/images/meal-prep.png", alt: "Plan de comidas", className: "w-full h-36 sm:h-44 object-cover" }), _jsx("div", { className: `absolute inset-0 bg-gradient-to-r ${dynamicAc.bgGradient} opacity-60` }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("h2", { className: "text-xl sm:text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(Shield, { className: "w-6 h-6" }), "Sobre ", p.nombre] }) })] }), p.notaSalud && (_jsxs("div", { className: "flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-xs sm:text-sm text-amber-800 font-medium leading-relaxed", children: p.notaSalud })] })), _jsxs("div", { className: "bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100", children: [_jsxs("h3", { className: "font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base", children: [_jsx(Heart, { className: `w-4 h-4 ${dynamicAc.text}` }), "Puntos clave de tu plan"] }), _jsx("div", { className: "space-y-2.5", children: p.resumenPersonal.map((linea, idx) => (_jsxs(motion.div, { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 }, transition: { delay: idx * 0.07 }, className: "flex gap-3 p-3 rounded-xl bg-slate-50", style: { borderLeft: `3px solid ${dynamicAc.color500}` }, children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full ${dynamicAc.dot} mt-1.5 flex-shrink-0` }), _jsx("p", { className: "text-xs sm:text-sm text-slate-700 leading-relaxed", children: linea })] }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: `bg-gradient-to-br ${dynamicAc.bgGradientLight} rounded-2xl p-4 border ${dynamicAc.border}`, children: [_jsxs("h3", { className: `font-bold ${dynamicAc.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`, children: [_jsx(TrendingDown, { className: "w-3.5 h-3.5" }), " Meta"] }), _jsx("p", { className: `${dynamicAc.text} text-xs sm:text-sm`, children: p.meta })] }), _jsxs("div", { className: `bg-gradient-to-br ${isAmbos ? (isFirst ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-rose-50 to-pink-50 border-rose-200') : 'from-emerald-50 to-green-50 border-emerald-200'} rounded-2xl p-4 border`, children: [_jsx("h3", { className: `font-bold ${isAmbos ? (isFirst ? 'text-blue-900' : 'text-rose-900') : 'text-emerald-900'} mb-1.5 text-xs sm:text-sm`, children: "Perfil" }), _jsx("p", { className: `${isAmbos ? (isFirst ? 'text-blue-700' : 'text-rose-700') : 'text-emerald-700'} text-xs sm:text-sm`, children: p.perfil })] })] })] }, p.perfil));
                                        }) })] }, "resumen")), tab === 'compras' && (_jsx(motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { type: "spring", stiffness: 400, damping: 30 }, className: "space-y-4", children: _jsxs("div", { className: "bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 overflow-hidden relative", children: [_jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" }), _jsxs("h2", { className: "text-2xl font-black tracking-tight text-slate-900 mb-2 flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-[14px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm flex items-center justify-center`, children: _jsx(ShoppingCart, { className: "w-5 h-5 text-white" }) }), "Supermercado"] }), _jsxs("p", { className: "text-sm font-medium text-slate-500 mb-6 leading-relaxed max-w-xl", children: ["Tienes ", _jsxs("strong", { className: "text-emerald-600", children: [listaCompras.length, " ingredientes"] }), " en tu lista basados en tus platillos seleccionados. Recuerda revisar la alacena antes de salir."] }), listaCompras.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-slate-50 rounded-[20px] border-dashed border-2 border-slate-200", children: [_jsx(ShoppingCart, { className: "w-10 h-10 text-slate-300 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500 font-bold", children: "Carrito vac\u00EDo" }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Ve a \"Mi Plan\" y selecciona comidas para agregar ingredientes autom\u00E1ticamente." })] })) : (_jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: listaCompras.map((item) => {
                                                const isChecked = comprasCheck[item.ingrediente];
                                                return (_jsxs(motion.div, { whileTap: { scale: 0.98 }, onClick: () => setComprasCheck(prev => ({ ...prev, [item.ingrediente]: !prev[item.ingrediente] })), className: `group p-0 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${isChecked ? 'bg-slate-50 border-emerald-200 opacity-60' : 'bg-white border-slate-100 hover:shadow-md'}`, children: [_jsx("div", { className: `w-1.5 transition-colors ${isChecked ? 'bg-emerald-400' : 'bg-gradient-to-b from-slate-200 to-transparent group-hover:from-emerald-400 group-hover:to-teal-500'}` }), _jsxs("div", { className: "p-4 sm:p-5 flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start gap-4 mb-3", children: [_jsx("div", { className: `w-6 h-6 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-200 group-hover:border-emerald-500 bg-slate-50'}`, children: isChecked && _jsx(CheckCircle2, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h3", { className: `font-bold tracking-tight text-base capitalize leading-snug break-words ${isChecked ? 'text-slate-500 line-through' : 'text-slate-800'}`, children: item.ingrediente }), _jsxs("p", { className: "text-xs text-slate-400 mt-0.5 font-medium", children: [item.usos.length, " recet", item.usos.length > 1 ? 'as' : 'a', " lo ocupa", item.usos.length > 1 ? 'n' : ''] })] })] }), _jsx("ul", { className: "space-y-2 ml-10", children: item.usos.map((uso, idx) => (_jsxs("li", { className: `flex gap-2 text-xs relative rounded-lg p-2 items-center ${isChecked ? 'bg-slate-100/50' : 'bg-slate-50'}`, children: [_jsx("span", { className: `px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${uso.perfil === 'vo' ? 'bg-blue-100/80 text-blue-700' : 'bg-rose-100/80 text-rose-700'}`, children: uso.perfil }), _jsx("span", { className: `font-medium leading-snug break-words ${isChecked ? 'text-slate-400' : 'text-slate-600'}`, children: uso.texto })] }, idx))) })] })] }, item.ingrediente));
                                            }) }))] }) }, "compras"))] })] }), _jsx("footer", { className: "border-t border-slate-100 bg-white/50 mt-10", children: _jsx("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-slate-500 text-xs sm:text-sm", children: _jsxs("p", { className: "flex items-center justify-center gap-2", children: [_jsx(ChefHat, { className: "w-3.5 h-3.5" }), "Plan de alimentaci\u00F3n personalizado \u2014 2026"] }) }) })] }));
}
