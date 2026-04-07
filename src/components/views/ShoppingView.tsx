import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  CheckCircle2,
  PackageCheck,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';

export default function ShoppingView() {
  const {
    selecciones,
    perfilActivo,
    perfilesData,
    comprasCheck,
    setComprasCheck,
    isDarkMode,
  } = useDiet();
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const elAccent = getAccentColors('el', isDarkMode);
  const ellaAccent = getAccentColors('ella', isDarkMode);

  const shoppingList = useMemo(() => {
    const ingredientMap: Record<string, { texto: string; perfil: string }[]> = {};

    Object.entries(selecciones).forEach(([key, isSelected]) => {
      if (!isSelected) return;

      const parts = key.split('-');
      if (parts.length < 4) return;

      const [profileId, day, mealTimeKey, ...mealNameParts] = parts;

      if (perfilActivo !== 'ambos' && profileId !== perfilActivo) return;

      const mealName = mealNameParts.join('-');
      const profile = perfilesData[profileId as 'el' | 'ella'];
      if (!profile) return;

      const meals = profile.plan[day]?.[mealTimeKey] || [];
      const meal = meals.find((item: any) => item.nombre === mealName);

      if (!meal) return;

      const ingredients = Array.isArray(meal.super) ? meal.super : [];
      const mealLabel = mealTimeKey
        .replace('desayuno', 'Desayuno')
        .replace('colacion_am', 'Col. AM')
        .replace('comida', 'Comida')
        .replace('colacion_pm', 'Col. PM')
        .replace('cena', 'Cena');
      const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

      ingredients.forEach((ingredient: string) => {
        if (!ingredientMap[ingredient]) ingredientMap[ingredient] = [];

        ingredientMap[ingredient].push({
          texto: `${dayLabel} | ${mealLabel} | ${profile.nombre}: ${meal.nombre}`,
          perfil: profileId,
        });
      });
    });

    return Object.keys(ingredientMap)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((ingredient) => ({
        ingrediente: ingredient,
        usos: ingredientMap[ingredient],
      }));
  }, [selecciones, perfilActivo, perfilesData]);

  useEffect(() => {
    const validIngredients = new Set(shoppingList.map((item) => item.ingrediente));

    setComprasCheck((prev) => {
      let changed = false;
      const next = Object.fromEntries(
        Object.entries(prev).filter(([ingredient, checked]) => {
          const keep = checked && validIngredients.has(ingredient);
          if (!keep) changed = true;
          return keep;
        })
      );

      return changed ? next : prev;
    });
  }, [setComprasCheck, shoppingList]);

  const checkedCount = shoppingList.filter((item) => comprasCheck[item.ingrediente]).length;
  const pendingCount = shoppingList.length - checkedCount;

  return (
    <motion.div
      key="compras"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-4"
    >
      <div
        className={`rounded-[28px] border overflow-hidden relative p-4 sm:p-6 ${
          isDarkMode
            ? 'bg-slate-950/92 border-slate-800 shadow-[0_14px_32px_rgba(2,6,23,0.42)]'
            : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}
      >
        <div
          className={`absolute top-0 right-0 -z-10 h-40 w-40 rounded-full blur-3xl pointer-events-none sm:h-48 sm:w-48 ${
            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
          }`}
        />

        <div className="mb-4 flex items-start gap-3 sm:gap-4">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-[16px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>

          <div className="min-w-0">
            <h2
              className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${
                isDarkMode ? 'text-slate-50' : 'text-slate-900'
              }`}
            >
              Supermercado
            </h2>
            <p
              className={`mt-1 max-w-xl text-xs sm:text-sm font-medium leading-relaxed ${
                isDarkMode ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Tienes{' '}
              <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}>
                {shoppingList.length} ingredientes
              </strong>{' '}
              generados a partir de tus comidas seleccionadas.
            </p>
          </div>
        </div>

        {shoppingList.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              className={`rounded-2xl border p-3 ${
                isDarkMode
                  ? 'border-emerald-900/60 bg-emerald-950/45'
                  : 'border-emerald-100 bg-emerald-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-emerald-700">
                  Total
                </span>
              </div>
              <p className="text-xl font-black text-emerald-900">{shoppingList.length}</p>
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                isDarkMode
                  ? 'border-amber-900/60 bg-amber-950/45'
                  : 'border-amber-100 bg-amber-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-amber-700">
                  Pendientes
                </span>
              </div>
              <p className="text-xl font-black text-amber-900">{pendingCount}</p>
            </div>

            <div
              className={`rounded-2xl border p-3 col-span-2 sm:col-span-1 ${
                isDarkMode ? 'border-sky-900/60 bg-sky-950/45' : 'border-blue-100 bg-blue-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-blue-700">
                  Marcados
                </span>
              </div>
              <p className="text-xl font-black text-blue-900">{checkedCount}</p>
            </div>
          </div>
        )}

        {shoppingList.length === 0 ? (
          <div
            className={`rounded-[20px] border-dashed border-2 py-10 sm:py-12 text-center ${
              isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <ShoppingCart
              className={`mx-auto mb-3 w-10 h-10 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-300'
              }`}
            />
            <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-500'}`}>
              Carrito vacío
            </p>
            <p className={`mt-1 px-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Ve a &quot;Mi Plan&quot; y selecciona comidas para agregar ingredientes automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {shoppingList.map((item) => {
              const isChecked = comprasCheck[item.ingrediente];

              return (
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  key={item.ingrediente}
                  className={`group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${
                    isChecked
                      ? isDarkMode
                        ? 'bg-slate-900 border-emerald-900/70 opacity-85'
                        : 'bg-slate-50 border-emerald-200 opacity-70'
                      : isDarkMode
                        ? 'bg-slate-950 border-slate-800 shadow-[0_10px_24px_rgba(2,6,23,0.38)] hover:shadow-[0_14px_28px_rgba(2,6,23,0.48)]'
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
                    <div className="mb-3 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setComprasCheck((prev) => ({
                            ...prev,
                            [item.ingrediente]: !prev[item.ingrediente],
                          }))
                        }
                        className={`w-7 h-7 mt-0.5 rounded-full border-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 scale-110'
                            : isDarkMode
                              ? 'border-slate-700 group-hover:border-emerald-400 bg-slate-900'
                              : 'border-slate-200 group-hover:border-emerald-500 bg-slate-50'
                        }`}
                        aria-label={`${
                          isChecked ? 'Desmarcar' : 'Marcar'
                        } ingrediente ${item.ingrediente}`}
                      >
                        {isChecked ? <CheckCircle2 className="w-4 h-4 text-white" /> : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-[15px] sm:text-base font-bold tracking-tight leading-snug break-words capitalize ${
                            isChecked
                              ? 'text-slate-500 line-through'
                              : isDarkMode
                                ? 'text-slate-100'
                                : 'text-slate-800'
                          }`}
                        >
                          {item.ingrediente}
                        </h3>

                        <p
                          className={`mt-1 text-[11px] sm:text-xs font-medium ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {item.usos.length} receta{item.usos.length > 1 ? 's' : ''} lo
                          ocupa{item.usos.length > 1 ? 'n' : ''}
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
                        className={`flex-shrink-0 rounded-lg border px-2 py-1 text-[10px] font-bold active:scale-95 ${
                          isDarkMode
                            ? 'border-slate-700 text-slate-200 bg-slate-900'
                            : 'border-slate-200 text-slate-500 bg-white'
                        }`}
                        aria-label={`${
                          expandedIngredients[item.ingrediente] ? 'Colapsar' : 'Expandir'
                        } comidas de ${item.ingrediente}`}
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

                    {expandedIngredients[item.ingrediente] ? (
                      <div className="ml-9 space-y-2">
                        {item.usos.map((uso, index) => (
                          <div
                            key={index}
                            className={`rounded-xl p-2.5 flex items-start gap-2 ${
                              isChecked
                                ? isDarkMode
                                  ? 'bg-slate-800/90'
                                  : 'bg-slate-100/70'
                                : isDarkMode
                                  ? 'bg-slate-900 border border-slate-800'
                                  : 'bg-slate-50'
                            }`}
                          >
                            <span
                              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                                uso.perfil === 'el'
                                  ? `${elAccent.tagBg} ${elAccent.tagText}`
                                  : `${ellaAccent.tagBg} ${ellaAccent.tagText}`
                              }`}
                            >
                              {uso.perfil === 'el' ? 'Él' : 'Ella'}
                            </span>

                            <span
                              className={`text-[11px] sm:text-xs font-medium leading-snug break-words ${
                                isChecked
                                  ? 'text-slate-400'
                                  : isDarkMode
                                    ? 'text-slate-100'
                                    : 'text-slate-600'
                              }`}
                            >
                              {uso.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
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
