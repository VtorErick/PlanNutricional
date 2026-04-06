import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { Profile } from '../../data';

import { useDiet } from '../../context/DietContext';

export default function Header() {
  const { setPerfilActivo, perfilActivo, setDiaActivo, setTab, perfilesData, ac } = useDiet();
  return (
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
        </div>
        <div className="flex gap-1.5 flex-shrink-0 items-center">
          {(['el', 'ella', 'ambos'] as const).map((p) => (
            <button key={p}
              onClick={() => { setPerfilActivo(p); setDiaActivo('Lunes'); setTab('plan'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${perfilActivo === p ? ac.btnActive : ac.btnInactive}`}
            >
              {p === 'ambos' ? 'Ambos' : perfilesData[p]?.nombre || p}
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
