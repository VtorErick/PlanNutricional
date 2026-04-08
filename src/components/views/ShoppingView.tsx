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

type ShoppingUsage = {
  texto: string;
  perfil: 'el' | 'ella';
  dayLabel: string;
  mealLabel: string;
  mealName: string;
  signature: string;
};

type ShoppingUsageDisplay = {
  id: string;
  texto: string;
  perfiles: Array<'el' | 'ella'>;
};

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
  const isAmbos = perfilActivo === 'ambos';

  const shoppingList = useMemo(() => {
    const ingredientMap: Record<string, ShoppingUsage[]> = {};

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
          texto: isAmbos
            ? `${dayLabel} | ${mealLabel} | ${profile.nombre}: ${meal.nombre}`
            : `${dayLabel} | ${mealLabel}: ${meal.nombre}`,
          perfil: profileId as 'el' | 'ella',
          dayLabel,
          mealLabel,
          mealName: meal.nombre,
          signature: `${dayLabel}|${mealLabel}|${meal.nombre}`,
        });
      });
    });

    return Object.keys(ingredientMap)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((ingredient) => ({
        ingrediente: ingredient,
        usos: ingredientMap[ingredient],
      }));
  }, [selecciones, perfilActivo, perfilesData, isAmbos]);

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

  const getUsageSummary = React.useCallback((usos: ShoppingUsage[]) => {
    const summary = usos.reduce((acc, uso) => {
      if (uso.perfil === 'el') {
        acc.el += 1;
      } else if (uso.perfil === 'ella') {
        acc.ella += 1;
      }
      return acc;
    }, { el: 0, ella: 0 });

    return summary;
  }, []);

  const getDisplayUsos = React.useCallback((usos: ShoppingUsage[]): ShoppingUsageDisplay[] => {
    if (!isAmbos) {
      return usos.map((uso) => ({
        id: `${uso.signature}-${uso.perfil}`,
        texto: uso.texto,
        perfiles: [uso.perfil],
      }));
    }

    const grouped = usos.reduce<Record<string, ShoppingUsageDisplay>>((acc, uso) => {
      if (!acc[uso.signature]) {
        acc[uso.signature] = {
          id: uso.signature,
          texto: `${uso.dayLabel} | ${uso.mealLabel}: ${uso.mealName}`,
          perfiles: [],
        };
      }

      if (!acc[uso.signature].perfiles.includes(uso.perfil)) {
        acc[uso.signature].perfiles.push(uso.perfil);
      }

      return acc;
    }, {});

    return Object.values(grouped);
  }, [isAmbos]);

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
        className={`rounded-[28px] overflow-hidden relative p-4 sm:p-6 ${
          isDarkMode
            ? 'bg-slate-950/92 shadow-[0_14px_32px_rgba(2,6,23,0.42)]'
            : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-48 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-28"
            style={{ backgroundImage: "url('/images/meal-prep.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/84 to-white/100 dark:from-slate-950/24 dark:via-slate-950/84 dark:to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/35 via-transparent to-transparent dark:from-emerald-950/25" />
        </div>

        <div
          className={`absolute top-0 right-0 -z-10 h-40 w-40 rounded-full blur-3xl pointer-events-none sm:h-48 sm:w-48 ${
            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
          }`}
        />

        <div className="relative z-10">
        <div className="relative mb-4 flex items-start gap-3 sm:gap-4">
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
          <div className="relative mb-5 grid grid-cols-3 gap-3">
            <div
              className={`rounded-2xl p-3 ${
                isDarkMode
                  ? 'bg-emerald-950/45'
                  : 'bg-emerald-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span
                  className={`text-[11px] uppercase tracking-[0.14em] font-bold ${
                    isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  Total
                </span>
              </div>
              <p className={`text-xl font-black ${isDarkMode ? 'text-emerald-100' : 'text-emerald-900'}`}>
                {shoppingList.length}
              </p>
            </div>

            <div
              className={`rounded-2xl p-3 ${
                isDarkMode
                  ? 'bg-amber-950/45'
                  : 'bg-amber-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span
                  className={`text-[11px] uppercase tracking-[0.14em] font-bold ${
                    isDarkMode ? 'text-amber-300' : 'text-amber-700'
                  }`}
                >
                  Pendientes
                </span>
              </div>
              <p className={`text-xl font-black ${isDarkMode ? 'text-amber-100' : 'text-amber-900'}`}>
                {pendingCount}
              </p>
            </div>

            <div
              className={`rounded-2xl p-3 ${
                isDarkMode ? 'bg-sky-950/45' : 'bg-blue-50'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                <span
                  className={`text-[11px] uppercase tracking-[0.14em] font-bold ${
                    isDarkMode ? 'text-sky-300' : 'text-blue-700'
                  }`}
                >
                  Marcados
                </span>
              </div>
              <p className={`text-xl font-black ${isDarkMode ? 'text-sky-100' : 'text-blue-900'}`}>
                {checkedCount}
              </p>
            </div>
          </div>
        )}

        {shoppingList.length === 0 ? (
          <div
            className={`rounded-[20px] py-10 sm:py-12 text-center ${
              isDarkMode ? 'bg-slate-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]' : 'bg-slate-50 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]'
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
              const usageSummary = getUsageSummary(item.usos);
              const displayUsos = getDisplayUsos(item.usos);

              return (
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  key={item.ingrediente}
                  className={`group rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden flex items-stretch ${
                    isChecked
                      ? isDarkMode
                        ? 'bg-slate-900 opacity-85'
                        : 'bg-slate-50 opacity-70'
                      : isDarkMode
                        ? 'bg-slate-950 shadow-[0_10px_24px_rgba(2,6,23,0.38)] hover:shadow-[0_14px_28px_rgba(2,6,23,0.48)]'
                        : 'bg-white shadow-sm hover:shadow-md'
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
                          Aparece en {displayUsos.length} comida{displayUsos.length > 1 ? 's' : ''} seleccionada{displayUsos.length > 1 ? 's' : ''}
                        </p>
                        {isAmbos && (usageSummary.el > 0 || usageSummary.ella > 0) ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {usageSummary.el > 0 ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black ${elAccent.tagBg} ${elAccent.tagText}`}>
                                El {usageSummary.el}
                              </span>
                            ) : null}
                            {usageSummary.ella > 0 ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black ${ellaAccent.tagBg} ${ellaAccent.tagText}`}>
                                Ella {usageSummary.ella}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIngredients((prev) => ({
                            ...prev,
                            [item.ingrediente]: !prev[item.ingrediente],
                          }))
                        }
                        className={`flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold active:scale-95 ${
                          isDarkMode
                            ? 'text-slate-200 bg-slate-900'
                            : 'text-slate-500 bg-slate-100'
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
                        {displayUsos.map((uso) => (
                          <div
                            key={uso.id}
                            className={`rounded-xl p-2.5 flex items-start gap-2 ${
                              isChecked
                                ? isDarkMode
                                  ? 'bg-slate-800/90'
                                  : 'bg-slate-100/70'
                                : isDarkMode
                                  ? 'bg-slate-900'
                                  : 'bg-slate-50'
                            }`}
                          >
                            {isAmbos ? (
                              <div className="flex flex-shrink-0 flex-wrap gap-1">
                                {uso.perfiles.map((perfil) => (
                                  <span
                                    key={`${uso.id}-${perfil}`}
                                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                      perfil === 'el'
                                        ? `${elAccent.tagBg} ${elAccent.tagText}`
                                        : `${ellaAccent.tagBg} ${ellaAccent.tagText}`
                                    }`}
                                  >
                                    {perfil === 'el' ? 'El' : 'Ella'}
                                  </span>
                                ))}
                              </div>
                            ) : null}

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
      </div>
    </motion.div>
  );
}
