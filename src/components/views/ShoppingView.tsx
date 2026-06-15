import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getAccentColors } from '../../utils/theme';
import { getCompactProfileLabel } from '../../utils/profileLabels';

type ShoppingUsage = {
  texto: string;
  perfil: 'el' | 'ella';
  dayKey: string;
  dayLabel: string;
  mealTimeKey: string;
  mealLabel: string;
  mealName: string;
  signature: string;
};

type ShoppingUsageDisplay = {
  id: string;
  texto: string;
  perfiles: Array<'el' | 'ella'>;
  dayOrder: number;
  mealOrder: number;
  mealName: string;
};

const DAY_ORDER: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  miércoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  sábado: 5,
  domingo: 6,
};

const MEAL_ORDER: Record<string, number> = {
  desayuno: 0,
  colacion_am: 1,
  comida: 2,
  colacion_pm: 3,
  cena: 4,
};

const SUPERMARKET_SECTIONS = [
  { key: 'frutas_verduras', label: 'Frutas y verduras', icon: '🥬' },
  { key: 'proteina', label: 'Proteínas', icon: '🥩' },
  { key: 'lacteos', label: 'Lácteos y huevos', icon: '🥚' },
  { key: 'despensa', label: 'Despensa', icon: '🧺' },
  { key: 'otros', label: 'Otros', icon: '🛒' },
] as const;

function getSupermarketSection(ingredient: string) {
  const value = ingredient.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/(manzana|pera|platano|banana|fresa|fruta|naranja|limon|aguacate|tomate|jitomate|lechuga|espinaca|brocoli|pepino|zanahoria|calabaza|cebolla|pimiento|verdura|champi|cilantro|berries|arandano)/.test(value)) {
    return 'frutas_verduras';
  }

  if (/(pollo|res|pavo|atun|salmon|pescado|camaron|carne|huevo|claras|tofu|tempeh|jamon)/.test(value)) {
    return 'proteina';
  }

  if (/(yogur|yoghurt|leche|queso|kefir|lactosa|requeson)/.test(value)) {
    return 'lacteos';
  }

  if (/(arroz|avena|pan|tortilla|pasta|quinoa|frijol|lenteja|garbanzo|aceite|nuez|almendra|semilla|chia|linaza|granola|cereal|tostada|crema|sal|canela|cacao)/.test(value)) {
    return 'despensa';
  }

  return 'otros';
}

export default function ShoppingView() {
  const {
    selecciones,
    perfilActivo,
    perfilesData,
    profileLabels,
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
          dayKey: day,
          dayLabel,
          mealTimeKey,
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
  const groupedShoppingList = useMemo(() => {
    return SUPERMARKET_SECTIONS.map((section) => ({
      ...section,
      items: shoppingList.filter((item) => getSupermarketSection(item.ingrediente) === section.key),
    })).filter((section) => section.items.length > 0);
  }, [shoppingList]);

  const handleShareList = React.useCallback(async () => {
    const lines: string[] = ['🛒 Lista de compras'];
    groupedShoppingList.forEach((section) => {
      lines.push('', `${section.icon} ${section.label}`);
      section.items.forEach((item) => {
        const mark = comprasCheck[item.ingrediente] ? '☑' : '☐';
        lines.push(`${mark} ${item.ingrediente}`);
      });
    });
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Lista de compras', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // user cancelled or unsupported
    }
  }, [groupedShoppingList, comprasCheck]);

  const getDisplayUsos = React.useCallback((usos: ShoppingUsage[]): ShoppingUsageDisplay[] => {
    if (!isAmbos) {
      return usos
        .map((uso) => ({
          id: `${uso.signature}-${uso.perfil}`,
          texto: uso.texto,
          perfiles: [uso.perfil],
          dayOrder: DAY_ORDER[uso.dayKey.toLowerCase()] ?? 999,
          mealOrder: MEAL_ORDER[uso.mealTimeKey] ?? 999,
          mealName: uso.mealName,
        }))
        .sort((left, right) =>
          left.dayOrder - right.dayOrder ||
          left.mealOrder - right.mealOrder ||
          left.mealName.localeCompare(right.mealName, 'es', { sensitivity: 'base' })
        );
    }

    const grouped = usos.reduce<Record<string, ShoppingUsageDisplay>>((acc, uso) => {
      if (!acc[uso.signature]) {
        acc[uso.signature] = {
          id: uso.signature,
          texto: `${uso.dayLabel} | ${uso.mealLabel}: ${uso.mealName}`,
          perfiles: [],
          dayOrder: DAY_ORDER[uso.dayKey.toLowerCase()] ?? 999,
          mealOrder: MEAL_ORDER[uso.mealTimeKey] ?? 999,
          mealName: uso.mealName,
        };
      }

      if (!acc[uso.signature].perfiles.includes(uso.perfil)) {
        acc[uso.signature].perfiles.push(uso.perfil);
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((left, right) =>
      left.dayOrder - right.dayOrder ||
      left.mealOrder - right.mealOrder ||
      left.mealName.localeCompare(right.mealName, 'es', { sensitivity: 'base' })
    );
  }, [isAmbos]);

  return (
    <motion.div
      key="compras"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="space-y-3"
    >
      <div
        className={`relative overflow-hidden rounded-[24px] p-3 sm:p-5 ${
          isDarkMode
            ? 'bg-slate-950/92 shadow-[0_10px_26px_rgba(2,6,23,0.38)]'
            : 'bg-white shadow-[0_8px_24px_rgb(0,0,0,0.04)]'
        }`}
      >
        <div
          className={`pointer-events-none absolute right-0 top-0 -z-10 h-28 w-28 rounded-full blur-3xl sm:h-40 sm:w-40 ${
            isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
          }`}
        />

        <div className="relative z-10">
        <div className="relative mb-3 flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              className={`text-lg font-black tracking-tight leading-tight sm:text-2xl ${
                isDarkMode ? 'text-slate-50' : 'text-slate-900'
              }`}
            >
              Supermercado
            </h2>
            <p
              className={`mt-0.5 max-w-xl text-xs font-medium leading-snug sm:text-sm ${
                isDarkMode ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {' '}
              <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}>
                {shoppingList.length} ingredientes
              </strong>{' '}
              de tus comidas seleccionadas.
            </p>
          </div>
        </div>

        {shoppingList.length > 0 && (
          <div className={`relative mb-3 flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span className={`truncate text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                {pendingCount} pendientes
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleShareList()}
              className={`ml-auto inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </button>
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
          <div className="space-y-3">
            {groupedShoppingList.map((section) => (
              <section key={section.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className={`flex items-center gap-2 text-sm font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <span aria-hidden="true">{section.icon}</span>
                    {section.label}
                  </h3>
                  <div className="flex items-center gap-2">
                    {section.items.every((item) => comprasCheck[item.ingrediente]) ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        ✓ Completo
                      </motion.span>
                    ) : null}
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {section.items.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2">
            {section.items.map((item) => {
              const isChecked = comprasCheck[item.ingrediente];
              const displayUsos = getDisplayUsos(item.usos);

              return (
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  key={item.ingrediente}
                  className={`group flex cursor-pointer items-stretch overflow-hidden rounded-[18px] border transition-all duration-200 ${
                    isChecked
                      ? isDarkMode
                        ? 'border-slate-800 bg-slate-900 opacity-85'
                        : 'border-slate-100 bg-slate-50 opacity-70'
                      : isDarkMode
                        ? 'border-slate-800 bg-slate-950 shadow-[0_8px_18px_rgba(2,6,23,0.32)] hover:shadow-[0_10px_22px_rgba(2,6,23,0.42)]'
                        : 'border-slate-100 bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-1 transition-colors ${
                      isChecked
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-b from-slate-200 to-transparent group-hover:from-emerald-400 group-hover:to-teal-500'
                    }`}
                  />

                  <div className="min-w-0 flex-1 p-3">
                    <div className={`${expandedIngredients[item.ingrediente] ? 'mb-2.5' : ''} flex items-start gap-3`}>
                      <motion.button
                        type="button"
                        onClick={() =>
                          setComprasCheck((prev) => ({
                            ...prev,
                            [item.ingrediente]: !prev[item.ingrediente],
                          }))
                        }
                        animate={isChecked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isChecked
                            ? 'scale-105 border-emerald-500 bg-emerald-500'
                            : isDarkMode
                              ? 'border-slate-700 bg-slate-900 group-hover:border-emerald-400'
                              : 'border-slate-200 bg-white group-hover:border-emerald-500'
                        }`}
                        aria-label={`${
                          isChecked ? 'Desmarcar' : 'Marcar'
                        } ingrediente ${item.ingrediente}`}
                      >
                        {isChecked ? <CheckCircle2 className="h-4 w-4 text-white" /> : null}
                      </motion.button>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-[15px] font-black tracking-tight leading-snug break-words capitalize sm:text-base ${
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
                          className={`mt-0.5 text-[11px] font-medium sm:text-xs ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          Aparece en {displayUsos.length} comida{displayUsos.length > 1 ? 's' : ''} seleccionada{displayUsos.length > 1 ? 's' : ''}
                        </p>
                        <p className={`mt-1 text-[11px] font-black ${isChecked ? 'text-emerald-600' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {isChecked ? 'Comprado' : 'Pendiente'}{isAmbos ? ` · ${displayUsos.some((uso) => uso.perfiles.length === 2) ? 'Compartido' : 'Uso individual'}` : ''}
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
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-bold active:scale-95 ${
                          isDarkMode
                            ? 'text-slate-200 bg-slate-900'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                        aria-label={`${
                          expandedIngredients[item.ingrediente] ? 'Colapsar' : 'Expandir'
                        } comidas de ${item.ingrediente}`}
                      >
                        {expandedIngredients[item.ingrediente] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {expandedIngredients[item.ingrediente] ? (
                      <div className="ml-11 space-y-1.5">
                        {displayUsos.map((uso) => (
                          <div
                            key={uso.id}
                            className={`flex items-start gap-2 rounded-xl px-2.5 py-2 ${
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
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                      perfil === 'el'
                                        ? `${elAccent.tagBg} ${elAccent.tagText}`
                                        : `${ellaAccent.tagBg} ${ellaAccent.tagText}`
                                    }`}
                                  >
                                    {getCompactProfileLabel(profileLabels, perfil)}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <span
                              className={`text-[11px] font-medium leading-snug break-words sm:text-xs ${
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
              </section>
            ))}
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
}
