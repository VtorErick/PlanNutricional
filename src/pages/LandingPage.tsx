import { motion } from 'framer-motion';
import { TrendingDown, Settings, Sparkles, Wand2, Zap } from 'lucide-react';
import { useLandingPage } from '../features/landing/hooks/useLandingPage';

export function LandingPage() {
  const {
    elReady,
    ellaReady,
    hasCustomPlan,
    perfilesData,
    elImcData,
    ellaImcData,
    ambosInsights,
    formatProfileForCard,
    selectProfile,
    generateProfile,
    goToAdmin,
    ambosButtonConfig,
  } = useLandingPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero.png" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-5 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm mb-4 border border-white/50"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold tracking-wide text-slate-700 uppercase">Bienvenido a su plan</span>
            </motion.div>
            <div className="mb-4">
              <button
                onClick={goToAdmin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Settings className="w-4 h-4" />
                <span>Mi perfil</span>
              </button>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]">
              Nutrición inteligente,<br className="hidden sm:block"/>
              <span className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
                sin complicaciones.
              </span>
            </h1>
            <p className="text-sm md:text-lg text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Elige tu plan individual o armen su lista de compras juntos de forma automática.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-4 md:px-6 pb-12 w-full z-10 relative -mt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">✅ Plan editable</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-sm">🛒 Lista de compras</span>
        </div>
        
        {!hasCustomPlan && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 sm:px-4 sm:py-3 text-center shadow-sm">
            <p className="text-xs sm:text-sm text-sky-900 font-semibold leading-snug">
              Selecciona un perfil para personalizar tu plan con IA.
            </p>
          </div>
        )}
        
        {elReady && ellaReady && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 sm:px-4 sm:py-3 text-center shadow-sm">
            <p className="text-xs sm:text-sm text-emerald-800 font-semibold leading-snug">
              ✅ ¡Todo listo! Los planes personalizados para ambos han sido generados.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-stretch">
          <motion.button
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => selectProfile('el')}
            className="h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                  <span className="text-2xl">👨</span>
                </div>
                <div>
                  <span className="text-xs text-blue-200 font-medium uppercase tracking-wider">Ver plan de</span>
                  <h3 className="text-xl font-bold text-white">Él</h3>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed min-h-[72px]">{formatProfileForCard(perfilesData.el.perfil)}</p>
              
              {elImcData && (
                <div className="mb-3 min-h-[70px]">
                  <div className="h-4 mb-1 flex items-center justify-between text-[11px] text-blue-100 font-semibold">
                    <span>IMC {elImcData.imc}</span>
                    <span>{elImcData.label}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div className={`h-full ${elImcData.color}`} style={{ width: `${elImcData.pct}%` }} />
                    <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-blue-300/80" style={{ left: `${elImcData.pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-blue-100/90">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Normal</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" />Sobrepeso</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Obesidad</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2 text-blue-200 text-xs sm:text-sm mt-auto mb-2 min-h-[88px]">
                <TrendingDown className="w-4 h-4 shrink-0" />
                <span>{perfilesData.el.meta}</span>
              </div>
              
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); generateProfile('el'); }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all shadow-lg ${elReady ? 'bg-gradient-to-r from-white/90 to-white/80 text-blue-700 border-white shadow-blue-500/30 hover:shadow-blue-500/50' : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white border-amber-300 shadow-amber-500/40 hover:shadow-amber-500/60 animate-pulse'}`}
              >
                <motion.span 
                  animate={{ rotate: [0, 15, -15, 0] }} 
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  {elReady ? <Sparkles className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                </motion.span>
                <span>{elReady ? 'Actualizar con IA' : 'Personalizar con IA'}</span>
              </motion.button>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.15 }}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => selectProfile('ella')}
            className="h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-5 sm:p-6 md:p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
          >
            {ellaReady && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-emerald-500/95 text-white text-[10px] font-bold shadow-sm">✅ Listo</div>
            )}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl" />
            <div className="relative h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
                <div>
                  <span className="text-xs text-rose-200 font-medium uppercase tracking-wider">Ver plan de</span>
                  <h3 className="text-xl font-bold text-white">Ella</h3>
                </div>
              </div>
              <p className="text-rose-50 text-sm mb-4 leading-relaxed min-h-[72px]">{formatProfileForCard(perfilesData.ella.perfil)}</p>
              
              {ellaImcData && (
                <div className="mb-3 min-h-[70px]">
                  <div className="h-4 mb-1 flex items-center justify-between text-[11px] text-rose-50 font-semibold">
                    <span>IMC {ellaImcData.imc}</span>
                    <span>{ellaImcData.label}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div className={`h-full ${ellaImcData.color}`} style={{ width: `${ellaImcData.pct}%` }} />
                    <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white border border-rose-300/80" style={{ left: `${ellaImcData.pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-rose-50/90">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" />Normal</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" />Sobrepeso</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Obesidad</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2 text-rose-100 text-xs sm:text-sm mt-auto mb-2 min-h-[88px]">
                <TrendingDown className="w-4 h-4 shrink-0" />
                <span>{perfilesData.ella.meta}</span>
              </div>
              
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); generateProfile('ella'); }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all shadow-lg ${ellaReady ? 'bg-gradient-to-r from-white/90 to-white/80 text-rose-700 border-white shadow-rose-500/30 hover:shadow-rose-500/50' : 'bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 text-white border-pink-300 shadow-pink-500/40 hover:shadow-pink-500/60 animate-pulse'}`}
              >
                <motion.span 
                  animate={{ rotate: [0, 15, -15, 0] }} 
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  {ellaReady ? <Sparkles className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                </motion.span>
                <span>{ellaReady ? 'Actualizar con IA' : 'Personalizar con IA'}</span>
              </motion.button>
            </div>
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => selectProfile('ambos')}
            className="col-span-2 h-full text-left group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 sm:p-5 md:p-7 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border-0"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />
            <div className="relative h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-2xl">👫</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-200 font-medium uppercase tracking-wider">Ver plan</span>
                  <h3 className="text-xl font-bold text-white">Ambos</h3>
                </div>
              </div>
              <div>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  Ve y selecciona platillos de ambos perfiles en una sola vista para organizar comidas y compras fácilmente.
                </p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-100/80">Adelanto IA</p>
                    <p className="text-sm font-semibold text-white">{ambosInsights.sharedMeals} comidas compartidas detectadas</p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-100/80">Sinergia</p>
                    <p className="text-sm font-semibold text-white">{ambosInsights.overlapPct}% de ingredientes en común</p>
                  </div>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); ambosButtonConfig.onClick(); }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all shadow-lg ${elReady && ellaReady ? 'bg-gradient-to-r from-white/95 to-white/90 text-emerald-700 border-white shadow-emerald-500/30 hover:shadow-emerald-500/50' : 'bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 text-white border-violet-300 shadow-violet-500/40 hover:shadow-violet-500/60 animate-pulse'}`}
              >
                <motion.span 
                  animate={elReady && ellaReady ? {} : { rotate: [0, 15, -15, 0] }} 
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  {elReady && ellaReady ? <Zap className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                </motion.span>
                <span>{ambosButtonConfig.label}</span>
              </motion.button>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

