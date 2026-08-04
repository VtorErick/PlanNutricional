import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCheck,
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronUp,
  ListFilter,
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
  const value = ingredient.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

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
    setTab,
    isDarkMode,
  } = useDiet();
  const [expandedIngredients, setExpandedIngredients] = useState<Record<string, boolean>>({});
  const [showOnlyPending, setShowOnlyPending] = useState(false);
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
  const progressPercent = shoppingList.length > 0 ? Math.round((checkedCount / shoppingList.length) * 100) : 0;
  const groupedShoppingList = useMemo(() => {
    return SUPERMARKET_SECTIONS.map((section) => ({
      ...section,
      items: shoppingList
        .filter((item) => getSupermarketSection(item.ingrediente) === section.key)
        .filter((item) => !showOnlyPending || !comprasCheck[item.ingrediente]),
    })).filter((section) => section.items.length > 0);
  }, [comprasCheck, shoppingList, showOnlyPending]);

  const visibleShoppingCount = shoppingList.filter((item) => !showOnlyPending || !comprasCheck[item.ingrediente]).length;

  const toggleSection = React.useCallback((items: Array<{ ingrediente: string }>) => {
    const shouldCheck = items.some((item) => !comprasCheck[item.ingrediente]);
    setComprasCheck((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.ingrediente] = shouldCheck;
      });
      return next;
    });
  }, [comprasCheck, setComprasCheck]);

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
        className={`relative overflow-hidden rounded-[26px] border p-4 sm:p-5 shadow-soft ${
          isDarkMode
            ? 'border-ink-700 bg-ink-900'
            : 'border-cream-200 bg-white'
        }`}
      >
        <div className="relative z-10">
        <div className="relative mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-pine-600 dark:text-pine-300">
              Lista semanal
            </p>
            <h2
              className={`mt-0.5 font-display text-[26px] font-semibold tracking-tight leading-tight ${
                isDarkMode ? 'text-cream-50' : 'text-ink-900'
              }`}
            >
              Supermercado
            </h2>
            <p
              className={`mt-1 max-w-xl text-xs font-medium leading-snug sm:text-sm ${
                isDarkMode ? 'text-ink-300' : 'text-ink-500'
              }`}
            >
              {' '}
              <strong className={isDarkMode ? 'text-pine-300' : 'text-pine-700'}>
                {shoppingList.length} ingredientes
              </strong>{' '}
              de tus comidas seleccionadas.
            </p>
          </div>

          {shoppingList.length > 0 ? (
            <button
              type="button"
              onClick={() => void handleShareList()}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                isDarkMode ? 'bg-ink-800 text-cream-200 hover:bg-ink-700 border border-ink-700' : 'bg-pine-700 text-white hover:bg-pine-800 shadow-sm'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </button>
          ) : null}
        </div>

        {shoppingList.length > 0 && (
          <div className={`relative mb-4 rounded-2xl px-3.5 py-3 ${isDarkMode ? 'bg-ink-800/70' : 'bg-cream-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-ink-200' : 'text-ink-600'}`}>
                {pendingCount} pendientes · {checkedCount} comprados
              </span>
              <span className={`text-xs font-extrabold tabular-nums ${isDarkMode ? 'text-pine-300' : 'text-pine-700'}`}>
                {progressPercent}%
              </span>
            </div>
            <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-ink-700' : 'bg-cream-200'}`}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pine-400 to-pine-600"
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
            {checkedCount > 0 ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnlyPending((visible) => !visible)}
                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold transition active:scale-95 ${showOnlyPending ? isDarkMode ? 'bg-pine-950/60 text-pine-200' : 'bg-pine-100 text-pine-700' : isDarkMode ? 'bg-ink-900 text-ink-200' : 'bg-white text-ink-600'}`}
                  aria-pressed={showOnlyPending}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  {showOnlyPending ? 'Ver todo' : 'Ver pendientes'}
                </button>
                <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
                  {showOnlyPending ? `${visibleShoppingCount} por comprar` : 'Toca un ingrediente para marcarlo'}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {shoppingList.length === 0 ? (
          <div
            className={`rounded-[22px] py-12 text-center border border-dashed ${
              isDarkMode ? 'border-ink-600 bg-ink-800/40' : 'border-cream-300 bg-cream-50'
            }`}
          >
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isDarkMode ? 'bg-ink-800' : 'bg-cream-100'}`}>
              <ShoppingCart
                className={`w-6 h-6 ${
                  isDarkMode ? 'text-ink-400' : 'text-ink-400'
                }`}
              />
            </div>
            <p className={`font-display text-lg font-semibold ${isDarkMode ? 'text-cream-100' : 'text-ink-700'}`}>
              Carrito vacío
            </p>
            <p className={`mt-1 px-6 text-sm ${isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
              Ve a &quot;Mi Plan&quot; y selecciona comidas para agregar ingredientes automáticamente.
            </p>
            <button
              type="button"
              onClick={() => setTab('plan')}
              className="mx-auto mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-bold text-white transition hover:bg-ink-800 active:scale-[0.97] dark:bg-cream-100 dark:text-ink-900"
            >
              Ir a mi plan
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : visibleShoppingCount === 0 ? (
          <div className={`rounded-[22px] border border-dashed py-10 text-center ${isDarkMode ? 'border-ink-600 bg-ink-800/40' : 'border-pine-200 bg-pine-50/60'}`}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isDarkMode ? 'bg-pine-950/50' : 'bg-pine-100'}`}>
              <CheckCheck className={`h-6 w-6 ${isDarkMode ? 'text-pine-300' : 'text-pine-600'}`} />
            </div>
            <p className={`font-display text-lg font-semibold ${isDarkMode ? 'text-cream-100' : 'text-pine-800'}`}>
              Ya tienes todo lo pendiente
            </p>
            <p className={`mt-1 px-6 text-sm ${isDarkMode ? 'text-ink-400' : 'text-ink-500'}`}>
              Puedes volver a ver la lista completa cuando quieras.
            </p>
            <button
              type="button"
              onClick={() => setShowOnlyPending(false)}
              className="mx-auto mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 text-sm font-bold text-white transition hover:bg-ink-800 active:scale-[0.97] dark:bg-cream-100 dark:text-ink-900"
            >
              Ver lista completa
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedShoppingList.map((section) => (
              <section key={section.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className={`flex items-center gap-2 font-display text-base font-semibold ${isDarkMode ? 'text-cream-100' : 'text-ink-800'}`}>
                    <span aria-hidden="true">{section.icon}</span>
                    {section.label}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.items)}
                      className={`hidden min-h-8 items-center rounded-full px-2.5 text-[10px] font-extrabold sm:inline-flex ${isDarkMode ? 'bg-ink-800 text-ink-200 hover:bg-ink-700' : 'bg-cream-100 text-ink-600 hover:bg-cream-200'}`}
                    >
                      {section.items.every((item) => comprasCheck[item.ingrediente]) ? 'Desmarcar' : 'Marcar todo'}
                    </button>
                    {section.items.every((item) => comprasCheck[item.ingrediente]) ? (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${isDarkMode ? 'bg-pine-950/60 text-pine-300' : 'bg-pine-100 text-pine-700'}`}
                      >
                        ✓ Completo
                      </motion.span>
                    ) : null}
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tabular-nums ${isDarkMode ? 'bg-ink-800 text-ink-300' : 'bg-cream-100 text-ink-500'}`}>
                      {section.items.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {section.items.map((item) => {
              const isChecked = comprasCheck[item.ingrediente];
              const displayUsos = getDisplayUsos(item.usos);

              return (
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  key={item.ingrediente}
                  className={`group flex cursor-pointer items-stretch overflow-hidden rounded-[20px] border transition-all duration-200 ${
                    isChecked
                      ? isDarkMode
                        ? 'border-ink-700 bg-ink-800/50 opacity-70'
                        : 'border-cream-200 bg-cream-50 opacity-70'
                      : isDarkMode
                        ? 'border-ink-700 bg-ink-900 hover:border-ink-600'
                        : 'border-cream-200 bg-white shadow-soft hover:shadow-lift'
                  }`}
                >
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
                        animate={isChecked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isChecked
                            ? 'border-pine-500 bg-pine-500'
                            : isDarkMode
                              ? 'border-ink-600 bg-ink-800 group-hover:border-pine-400'
                              : 'border-cream-300 bg-white group-hover:border-pine-500'
                        }`}
                        aria-label={`${
                          isChecked ? 'Desmarcar' : 'Marcar'
                        } ingrediente ${item.ingrediente}`}
                      >
                        {isChecked ? <Check className="h-4 w-4 text-white" strokeWidth={3} /> : null}
                      </motion.button>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-[15px] font-bold tracking-tight leading-snug break-words capitalize ${
                            isChecked
                              ? 'text-ink-400 line-through'
                              : isDarkMode
                                ? 'text-cream-100'
                                : 'text-ink-800'
                          }`}
                        >
                          {item.ingrediente}
                        </h3>

                        <p
                          className={`mt-0.5 text-[11px] font-medium ${
                            isDarkMode ? 'text-ink-400' : 'text-ink-400'
                          }`}
                        >
                          Aparece en {displayUsos.length} comida{displayUsos.length > 1 ? 's' : ''} seleccionada{displayUsos.length > 1 ? 's' : ''}
                        </p>
                        <p className={`mt-1 text-[11px] font-extrabold ${isChecked ? (isDarkMode ? 'text-pine-300' : 'text-pine-600') : isDarkMode ? 'text-ink-400' : 'text-ink-400'}`}>
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
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold active:scale-90 ${
                          isDarkMode
                            ? 'text-ink-200 bg-ink-800'
                            : 'text-ink-400 bg-cream-100'
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
                            className={`flex items-start gap-2 rounded-2xl px-3 py-2 ${
                              isChecked
                                ? isDarkMode
                                  ? 'bg-ink-800/80'
                                  : 'bg-cream-100/70'
                                : isDarkMode
                                  ? 'bg-ink-800'
                                  : 'bg-cream-100'
                            }`}
                          >
                            {isAmbos ? (
                              <div className="flex flex-shrink-0 flex-wrap gap-1">
                                {uso.perfiles.map((perfil) => (
                                  <span
                                    key={`${uso.id}-${perfil}`}
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
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
                              className={`text-[11px] font-medium leading-snug break-words ${
                                isChecked
                                  ? 'text-ink-400'
                                  : isDarkMode
                                    ? 'text-ink-100'
                                    : 'text-ink-600'
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
