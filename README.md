# Plan Nutricional

SPA para planear y registrar comidas semanales para dos perfiles (`El`, `Ella`) y una vista combinada (`Ambos`). La app permite elegir platillos, registrar lo que realmente se comió con foto o texto, revisar kcal, preparar compras, consultar resumen, exportar PDF y crear o ajustar planes con IA desde backend.

El paquete se llama `plan-comidas-2026`; el producto visible para usuarios sigue siendo **Plan Nutricional**.

## Estado Actual

- **Inicio** (`/home`): saludo contextual según la hora (`Buenos días/tardes/noches`) y tarjeta del momento actual con carrusel vertical de tiempos de comida (anterior, actual, siguiente, con swipe, rueda y teclado). El CTA cambia según el estado: `Crear mi plan con IA`, `Elegir {tiempo}` o `Ver {tiempo}`. Si ya hay plan, aparece el CTA secundario `Ajustar plan con IA`.
- **Mi Plan** (`/miplan?profile=...`): selecciona platillos o registra lo que realmente comió el usuario mediante una foto o una descripción. La IA estima la porción y los macros, el usuario puede corregirlos y, al guardar, se actualizan plan, Kcal y compras.
- **Kcal** (`/calorias?profile=...`): anillo de progreso del día, metas de calorías, proteína y grasa calculadas desde las comidas seleccionadas, comparativa de perfiles y semana completa.
- **Compras** (`/compras?profile=...`): genera una lista por ingredientes de las comidas seleccionadas, agrupada por pasillo, con barra de progreso de compra. El botón `Compartir` queda en el encabezado.
- **Resumen** (`/resumen?profile=...`): concentra metas, notas del perfil y distribución del plan.
- **Administración / Gemini** (`/admin`): mantiene respaldo JSON/PDF y una sección `AI` simplificada con modelo actual, fallback, reemplazo de API key y restauración de la key default.
- **Recuperación de app**: errores recuperables por chunks obsoletos o imports dinámicos disparan una recarga automática única antes de mostrar la pantalla de error.

## Diseño

El sistema visual es minimalista y monocromático con acentos fuertes:

| Token | Uso |
| --- | --- |
| Base | Escala `ink` (casi negro) y `cream` (gris frío) para texto, superficies y bordes finos |
| Marca / Ambos | `pine` (naranja ember `#f9541a`) |
| Perfil Él | `ocean` (azul eléctrico `#2f6bff`) |
| Perfil Ella | `coral` (rosa fuerte `#f92f7c`) |
| Avisos | `apricot` |
| Tipografía | `Space Grotesk` para display/títulos, `Inter` para UI |

Los tokens viven en `src/index.css` (`@theme` de Tailwind 4) y los mapas por perfil en `src/utils/profileThemes.ts`. Componentes clave: navegación móvil flotante tipo cápsula, CTAs en píldora, tarjetas con sombras `shadow-soft`/`shadow-lift`, anillo SVG de progreso en Kcal y hojas modales con handle.

## Stack

| Área | Tecnología |
| --- | --- |
| UI | React 19, TypeScript, Vite |
| Estilos | Tailwind CSS 4, `src/index.css` |
| Animación | Framer Motion |
| Iconos | lucide-react |
| PDF | jsPDF + jspdf-autotable |
| E2E | Playwright móvil Chromium |
| Unit | `tsx --test` |

## Desarrollo

```bash
npm install
npm run dev
```

`npm run dev` sirve Vite en `http://localhost:3000` y proxifica `/api` hacia `http://localhost:3001`.

Para probar frontend y funciones serverless juntas:

```bash
npm run dev:vercel
```

Para producción local:

```bash
npm run build
npm run preview
```

## Variables de Entorno

Usa `.env.local` en local y variables del proyecto en Vercel. No se versionan archivos `.env`.

| Variable | Uso |
| --- | --- |
| `AI_PROVIDER` | Proveedor de texto: `deepseek` (default) o `gemini` |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` | Generación y análisis por descripción con DeepSeek |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Alternativa para generación y análisis por texto |
| `ZHIPU_API_KEY` | Análisis gratuito de una foto con `glm-4.6v-flash` |
| `QWEN_API_KEY` | Análisis de foto con Qwen; si existe, se prefiere automáticamente |
| `VISION_PROVIDER` | Opcional: fuerza `qwen` o `zhipu` |
| `VISION_API_KEY`, `VISION_API_BASE_URL`, `VISION_MODEL` | Overrides para un proveedor de visión OpenAI-compatible |
| `APP_URL` / `SITE_URL` | Opcional para validar orígenes confiables en API |

El cliente puede guardar una API key personalizada en `localStorage` (`geminiCustomApiKey`) para probar desde la UI, pero la key default vive en servidor.
Si DeepSeek no está configurado o se queda sin saldo, una key de Qwen o Zhipu también funciona automáticamente como respaldo para el análisis por descripción.

## API

Las funciones viven en `api/` y se despliegan con Vercel.

- `POST /api/gemini-status`: valida disponibilidad, modelo activo, fallback y estado de generación.
- `POST /api/generate-plan`: genera, ajusta o recrea planes. El backend arma prompts, valida estructura, aplica fallback de modelos, sanitiza logs y devuelve `elData`, `ellaData`, `responseMode` y `modelUsed` cuando aplica.
- `POST /api/analyze-food`: analiza una foto con Qwen/Zhipu o una descripción con DeepSeek/Gemini y devuelve una estimación nutricional validada.

Los endpoints aplican CORS, validación de origen y rate limit.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/home` | Inicio |
| `/miplan?profile=el|ella|ambos` | Mi Plan |
| `/calorias?profile=el|ella|ambos` | Kcal |
| `/compras?profile=el|ella|ambos` | Supermercado |
| `/resumen?profile=el|ella|ambos` | Resumen |
| `/plan-ia?target=el|ella|ambos` | Cuestionario IA |
| `/admin` | Administración y Gemini |

`/plan`, `/equivalencias` y `/suplementos` se mantienen en el router por compatibilidad, pero la navegación móvil final usa Inicio, Plan, Kcal, Compras y Resumen. Equivalencias y Suplementos se abren desde Mi Plan como hojas.

## Estado Local

La app persiste datos en `localStorage` con `src/hooks/useLocalStorage` y lectura defensiva en `src/utils/appStorage.ts`.

| Clave | Contenido |
| --- | --- |
| `darkMode` | tema |
| `diaActivo` | día seleccionado |
| `perfilActivo` | perfil activo |
| `seleccionesDieta` | comidas seleccionadas |
| `comprasCheck` | ingredientes marcados |
| `dataVersions` | `original` o `custom` por perfil |
| `customData` | planes, perfiles, equivalencias y suplementos personalizados |
| `profileLabels` | nombres visibles de perfiles |
| `geminiModel` | modelo elegido |
| `geminiCustomApiKey` | API key personalizada opcional |
| `lastQuestionnaireContexts` | último contexto de cuestionario por perfil |
| `questionnaireTargetProfile` | objetivo actual del cuestionario |
| `questionnaireStepsByProfile` | paso guardado por perfil |
| `questionnaireEl` / `questionnaireElla` | borradores del formulario |

## Componentes Principales

| Archivo | Rol |
| --- | --- |
| `src/App.tsx` | shell, rutas lógicas, tabs, navegación móvil y viewport móvil |
| `src/context/DietContext.tsx` | estado global, persistencia, IA, selección de comidas y sincronización de rutas |
| `src/components/views/LandingView.tsx` | Inicio y carrusel vertical 3D |
| `src/components/views/PlanView.tsx` | Mi Plan, selección y registro de comidas y hojas secundarias |
| `src/components/MealLogSheet.tsx` | Captura por foto/texto, revisión y corrección antes de guardar |
| `src/components/PlanAiRefreshSheet.tsx` | ajuste o recreación de plan con IA |
| `src/components/views/AdminLayout.tsx` | respaldo y configuración Gemini |
| `src/components/AppErrorBoundary.tsx` | fallback visual y recuperación de errores |

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Vite en `:3000` |
| `npm run dev:vercel` | Vercel dev con API local |
| `npm run build` | Typecheck y build a `dist/` |
| `npm run preview` | sirve `dist/` |
| `npm run test:unit` | unit tests |
| `npm run test:e2e` | build + Playwright móvil |

Playwright sirve `dist` en `http://127.0.0.1:4173` y usa mocks para IA; no consume cuota real.

## Capturas

Las capturas versionadas viven en `docs/screenshots/mobile/` y se regeneran desde Playwright con `saveDocScreenshot`. La guía de uso las referencia directamente:

- `landing-mobile.png`
- `plan-mobile.png`
- `equivalencias-mobile.png`
- `supplements-mobile.png`
- `calories-mobile.png`
- `shopping-mobile.png`
- `summary-mobile.png`
- `admin-settings-mobile.png`
- `questionnaire-confirm-mobile.png`

No se versionan capturas temporales de auditoría ni carpetas locales como `design-captures/`.

## Higiene del Repo

No versionar:

- `.env`, `.env.local`, `.env.*.local`
- `node_modules/`
- `dist/`
- `.vercel/`
- capturas temporales en `design-captures/`
- documentos locales de planeación como `PLAN_*.md` o `*_PLAN.md`

Los archivos de documentación final del repo son `README.md`, `GUIA_DE_USO.md` y las capturas canónicas en `docs/screenshots/mobile/`.

## Despliegue

En Vercel:

1. Build command: `npm run build`.
2. Output: `dist`.
3. Variables: `DEEPSEEK_API_KEY`, una key de visión (`ZHIPU_API_KEY` o `QWEN_API_KEY`) y, si aplica, `APP_URL` o `SITE_URL`.
4. `vercel.json` mantiene rewrites SPA y configuración de funciones.
