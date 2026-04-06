import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';

export function ComprasPage() {
  const { listaCompras, comprasCheck, setComprasCheck } = useAppContext();

  return (
    <motion.div
      key="compras"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          Supermercado
        </h2>
        <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed max-w-xl">
          Tienes <strong className="text-emerald-600">{listaCompras.length} ingredientes</strong> en tu lista basados en tus platillos seleccionados.
        </p>

        {listaCompras.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-[20px] border-dashed border-2 border-slate-200">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Carrito vacío</p>
            <p className="text-slate-400 text-sm mt-1">Ve a "Mi Plan" y selecciona comidas para agregar ingredientes automáticamente.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {listaCompras.map((item) => {
              const isChecked = comprasCheck[item.ingrediente];
              return (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  key={item.ingrediente}
                  onClick={() => setComprasCheck(prev => ({...prev, [item.ingrediente]: !prev[item.ingrediente]}))}
                  className={`group p-0 rounded-2xl border shadow-sm transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${isChecked ? 'bg-slate-50 border-emerald-200 opacity-60' : 'bg-white border-slate-100 hover:shadow-md'}`}
                >
                  <div className={`w-1.5 transition-colors ${isChecked ? 'bg-emerald-400' : 'bg-gradient-to-b from-slate-200 to-transparent group-hover:from-emerald-400 group-hover:to-teal-500'}`} />
                  <div className="p-4 sm:p-5 flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-3">
                      <div className={`w-6 h-6 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${isChecked ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-200 group-hover:border-emerald-500 bg-slate-50'}`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-bold tracking-tight text-base capitalize leading-snug break-words ${isChecked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.ingrediente}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{item.usos.length} recet{item.usos.length > 1 ? 'as' : 'a'} lo ocupa{item.usos.length > 1 ? 'n' : ''}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 ml-10">
                      {item.usos.map((uso, idx) => (
                        <li key={idx} className={`flex gap-2 text-xs relative rounded-lg p-2 items-center ${isChecked ? 'bg-slate-100/50' : 'bg-slate-50'}`}>
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                            uso.perfil === 'el' ? 'bg-blue-100/80 text-blue-700' : 'bg-rose-100/80 text-rose-700'
                          }`}>{uso.perfil}</span>
                          <span className={`font-medium leading-snug break-words ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>{uso.texto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
