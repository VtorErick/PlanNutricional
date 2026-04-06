import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { useDiet } from '../../context/DietContext';

export default function Header() {
  const { setPerfilActivo, perfilActivo, setDiaActivo, setTab, perfilesData, ac } = useDiet();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        
        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setPerfilActivo(null)}
            className="p-2.5 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          {/* Logo (solo en sm+) */}
          <div
            className={`hidden sm:flex w-9 h-9 rounded-2xl bg-gradient-to-br ${ac.bgGradient} items-center justify-center shadow-sm`}
          >
            <ChefHat className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* RIGHT - perfiles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(['el', 'ella', 'ambos'] as const).map((p) => {
            const isActive = perfilActivo === p;

            return (
              <button
                key={p}
                onClick={() => {
                  setPerfilActivo(p);
                  setDiaActivo('Lunes');
                  setTab('plan');
                }}
                className={`
                  px-3 py-1.5 sm:px-3.5 sm:py-2
                  rounded-2xl
                  text-[11px] sm:text-xs font-bold
                  transition-all duration-300
                  whitespace-nowrap
                  border
                  ${
                    isActive
                      ? `${ac.btnActive} shadow-sm scale-[1.03] border-transparent`
                      : `${ac.btnInactive} border-slate-200 hover:bg-slate-100`
                  }
                `}
              >
                {p === 'ambos'
                  ? 'Ambos'
                  : perfilesData[p]?.nombre || p}
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}