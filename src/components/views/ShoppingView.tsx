import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, PackageCheck, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { useDiet } from '../../context/DietContext';

export default function ShoppingView() {
  const { selecciones, perfilActivo, perfilesData, comprasCheck, setComprasCheck } = useDiet();
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});

  const listaCompras = useMemo(() => {
    const map: Record<string, { texto: string; perfil: string }[]> = {};

    Object.entries(selecciones).forEach(([key, isSelected]) => {
      if (!isSelected) return;

      const parts = key.split('-');
      if (parts.length < 4) return;

      const [p, d, m, ...nParts] = parts;

      if (perfilActivo !== 'ambos' && p !== perfilActivo) return;

      const nombre = nParts.join('-');
      const perfilObj = perfilesData[p as 'el' | 'ella'];
      if (!perfilObj) return;

      const comidas = perfilObj.plan[d]?.[m] || [];
      const comida = comidas.find((c: any) => c.nombre === nombre);

      if (comida) {
        comida.super.forEach((ing: string) => {
          if (!map[ing]) map[ing] = [];

          const mealLabel = m
            .replace('desayuno', 'Desayuno')
            .replace('colacion_am', 'Col. AM')
            .replace('comida', 'Comida')
            .replace('colacion_pm', 'Col. PM')
            .replace('cena', 'Cena');

          const dayLabel = d.charAt(0).toUpperCase() + d.slice(1);

          const label = `${dayLabel} · ${mealLabel} · ${perfilObj.nombre}: ${comida.nombre}`;
          map[ing].push({ texto: label, perfil: p });
        });
      }
    });

    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((ing) => ({
        ingrediente: ing,
        usos: map[ing],
      }));
  }, [selecciones, perfilActivo, perfilesData]);

  const checkedCount = listaCompras.filter((item) => comprasCheck[item.ingrediente]).length;
  const pendingCount = listaCompras.length - checkedCount;

  return (
    <motion.div
      key="compras"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      <div className="bg-white rounded-[28px] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 sm:w-48 sm:h-48 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
              Supermercado
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 leading-relaxed max-w-xl">
              Tienes{' '}
              <strong className="text-emerald-600">{listaCompras.length} ingredientes</strong>{' '}
              generados a partir de tus comidas seleccionadas.
            </p>
          </div>
        </div>

        {listaCompras.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-emerald-700">
                  Total
                </span>
              </div>
              <p className="text-xl font-black text-emerald-900">{listaCompras.length}</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-amber-700">
                  Pendientes
                </span>
              </div>
              <p className="text-xl font-black text-amber-900">{pendingCount}</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-1">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-blue-700">
                  Marcados
                </span>
              </div>
              <p className="text-xl font-black text-blue-900">{checkedCount}</p>
            </div>
          </div>
        )}

        {listaCompras.length === 0 ? (
          <div className="text-center py-10 sm:py-12 bg-slate-50 rounded-[20px] border-dashed border-2 border-slate-200">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Carrito vacío</p>
            <p className="text-slate-400 text-sm mt-1 px-4">
              Ve a &quot;Mi Plan&quot; y selecciona comidas para agregar ingredientes automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {listaCompras.map((item) => {
              const isChecked = comprasCheck[item.ingrediente];

              return (
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  key={item.ingrediente}
                  className={`group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${
                    isChecked
                      ? 'bg-slate-50 border-emerald-200 opacity-70'
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-1.5 transition-colors ${
                      isChecked
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-b from-slate-200 to-transparent group-hover:from-emerald-400 group-hover:to-teal-500'
                    }`}
                  />

                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setComprasCheck((prev) => ({
                            ...prev,
                            [item.ingrediente]: !prev[item.ingrediente],
                          }))
                        }
                        className={`w-7 h-7 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 scale-110'
                            : 'border-slate-200 group-hover:border-emerald-500 bg-slate-50'
                        }`}
                        aria-label={`${isChecked ? 'Desmarcar' : 'Marcar'} ingrediente ${item.ingrediente}`}
                      >
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`font-bold tracking-tight text-[15px] sm:text-base capitalize leading-snug break-words ${
                            isChecked ? 'text-slate-500 line-through' : 'text-slate-800'
                          }`}
                        >
                          {item.ingrediente}
                        </h3>

                        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">
                          {item.usos.length} receta{item.usos.length > 1 ? 's' : ''}{' '}
                          lo ocupa{item.usos.length > 1 ? 'n' : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIngredients((prev) => ({
                            ...prev,
                            [item.ingrediente]: !prev[item.ingrediente],
                          }))
                        }
                        className="flex-shrink-0 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 bg-white active:scale-95"
                        aria-label={`${expandedIngredients[item.ingrediente] ? 'Colapsar' : 'Expandir'} comidas de ${item.ingrediente}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {expandedIngredients[item.ingrediente] ? 'Ocultar' : 'Ver'}
                          {expandedIngredients[item.ingrediente] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </button>
                    </div>

                    {expandedIngredients[item.ingrediente] && (
                      <div className="space-y-2 ml-9">
                        {item.usos.map((uso, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl p-2.5 flex gap-2 items-start ${
                              isChecked ? 'bg-slate-100/70' : 'bg-slate-50'
                            }`}
                          >
                            <span
                              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                                uso.perfil === 'el'
                                  ? 'bg-blue-100/80 text-blue-700'
                                  : 'bg-rose-100/80 text-rose-700'
                              }`}
                            >
                              {uso.perfil === 'el' ? 'Él' : 'Ella'}
                            </span>

                            <span
                              className={`font-medium leading-snug break-words text-[11px] sm:text-xs ${
                                isChecked ? 'text-slate-400' : 'text-slate-600'
                              }`}
                            >
                              {uso.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
