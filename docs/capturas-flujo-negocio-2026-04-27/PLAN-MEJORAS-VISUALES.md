# Plan tecnico de mejoras visuales

Este documento esta listo para implementacion por devs. Usa como fuente las capturas y `.md` de `docs/capturas-flujo-negocio-2026-04-27`, el generador `_generate-docs.mjs`, los tests e2e y los componentes reales en `src/`.

El objetivo no es cambiar la logica nutricional ni el negocio. El objetivo es cambiar lo que el usuario ve: jerarquia, densidad, estados, navegacion, sheets, cards y legibilidad.

## Fuentes obligatorias

- Capturas principales:
  - `01-inicio-dashboard-mobile.png`
  - `02-cuestionario-ia-grid.png`
  - `03-mi-plan-estados-platillo-grid.png`
  - `04-selector-platillo-sheet.png`
  - `05-plan-ajuste-ia-sheet.png`
  - `06-equivalencias-sheet.png`
  - `07-suplementos-sheet.png`
  - `08-calorias-dashboard.png`
  - `09-lista-compras.png`
  - `10-resumen-plan.png`
  - `11-admin-configuracion-grid.png`
- Capturas parciales en `_parts/`:
  - `plan-empty.png`, `plan-selected.png`
  - `questionnaire-0.png`, `questionnaire-1.png`, `questionnaire-2.png`, `questionnaire-3.png`, `questionnaire-8.png`, `questionnaire-10.png`
  - `admin-manual.png`, `admin-gemini.png`
- Contexto funcional:
  - Todos los `.md` de esta carpeta.
  - `README.md` de esta carpeta.
- Codigo que explica por que se ve asi:
  - `src/App.tsx`
  - `src/index.css`
  - `src/utils/profileThemes.ts`
  - `src/components/views/Header.tsx`
  - `src/components/views/LandingView.tsx`
  - `src/components/views/DailyProgress.tsx`
  - `src/components/views/PlanView.tsx`
  - `src/components/MealSwapSheet.tsx`
  - `src/components/PlanAiRefreshSheet.tsx`
  - `src/components/EquivalenciasSheet.tsx`
  - `src/components/EquivalenciasCard.tsx`
  - `src/components/SupplementsSheet.tsx`
  - `src/components/views/CalorieMonitoringView.tsx`
  - `src/components/views/ShoppingView.tsx`
  - `src/components/views/SummaryView.tsx`
  - `src/components/views/AdminLayout.tsx`
  - `src/components/AdminPanel.tsx`
  - `src/components/NutritionQuestionnaire.tsx`
- Captura automatizada:
  - `docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs`
  - `tests/e2e/mobile-ui.spec.ts`
  - `tests/e2e/helpers/app-fixtures.ts`

## Regla de trabajo visual

Cada paso debe seguir este ciclo. No se considera terminado si no pasa por captura y comparacion.

1. Tomar captura antes de empezar el paso.
   - Si el paso afecta una pantalla documentada, usar la captura existente como baseline y ademas generar una captura fresca con el codigo actual.
   - Usar el mismo viewport del generador: `390x844`, `deviceScaleFactor: 1`, `isMobile: true`.
2. Implementar solo el alcance del paso.
3. Tomar captura despues con el mismo estado de datos, ruta, viewport y accion.
4. Comparar despues vs antes y despues vs estado esperado de este documento.
5. Si la visualizacion no cumple el estado esperado, reiterar el paso hasta lograrlo.
6. Solo al cumplir: correr verificacion tecnica.

Comandos minimos:

```bash
npm run build
npx playwright test tests/e2e/mobile-ui.spec.ts
```

Para regenerar el paquete documental completo:

```bash
npm run dev
APP_URL=http://127.0.0.1:5173 node docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs
```

En Windows PowerShell:

```powershell
npm run dev
$env:APP_URL='http://127.0.0.1:5173'; node docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs
```

Guardar capturas de iteracion en:

```text
docs/capturas-flujo-negocio-2026-04-27/iteraciones/<paso>/before.png
docs/capturas-flujo-negocio-2026-04-27/iteraciones/<paso>/after.png
```

## Principios visuales que deben guiar todos los pasos

- La accion principal de cada pantalla debe verse antes que las acciones secundarias.
- No usar tarjetas dentro de tarjetas salvo en items repetidos que necesitan separacion real.
- Usar gradiente solo para: CTA primario, seleccion activa fuerte o resumen destacado unico.
- Usar acentos de perfil solo para pertenencia: El, Ella, Ambos. No usarlos para todo.
- Reducir sombras: una elevacion base para cards, una elevacion alta solo para overlays/sheets.
- El bottom nav nunca debe tapar contenido ni CTAs.
- Los sheets deben sentirse como una capa modal completa; mientras esten abiertos, la navegacion de fondo no debe competir.
- Evitar mayusculas espaciadas en textos largos. Reservarlas para labels muy cortos.
- Los textos de decision no deben truncarse si son necesarios para elegir. Si se truncan, debe existir expansion clara.
- En mobile, nada importante debe quedar bajo los ultimos 96px de pantalla.

## Estado tecnico actual global

- `App.tsx` renderiza `mobileNavigationBar` de forma fija al final de casi todas las vistas.
- `PlanView.tsx` abre `MealSwapSheet`, `EquivalenciasSheet`, `SupplementsSheet` y `PlanAiRefreshSheet`.
- Solo `PlanAiRefreshSheet` comunica `plan-adjust-open` a `App.tsx`; eso oculta `Header`, pero no elimina claramente el bottom nav de todos los overlays.
- `MealSwapSheet`, `EquivalenciasSheet`, `SupplementsSheet` y `PlanAiRefreshSheet` usan `z-[70]`.
- El bottom nav en `App.tsx` usa `z-50`, asi que queda debajo del overlay, pero visualmente se percibe presente o presionando el contenido en capturas porque el sheet termina encima del area donde el usuario espera nav/CTA.
- `index.css` aplica transition global a `*`, lo que puede suavizar colores, pero tambien hace que muchos cambios de estado se sientan difusos.
- `profileThemes.ts` concentra acentos fuertes con gradientes y sombras (`btnActive`, `cardDone`, `progressFill`, `bgGradient`). Es el punto tecnico para reducir saturacion de forma consistente.

## Paso 0 - Preparar baseline visual

Archivos:

- `docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs`
- `tests/e2e/mobile-ui.spec.ts`

Estado actual:

- Ya existe un generador completo de 11 capturas con fixtures locales.
- Las capturas documentan estados suficientes para validar el rediseno.

Estado esperado:

- Antes de tocar UI, debe existir una copia fresca de las 11 capturas actuales en `iteraciones/00-baseline/`.
- El dev debe poder repetir la captura sin depender de IA real.

Tareas:

- Crear carpeta `iteraciones/00-baseline`.
- Ejecutar el generador con servidor local.
- Copiar las 11 capturas principales y `_parts` relevantes a esa carpeta.
- No modificar codigo en este paso.

Criterios de aceptacion:

- Las capturas generadas coinciden funcionalmente con las actuales.
- El dev puede abrir `01..11` y ver los mismos estados: inicio, cuestionario, plan vacio/seleccionado, sheets, kcal, compras, resumen y admin.

## Paso 1 - Resolver overlays, sheets y bottom nav

Capturas fuente:

- `04-selector-platillo-sheet.png`
- `05-plan-ajuste-ia-sheet.png`
- `06-equivalencias-sheet.png`
- `07-suplementos-sheet.png`

Archivos:

- `src/App.tsx`
- `src/components/views/PlanView.tsx`
- `src/components/MealSwapSheet.tsx`
- `src/components/PlanAiRefreshSheet.tsx`
- `src/components/EquivalenciasSheet.tsx`
- `src/components/SupplementsSheet.tsx`

Estado actual:

- Los sheets se abren sobre la app, pero la captura deja una sensacion de choque con la navegacion inferior.
- `PlanAiRefreshSheet` ocupa `h-[92dvh]` y en mobile su CTA queda visualmente demasiado cerca o debajo del area del bottom nav.
- `EquivalenciasSheet` y `SupplementsSheet` tambien usan `h-[92dvh]`; en capturas la lista queda cortada por abajo y el nav del fondo parece seguir presente.
- `MealSwapSheet` usa `h-[82dvh]` y se ve mas controlado, pero aun necesita padding inferior claro para safe area.

Estado esperado:

- Al abrir cualquier sheet, el usuario debe percibir una sola capa activa.
- El bottom nav no debe verse como control usable ni debe tapar contenido.
- Cada sheet debe tener:
  - header fijo
  - contenido scrolleable
  - footer fijo cuando haya CTA
  - `padding-bottom` suficiente para `env(safe-area-inset-bottom)`
- Ningun CTA debe quedar cortado en `390x844`.

Tareas tecnicas:

- En `PlanView.tsx`, crear un estado derivado `isAnySheetOpen`:
  - `Boolean(swapSheet) || isEquivalenciasSheetOpen || isSupplementsSheetOpen || isPlanAiSheetOpen`
- Enviar ese estado a `App.tsx` con un evento unico, por ejemplo `app-overlay-open`, o centralizarlo si el contexto ya tiene un mecanismo equivalente.
- En `App.tsx`, ocultar `mobileNavigationBar` cuando `isAnySheetOpen` sea true.
- Mantener ocultamiento de `Header` cuando aplique, pero no limitarlo solo a `PlanAiRefreshSheet`.
- En todos los sheets, normalizar contenedor mobile:
  - `fixed inset-0 z-[80]`
  - overlay: `bg-slate-950/50 backdrop-blur-[2px]`
  - panel: `h-[min(92dvh,760px)]` o `max-h-[92dvh]`
  - contenido: `min-h-0 flex-1 overflow-y-auto`
  - footer: `border-t ... pb-[calc(1rem+env(safe-area-inset-bottom))]`
- En sheets sin footer, agregar padding inferior al contenido:
  - `pb-[calc(1rem+env(safe-area-inset-bottom))]`

Criterios de aceptacion:

- En las cuatro capturas de sheets no aparece bottom nav ni compite con el panel.
- En `05-plan-ajuste-ia-sheet.png`, el boton `Actualizar plan con IA` se ve completo.
- En `06` y `07`, el ultimo item visible no queda debajo de la nav.
- El fondo queda claramente inactivo.

## Paso 2 - Normalizar sistema visual base

Capturas fuente:

- Todas, especialmente `02`, `03`, `08`, `11`.

Archivos:

- `src/index.css`
- `src/utils/profileThemes.ts`
- Componentes que usan clases sueltas de sombras, gradientes y radios.

Estado actual:

- Hay muchos `rounded-[24px]`, `rounded-[28px]`, `rounded-[30px]`, `rounded-[32px]`.
- Hay sombras distintas por componente: `shadow-[0_16px...]`, `shadow-xl`, `shadow-sm`, `shadow-[0_18px...]`.
- `profileThemes.ts` devuelve gradientes fuertes para muchos usos.
- `btnActive` incluye sombra fuerte (`shadow-lg`) en todos los perfiles.

Estado esperado:

- La app se debe ver mas utilitaria y clara, sin perder identidad.
- Deben existir 3 niveles visuales:
  - Surface base: fondo blanco/slate, sin sombra o sombra minima.
  - Card de item: borde sutil + sombra baja.
  - Overlay/sheet: sombra alta.
- Gradiente fuerte solo en CTA primario, seleccion activa principal o resumen hero.

Tareas tecnicas:

- Definir convenciones reutilizables en comentarios o constantes locales:
  - radio seccion: `rounded-2xl` o `rounded-[20px]`
  - radio card/item: `rounded-2xl`
  - radio sheet: `rounded-t-[28px] sm:rounded-[28px]`
  - sombra card: `shadow-[0_6px_18px_rgba(15,23,42,0.05)]`
  - sombra sheet: `shadow-[0_20px_60px_rgba(15,23,42,0.16)]`
- En `profileThemes.ts`, bajar peso de:
  - `btnActive`: quitar `shadow-lg`, dejar `shadow-sm` o sin sombra.
  - `cardDone`: reducir gradiente si se usa en cards secundarias.
  - `progressFill`: mantener color, pero no aplicar en tantos contenedores.
- Revisar que los cambios no rompan dark mode.

Criterios de aceptacion:

- Ninguna pantalla debe sentirse dominada por azul/morado salvo CTA/activo.
- La jerarquia de botones es clara:
  - primario: lleno/gradiente
  - secundario: borde o fondo neutro
  - terciario: texto/icono discreto
- Las cards de informacion secundaria no parecen botones primarios.

## Paso 3 - Header y navegacion mobile

Capturas fuente:

- `01-inicio-dashboard-mobile.png`
- `03-mi-plan-estados-platillo-grid.png`
- `08-calorias-dashboard.png`
- `09-lista-compras.png`
- `10-resumen-plan.png`

Archivos:

- `src/App.tsx`
- `src/components/views/Header.tsx`

Estado actual:

- `Header.tsx` muestra logo, selector de perfil, dark mode, PDF y settings.
- En mobile hay cinco tabs en `App.tsx`: Inicio, Plan, Kcal, Compras, Resumen.
- Los controles superiores tienen varias superficies lilas con sombras, compitiendo con el contenido principal.

Estado esperado:

- Header mobile debe ser una barra funcional y ligera.
- El selector de perfil debe ser el control mas importante del header.
- Los iconos de tema/PDF/settings deben verse secundarios.
- La nav inferior debe mantener cinco destinos directos, pero con estado activo menos pesado.

Tareas tecnicas:

- En `Header.tsx`:
  - reducir sombras de botones superiores
  - usar `rounded-xl` o `rounded-2xl`, no mezclar muchos radios
  - hacer el selector de perfil mas legible y con minimo `44px` de alto si el ancho lo permite
  - evitar que todos los icon buttons usen el mismo violeta fuerte
- En `App.tsx`:
  - mantener grid de 5 tabs
  - reducir `navActiveSurface` de `shadow-[0_8px_18px...]` a sombra minima o background claro
  - asegurar `min-h-[50px]` y labels legibles de `9px` o `10px`
  - cuando `isAnySheetOpen`, no renderizar `mobileNavigationBar`

Criterios de aceptacion:

- En inicio, el usuario identifica primero el perfil activo y despues el momento/comida.
- En plan/kcal/compras/resumen, la nav inferior no atrae mas atencion que el contenido.
- No hay saltos de layout al cambiar de tab.

## Paso 4 - Inicio dashboard

Captura fuente:

- `01-inicio-dashboard-mobile.png`

Archivo:

- `src/components/views/LandingView.tsx`

Estado actual:

- Fondo con imagen de comida a opacidad alta.
- Card principal con otra card interna tipo carrete 3D.
- Las tarjetas anterior/siguiente del carrusel se ven detras y parecen contenido duplicado.
- El CTA `Ver comida` esta claro, pero compite con fondos, hora, chips y tarjeta interna.

Estado esperado:

- La pantalla debe responder en 3 segundos:
  - que dia es
  - que momento toca
  - que comida corresponde o falta elegir
  - que accion sigue
- Debe sentirse como tablero diario, no como carrusel decorativo.

Tareas tecnicas:

- En `LandingView.tsx`:
  - reducir opacidad de `home-food-bg.png` o agregar overlay blanco mas fuerte.
  - simplificar el carrete: el card activo debe ser dominante y los cards vecinos deben ser apenas sugeridos o no visibles.
  - evitar bordes y sombras dobles entre card exterior e interior.
  - mantener `primaryActionLabel` y `handlePrimaryAction`; no tocar logica.
  - reducir `renderMealSummary` a:
    - perfil/es
    - nombre de platillo
    - una linea de detalle maximo
    - estado faltante si aplica
  - mantener CTA full width como unico boton fuerte.
  - `Ajustar plan con IA` debe ser enlace/boton terciario sin competir.

Criterios de aceptacion:

- El momento actual ocupa el foco visual central.
- El fondo no interfiere con texto.
- No parece que haya tres cards activas.
- CTA principal es el boton mas visible de la pantalla.

## Paso 5 - Cuestionario IA

Capturas fuente:

- `02-cuestionario-ia-grid.png`
- `_parts/questionnaire-0.png`
- `_parts/questionnaire-1.png`
- `_parts/questionnaire-2.png`
- `_parts/questionnaire-3.png`
- `_parts/questionnaire-8.png`
- `_parts/questionnaire-10.png`

Archivos:

- `src/App.tsx`
- `src/components/NutritionQuestionnaire.tsx`

Estado actual:

- `App.tsx` renderiza un header propio para cuestionario con icono, titulo, dark mode y cerrar.
- `NutritionQuestionnaire.tsx` renderiza una card grande con barra de progreso, header interno, contenido y nav inferior.
- Hay muchos iconos decorativos, emojis y chips.
- En pasos de datos fisicos, objetivo y salud, la densidad visual es alta.
- En confirmacion, hay bloques largos con muchos datos en formato lista.

Estado esperado:

- Wizard con jerarquia limpia:
  - progreso
  - titulo del paso
  - contenido de decision
  - acciones atras/saltar/siguiente
- Menos decoracion, mas lectura.
- Confirmacion debe ser un resumen escaneable, no una lista larga pesada.

Tareas tecnicas:

- En `App.tsx`, header del cuestionario:
  - reducir icono decorativo y sombra
  - mover dark mode a un estilo secundario o mantenerlo menos dominante
  - conservar cerrar accesible
- En `NutritionQuestionnaire.tsx`:
  - conservar `buildSteps`, `stepIdx`, `canContinue`, `handleGenerate`; no tocar negocio.
  - reducir altura del header interno: progreso + titulo en una sola composicion.
  - `NumField`: quitar emojis min/max si distraen; priorizar label, valor y unidad.
  - `ChipButton` y `CheckList`: normalizar alto y borde; activo claro, inactivo neutro.
  - En `confirm`, agrupar datos en secciones compactas:
    - Configuracion
    - Perfil
    - Salud/restricciones
    - Cocina/horarios
    - Modelo IA
  - El boton final debe ser el unico CTA fuerte.

Criterios de aceptacion:

- En cada paso, se entiende el paso actual y la accion siguiente sin leer toda la pantalla.
- Inputs numericos se ven como campos, no como mini cards decorativas.
- Confirmacion cabe mejor y no se siente como debug dump.
- En grid de docs, las 6 capturas se ven consistentes entre si.

## Paso 6 - Mi Plan: estado vacio y seleccionado

Capturas fuente:

- `03-mi-plan-estados-platillo-grid.png`
- `_parts/plan-empty.png`
- `_parts/plan-selected.png`

Archivo:

- `src/components/views/PlanView.tsx`

Estado actual:

- Cada momento es una card grande.
- Estado vacio repite `Para El`, `Elegir platillo`, `Para Ella`, `Elegir platillo`.
- El estado seleccionado muestra nombre, descripcion, kcal/proteina/grasas y chips de porciones con mucho peso.
- Los botones de suplementos/equivalencias/ajuste son tres icon buttons con colores fuertes.

Estado esperado:

- `Mi plan` debe ser la pantalla principal de ejecucion diaria.
- Cada momento debe mostrar rapido:
  - momento + hora
  - estado por perfil
  - accion para elegir/cambiar
- Estado vacio compacto y accionable.
- Estado seleccionado legible y menos cargado.

Tareas tecnicas:

- En header de `PlanView.tsx`:
  - mantener tres acciones, pero bajar peso visual: iconos neutros con tooltip/title.
  - solo `Ajustar` puede tener acento si es accion importante.
- En card de momento:
  - reducir sombra y radio.
  - header compacto con icono, label y hora.
  - el chevron debe ser secundario.
- `renderEmptyMealState`:
  - reducir `py-5` a algo mas compacto.
  - quitar borde punteado pesado o usar borde sutil.
  - mostrar `Elegir para El` / `Elegir para Ella` dentro del boton para evitar label separado repetitivo.
- `renderSelectedMealCard`:
  - estructura esperada:
    - nombre del platillo
    - descripcion maximo 2 lineas
    - fila de macros principales
    - porciones como detalle secundario o expandible
  - no usar color de perfil en todo el texto; usarlo para nombre o indicador lateral.
  - agregar `line-clamp-2` donde corresponda.

Criterios de aceptacion:

- En estado vacio se ven al menos desayuno y parte de colacion AM en `390x844`.
- En estado seleccionado, el nombre y macros se leen antes que los chips.
- El usuario entiende que tocar la card cambia/elegir platillo.
- No hay tarjeta dentro de tarjeta con la misma intensidad visual.

## Paso 7 - Selector de platillo

Captura fuente:

- `04-selector-platillo-sheet.png`

Archivo:

- `src/components/MealSwapSheet.tsx`

Estado actual:

- Sheet se ve bastante cercano a lo esperado, pero cada opcion tiene checkbox grande, kcal chip, descripcion truncada, macros y porciones.
- La opcion seleccionada usa borde y fondo acentuado.
- No queda explicitamente claro que seleccionar cierra el sheet.

Estado esperado:

- Selector debe permitir comparar opciones rapido.
- La opcion seleccionada debe verse elegida, no como alerta.
- Cada opcion debe responder:
  - que es
  - cuantas kcal
  - proteina y grasas
  - porciones basicas

Tareas tecnicas:

- Mantener `onToggle` y cierre actual.
- Header:
  - conservar momento, hora, cantidad de opciones y elegido.
  - reducir icono/hora si roba espacio.
- Opcion:
  - usar grid interno:
    - izquierda: radio/check pequeno
    - centro: nombre + detalle
    - derecha: kcal
  - macros como texto compacto, no muchos pills pesados.
  - porciones en una linea secundaria con truncamiento controlado.
- Agregar microcopy discreta en header o bajo titulo:
  - `Toca una opcion para cambiarla`
  - Debe ser texto secundario, no visible como instruccion grande.

Criterios de aceptacion:

- Se ven 3 opciones completas o casi completas en `390x844`.
- La opcion seleccionada no ocupa mucho mas alto que las otras.
- Kcal/proteina/grasas son escaneables.
- No hay bottom nav visible por Paso 1.

## Paso 8 - Ajuste de plan con IA

Captura fuente:

- `05-plan-ajuste-ia-sheet.png`

Archivo:

- `src/components/PlanAiRefreshSheet.tsx`

Estado actual:

- Sheet ocupa casi toda la pantalla.
- Footer con CTA queda en zona baja y la captura muestra conflicto visual con nav.
- Hay un textarea muy grande y mucho espacio muerto.
- El target profile existe en estado (`targetProfile`) pero no aparece como control visible en el codigo actual.

Estado esperado:

- Sheet debe ser un formulario breve:
  - tipo de cambio
  - a quien aplica
  - instruccion
  - CTA
- El textarea debe ser grande pero no dominar toda la pantalla.
- El usuario debe saber si esta ajustando El, Ella o Ambos.

Tareas tecnicas:

- Agregar control visible para `targetProfile` si el negocio lo permite:
  - El
  - Ella
  - Ambos
  - usar `defaultTarget` como seleccionado inicial.
- Reducir `textarea` a `min-h-[104px]` y evitar espacio muerto.
- Footer fijo con CTA y cancelar.
- Si `mode === 'regenerate'`, mostrar advertencia neutra y compacta.
- Si `errorMessage`, mantener bloque de error pero no desplazar permanentemente el CTA fuera de pantalla.

Criterios de aceptacion:

- CTA completo visible.
- Se entiende el alcance del cambio.
- No hay area vacia excesiva entre textarea y footer.
- En captura, el sheet parece formulario terminado, no pantalla partida.

## Paso 9 - Equivalencias

Captura fuente:

- `06-equivalencias-sheet.png`

Archivos:

- `src/components/EquivalenciasSheet.tsx`
- `src/components/EquivalenciasCard.tsx`

Estado actual:

- Categorias en grid 2 columnas con cards cuadradas grandes.
- Titulos largos se cortan.
- Cada card tiene icono grande, titulo, contador y `Toca para ver detalle`.
- El detalle usa otra card con watermark y lista.

Estado esperado:

- Guia de consulta rapida, mas densa.
- Categorias deben leerse completas o casi completas.
- Debe caber mas contenido util por pantalla.

Tareas tecnicas:

- En `EquivalenciasSheet.tsx`, cambiar grid cuadrado por lista compacta o grid de filas:
  - icono 36-40px
  - titulo 2 lineas maximo
  - contador
  - chevron o affordance
- Eliminar copy repetido `Toca para ver detalle` en cada item; usar affordance visual.
- En detalle:
  - reducir watermark o quitarlo.
  - lista de items con numeracion compacta.
  - evitar sombra/card interna excesiva.

Criterios de aceptacion:

- En `390x844`, se ven al menos 7 categorias sin que parezcan cortadas por la nav.
- Titulos principales no quedan truncados de forma inutil.
- El detalle de equivalencia es claramente scrolleable y legible.

## Paso 10 - Suplementos

Captura fuente:

- `07-suplementos-sheet.png`

Archivo:

- `src/components/SupplementsSheet.tsx`

Estado actual:

- Cards grandes por suplemento.
- Timing aparece como badge largo en mayusculas, parecido a alerta.
- En modo `ambos`, hay encabezado de perfil y luego cards.

Estado esperado:

- Debe quedar claro que suplementos son opcionales.
- La vista principal debe mostrar nombre, razon breve y expandir.
- Dosis, uso, nota y precaucion deben estar en detalle expandible.

Tareas tecnicas:

- Header:
  - mantener label `Opcional`, pero con menor peso visual.
- Card:
  - reducir icono a 36-40px.
  - nombre en 1-2 lineas.
  - `goalSupport` maximo 2 lineas.
  - timing como texto secundario, no badge de alerta.
- Expandido:
  - mantener secciones `Por que podria ayudar`, `Como usarlo`, `Nota`, `Precaucion`.
  - `Precaucion` si puede mantener amber, pero solo dentro del expandido.

Criterios de aceptacion:

- En primera pantalla se ven al menos 3 suplementos y parte del cuarto.
- Ningun badge parece advertencia si solo comunica horario.
- El estado expandido no rompe la legibilidad.

## Paso 11 - Calorias dashboard

Captura fuente:

- `08-calorias-dashboard.png`

Archivo:

- `src/components/views/CalorieMonitoringView.tsx`

Estado actual:

- Hay varias cards grandes: selector dia, comparativa, panel hero azul, metric cards.
- El panel hero azul domina la pantalla y empuja metricas.
- `Promedio`, `Rango` y `Mejor` tienen peso parecido al total del dia.

Estado esperado:

- Debe responder primero:
  - total del dia
  - meta
  - diferencia
  - estado
- Comparativa El/Ella debe ser util pero compacta.
- Metricas secundarias deben parecer secundarias.

Tareas tecnicas:

- Selector de dia:
  - reducir altura del bloque `Kcal por dia`.
  - pills mas compactas.
- Comparativa:
  - mantener dos cards, pero menos altura.
  - `Ver detalle` puede ser texto terciario.
- `ProfilePanel`:
  - cambiar hero de gradiente fuerte a surface clara con acento lateral, o reservar gradiente solo para estado seleccionado si se considera necesario.
  - total kcal debe seguir siendo el numero mas grande.
  - `Promedio`, `Rango`, `Mejor` como fila compacta secundaria.
- `MetricCard`:
  - reducir padding y sombra.
  - barras con contraste suficiente pero no saturadas.

Criterios de aceptacion:

- En `390x844`, se ve total, meta, diferencia y al menos inicio de metricas sin que todo sea un bloque azul.
- La comparativa no compite con el panel seleccionado.
- El usuario entiende si esta en rango, abajo o arriba.

## Paso 12 - Lista de compras

Captura fuente:

- `09-lista-compras.png`

Archivo:

- `src/components/views/ShoppingView.tsx`

Estado actual:

- Header tiene imagen de fondo y card grande.
- Ingrediente expandido muestra mucho detalle de comidas dentro de la card.
- Cards de ingredientes son altas.
- La accion principal real es marcar comprado, pero visualmente compite con `Ver/Ocultar` y detalles.

Estado esperado:

- Lista practica de supermercado:
  - checkbox
  - ingrediente
  - cantidad si existe
  - estado comprado/pendiente
  - detalle expandible secundario
- Debe parecer herramienta de compra, no reporte del plan.

Tareas tecnicas:

- Header:
  - reducir imagen de fondo o quitarla si compite.
  - mantener contador pendientes y compartir.
- Item:
  - checkbox mas claro y grande.
  - nombre de ingrediente como foco.
  - `Aparece en X comidas` como texto secundario pequeno.
  - `Ver/Ocultar` como chevron icon button o texto minimo.
  - detalle de comidas solo expandido, con menor padding.
- Si se puede derivar cantidad desde datos, mostrarla; si no existe, no inventar.

Criterios de aceptacion:

- En primera pantalla se ven mas ingredientes que antes.
- Marcar comprado se entiende como accion principal.
- El detalle expandido no hace que una sola card domine toda la pantalla.

## Paso 13 - Resumen del plan

Captura fuente:

- `10-resumen-plan.png`

Archivo:

- `src/components/views/SummaryView.tsx`

Estado actual:

- Header `Resumen` en card.
- `Puntos clave` usa cuatro cards grandes con numero, detalle y chevron.
- Despues vienen meta/perfil/detalles/macros.
- La vista ejecutiva queda demasiado abajo.

Estado esperado:

- Primera pantalla debe parecer resumen ejecutivo:
  - objetivo
  - kcal/meta
  - restricciones importantes
  - horarios/momentos
- Los puntos clave deben ser compactos.
- La tabla de macros puede quedar mas abajo.

Tareas tecnicas:

- Reducir header `Resumen` a titulo simple o card mas compacta.
- Cambiar `Puntos clave` a lista compacta:
  - numero pequeno
  - texto 1-2 lineas
  - detalle expandible opcional
- Subir `Meta` y `Perfil` o integrarlos en bloque superior compacto.
- Evitar que cuatro puntos clave consuman toda la primera pantalla.

Criterios de aceptacion:

- En `390x844`, el usuario ve puntos clave y al menos el bloque de meta/perfil sin scroll excesivo.
- Resumen no parece otra lista de tarjetas operativas.

## Paso 14 - Admin/configuracion

Capturas fuente:

- `11-admin-configuracion-grid.png`
- `_parts/admin-manual.png`
- `_parts/admin-gemini.png`

Archivos:

- `src/components/views/AdminLayout.tsx`
- `src/components/AdminPanel.tsx`

Estado actual:

- Admin usa estilo similar al producto principal: gradientes, cards grandes, badges, sombras.
- Respaldo y Gemini parecen pantallas promocionales, no utilitarias.
- Acciones tecnicas y destructivas no estan suficientemente diferenciadas por severidad/frecuencia.

Estado esperado:

- Admin debe sentirse funcional y sobrio.
- Acciones frecuentes:
  - exportar PDF
  - exportar JSON
  - importar
  - validar Gemini
- Acciones riesgosas:
  - eliminar version personalizada
  - restablecer app
- Riesgo visual separado, no mezclado con acciones normales.

Tareas tecnicas:

- `AdminLayout.tsx`:
  - reducir header y tabs.
  - en Gemini, usar layout de estado:
    - Estado actual
    - Modelo
    - Fallback
    - Acciones
  - `Reemplazar API key` puede ser primario; `Restaurar default` y `Validar` secundarios.
- `AdminPanel.tsx`:
  - quitar gradiente fuerte de contenedor de perfil.
  - usar borde/acento lateral por perfil.
  - exportar PDF/JSON como botones secundarios compactos.
  - version activa como control claro, no card grande.
  - delete icon solo visible cuando existe custom data, con tratamiento de peligro.

Criterios de aceptacion:

- En grid de admin, ambas pantallas se ven mas sobrias que `Mi Plan`.
- Las acciones peligrosas se distinguen sin dominar.
- No hay bloques con gradientes innecesarios.

## Paso 15 - Verificacion final y cierre

Archivos:

- Todos los modificados.
- `docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs`
- `tests/e2e/mobile-ui.spec.ts`

Estado esperado:

- Las 11 capturas regeneradas representan el nuevo estado visual.
- Cada captura cumple el criterio esperado de su paso.
- No hay regresion funcional en e2e.

Tareas:

- Ejecutar:

```bash
npm run build
npx playwright test tests/e2e/mobile-ui.spec.ts
```

- Regenerar capturas:

```bash
APP_URL=http://127.0.0.1:5173 node docs/capturas-flujo-negocio-2026-04-27/_generate-docs.mjs
```

- Comparar:
  - `iteraciones/00-baseline`
  - capturas nuevas `01..11`
  - criterios de este documento

Criterios de aceptacion global:

- No hay bottom nav visible encima de sheets.
- No hay CTA cortado o tapado.
- La primera accion de cada pantalla es obvia.
- El plan diario se ve como flujo principal de producto.
- Equivalencias, suplementos, resumen y admin se ven secundarios/consultivos.
- En mobile `390x844`, ninguna pantalla principal tiene texto importante superpuesto o ilegible.
- Los tests e2e pasan.

## Mapa rapido por archivo

| Archivo | Responsabilidad visual | Pasos |
|---|---|---|
| `src/App.tsx` | layout global, nav mobile, shells, questionnaire shell | 1, 3, 5 |
| `src/index.css` | tokens globales, transiciones, overflow | 2 |
| `src/utils/profileThemes.ts` | acentos, gradientes, botones activos, progreso | 2 |
| `src/components/views/Header.tsx` | header movil/desktop, perfil, PDF, theme, settings | 3 |
| `src/components/views/LandingView.tsx` | inicio dashboard, fondo, momento actual, CTA | 4 |
| `src/components/NutritionQuestionnaire.tsx` | wizard IA completo | 5 |
| `src/components/views/DailyProgress.tsx` | selector de dias y progreso de plan | 6 |
| `src/components/views/PlanView.tsx` | Mi Plan, estados vacio/seleccionado, apertura de sheets | 1, 6 |
| `src/components/MealSwapSheet.tsx` | selector de platillo | 1, 7 |
| `src/components/PlanAiRefreshSheet.tsx` | ajuste/regeneracion IA | 1, 8 |
| `src/components/EquivalenciasSheet.tsx` | sheet de categorias de equivalencias | 1, 9 |
| `src/components/EquivalenciasCard.tsx` | detalle de equivalencia | 9 |
| `src/components/SupplementsSheet.tsx` | sheet de suplementos | 1, 10 |
| `src/components/views/CalorieMonitoringView.tsx` | dashboard kcal/macros | 11 |
| `src/components/views/ShoppingView.tsx` | supermercado/lista de compras | 12 |
| `src/components/views/SummaryView.tsx` | resumen ejecutivo y macros | 13 |
| `src/components/views/AdminLayout.tsx` | shell admin y Gemini | 14 |
| `src/components/AdminPanel.tsx` | cards respaldo/restauracion por perfil | 14 |

## Definicion de terminado

Un dev termina este plan solo cuando:

1. Cada paso tiene captura `before` y `after`.
2. Cada `after` fue comparado contra el estado esperado.
3. Si un `after` no cumplio, el paso fue reiterado hasta cumplir.
4. `npm run build` pasa.
5. `npx playwright test tests/e2e/mobile-ui.spec.ts` pasa.
6. Las 11 capturas finales fueron regeneradas.
7. Los `.md` de capturas siguen describiendo correctamente lo que se ve o fueron actualizados si la descripcion visual cambio.


