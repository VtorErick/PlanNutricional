import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { Heart, TrendingDown, Shield, BarChart3 } from 'lucide-react';

const grupoCategorias = [
  { key: 'frutas', label: 'Frutas', icon: '🍎', color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'verduras', label: 'Verduras', icon: '🥦', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'cereales', label: 'Cereales', icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'proteina', label: 'Proteína', icon: '🥩', color: 'text-red-500', bg: 'bg-red-50' },
  { key: 'grasas', label: 'Grasas', icon: '🥑', color: 'text-lime-500', bg: 'bg-lime-50' },
  { key: 'lacteos', label: 'Lácteos', icon: '🥛', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'leguminosas', label: 'Leguminosas', icon: '🫘', color: 'text-amber-700', bg: 'bg-amber-100' },
] as const;

const mKeys = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'] as const;
const mLabels = ['Des', 'C.AM', 'Com', 'C.PM', 'Cen'] as const;
const mLabelsDesktop = ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'] as const;

interface PorcionesTableProps {
  perfil: any;
  accentColor: string;
  textColor: string;
  borderColor: string;
}

function PorcionesTable({ perfil, textColor }: PorcionesTableProps) {
  if (!perfil?.objetivosPorMomento) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100/80 overflow-hidden relative w-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10" />
      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
        <BarChart3 className={`w-4 h-4 ${textColor}`} />
        Tabla de Macros y Porciones
      </h3>

      {/* Mobile Grid Layout */}
      <div className="grid grid-cols-2 gap-3 sm:hidden mt-4">
        {grupoCategorias.map(cat => {
          const total = mKeys.reduce((acc, m) => acc + (perfil.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
          return (
            <div key={cat.key} className={`${cat.bg} rounded-xl p-3 border border-slate-100`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`font-bold text-slate-700 text-xs flex items-center gap-1.5 ${cat.color}`}>
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </span>
                <span className={`font-black ${cat.color} text-lg bg-white shadow-sm px-2 py-0.5 rounded-md min-w-[28px] text-center`}>{total}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {mKeys.map((m, idx) => {
                  const val = perfil.objetivosPorMomento?.[m]?.[cat.key] || 0;
                  const isActive = val > 0;
                  return (
                    <div key={m} className="flex flex-col items-center">
                      <span className={`text-[8px] font-bold uppercase ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>{mLabels[idx]}</span>
                      <span className={`text-sm font-bold ${isActive ? 'text-slate-700' : 'text-slate-300'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block overflow-x-auto w-full scrollbar-none">
        <table className="w-full text-left text-sm min-w-max">
          <thead>
            <tr className={`border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]`}>
              <th className="p-3 pb-3 sticky left-0 bg-white/95 backdrop-blur-md z-10 w-28">Grupo</th>
              {mLabelsDesktop.map(l => <th key={l} className="p-3 pb-3 text-center w-16">{l}</th>)}
              <th className={`p-3 pb-3 text-center bg-slate-50/50 rounded-tr-xl w-16`}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {grupoCategorias.map((cat) => {
              const total = mKeys.reduce((acc, m) => acc + (perfil.objetivosPorMomento?.[m]?.[cat.key] || 0), 0);
              return (
                <tr key={cat.key} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="p-3 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 backdrop-blur-md z-10 font-bold text-slate-700 flex items-center gap-2 border-r border-transparent group-hover:border-slate-100/50 transition-colors">
                    <span className="text-base drop-shadow-sm">{cat.icon}</span> {cat.label}
                  </td>
                  {mKeys.map(m => {
                    const val = perfil.objetivosPorMomento?.[m]?.[cat.key] || 0;
                    return (
                      <td key={m} className={`p-3 text-center font-medium ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                        {val}
                      </td>
                    );
                  })}
                  <td className={`p-3 text-center font-bold ${textColor} bg-slate-50/50`}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResumenPage() {
  const { perfilesData, perfilActivo, ac, isEl, isAmbos } = useAppContext();

  if (isAmbos) {
    return (
      <motion.div
        key="resumen-ambos"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="space-y-6"
      >
        {/* Header imagen */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm">
          <img 
            src="/images/meal-prep.png" 
            alt="Plan de comidas" 
            className="w-full h-36 sm:h-44 object-cover" 
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${ac.bgGradient} opacity-60`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Shield className="w-6 h-6" />
              Resumen de ambos perfiles
            </h2>
          </div>
        </div>

        {/* El */}
        <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 space-y-4">
          <h3 className="font-bold text-blue-800 text-sm">👨 {perfilesData.el.nombre}</h3>
          
          <PorcionesTable 
            perfil={perfilesData.el} 
            accentColor="blue" 
            textColor="text-blue-600"
            borderColor="border-blue-200"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <h4 className="font-bold text-blue-700 mb-1 flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3" /> Meta
              </h4>
              <p className="text-blue-600 text-xs sm:text-sm">{perfilesData.el.meta}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <h4 className="font-bold text-blue-700 mb-1 text-xs">Perfil</h4>
              <p className="text-blue-600 text-xs sm:text-sm">{perfilesData.el.perfil}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-xs">
              <Heart className="w-3 h-3 text-blue-500" />
              Puntos clave
            </h4>
            <div className="space-y-2">
              {perfilesData.el.resumenPersonal?.map((linea: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-2 p-2 rounded-lg bg-slate-50"
                  style={{ borderLeft: '3px solid #3b82f6' }}
                >
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700 leading-relaxed">{linea}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Ella */}
        <div className="bg-rose-50/80 rounded-2xl p-4 border border-rose-200 space-y-4">
          <h3 className="font-bold text-rose-800 text-sm">👩 {perfilesData.ella.nombre}</h3>
          
          <PorcionesTable 
            perfil={perfilesData.ella} 
            accentColor="rose" 
            textColor="text-rose-600"
            borderColor="border-rose-200"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-rose-100">
              <h4 className="font-bold text-rose-700 mb-1 flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3" /> Meta
              </h4>
              <p className="text-rose-600 text-xs sm:text-sm">{perfilesData.ella.meta}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-rose-100">
              <h4 className="font-bold text-rose-700 mb-1 text-xs">Perfil</h4>
              <p className="text-rose-600 text-xs sm:text-sm">{perfilesData.ella.perfil}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-xs">
              <Heart className="w-3 h-3 text-rose-500" />
              Puntos clave
            </h4>
            <div className="space-y-2">
              {perfilesData.ella.resumenPersonal?.map((linea: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-2 p-2 rounded-lg bg-slate-50"
                  style={{ borderLeft: '3px solid #f43f5e' }}
                >
                  <div className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-700 leading-relaxed">{linea}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const perfil = isEl ? perfilesData.el : perfilesData.ella;

  return (
    <motion.div
      key="resumen"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-6"
    >
      {/* Header imagen */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm">
        <img 
          src="/images/meal-prep.png" 
          alt="Plan de comidas" 
          className="w-full h-36 sm:h-44 object-cover" 
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${ac.bgGradient} opacity-60`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-6 h-6" />
            Sobre {perfil?.nombre}
          </h2>
        </div>
      </div>

      {/* Tabla de Porciones */}
      <PorcionesTable 
        perfil={perfil} 
        accentColor={isEl ? 'blue' : 'rose'}
        textColor={ac.text}
        borderColor={ac.border}
      />

      {/* Meta y Perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`bg-gradient-to-br ${ac.bgGradientLight} rounded-2xl p-4 border ${ac.border}`}>
          <h3 className={`font-bold ${ac.textDark} mb-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
            <TrendingDown className="w-3.5 h-3.5" /> Meta
          </h3>
          <p className={`${ac.text} text-xs sm:text-sm`}>{perfil?.meta}</p>
        </div>
        <div className={`bg-gradient-to-br ${ac.bgGradientLight} rounded-2xl p-4 border ${ac.border}`}>
          <h3 className={`font-bold ${ac.textDark} mb-1.5 text-xs sm:text-sm`}>Perfil</h3>
          <p className={`${ac.text} text-xs sm:text-sm`}>{perfil?.perfil}</p>
        </div>
      </div>

      {/* Resumen personal */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
        <h3 className={`font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base ${ac.text}`}>
          <Heart className="w-4 h-4" />
          Puntos clave de tu plan
        </h3>
        <div className="space-y-2.5">
          {perfil?.resumenPersonal?.map((linea: string, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="flex gap-3 p-3 rounded-xl bg-slate-50"
              style={{ borderLeft: `3px solid ${isEl ? '#3b82f6' : isAmbos ? '#10b981' : '#f43f5e'}` }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${ac.dot} mt-1.5 flex-shrink-0`} />
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{linea}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
