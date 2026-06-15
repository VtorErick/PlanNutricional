# Plan Nutricional

SPA para planear comidas semanales para dos perfiles (`El`, `Ella`) y una vista combinada (`Ambos`). La app permite elegir platillos por tiempo de comida, revisar kcal, preparar compras, consultar resumen, exportar PDF y crear o ajustar planes con Google Gemini desde backend.

El paquete se llama `plan-comidas-2026`; el producto visible para usuarios sigue siendo **Plan Nutricional**.

## Estado Actual

- **Inicio** (`/home`): pantalla móvil con barra superior fija, barra inferior fija y carrusel vertical 3D tipo cilindro. El carrusel muestra el tiempo de comida anterior, actual y siguiente; el activo queda al centro. El CTA cambia según el estado: `Crear mi plan con IA`, `Elegir {tiempo}` o `Ver {tiempo}`. Si ya hay plan, aparece el CTA secundario `Ajustar plan con IA`.
- **Mi Plan** (`/miplan?profile=...`): selecciona platillos por día y tiempo de comida. La barra de días se centra automáticamente en el día activo. Desde esta vista se abren como hojas modales `Suplementos`, `Guía` de equivalencias y `Ajustar` con IA.
- **Kcal** (`/calorias?profile=...`): muestra calorías, proteína y grasa calculadas desde las comidas seleccionadas.
- **Compras** (`/compras?profile=...`): genera una lista por ingredientes de las comidas seleccionadas, agrupada por pasillo. El botón `Compartir` queda dentro de la franja de estado.
- **Resumen** (`/resumen?profile=...`): concentra metas, notas del perfil y distribución del plan.
- **Administración / Gemini** (`/admin`): mantiene respaldo JSON/PDF y una sección `AI Gemini` simplificada con modelo actual, fallback, reemplazo de API key y restauración de la key default.
- **Recuperación de app**: errores recuperables por chunks obsoletos o imports dinámicos disparan una recarga automática única antes de mostrar la pantalla de error.

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
| `GEMINI_API_KEY` | API key de Google Generative Language usada por el backend |
| `GEMINI_MODEL` | Modelo default del servidor |
| `APP_URL` / `SITE_URL` | Opcional para validar orígenes confiables en API |

El cliente puede guardar una API key personalizada en `localStorage` (`geminiCustomApiKey`) para probar desde la UI, pero la key default vive en servidor.

## API

Las funciones viven en `api/` y se despliegan con Vercel.

- `POST /api/gemini-status`: valida disponibilidad, modelo activo, fallback y estado de generación.
- `POST /api/generate-plan`: genera, ajusta o recrea planes. El backend arma prompts, valida estructura, aplica fallback de modelos, sanitiza logs y devuelve `elData`, `ellaData`, `responseMode` y `modelUsed` cuando aplica.

Ambos endpoints aplican CORS, validación de origen y rate limit.

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
| `src/components/views/PlanView.tsx` | Mi Plan, selección de platillos y hojas de Suplementos/Guía/Ajustar |
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

Playwright sirve `dist` en `http://127.0.0.1:4173` y usa mocks para Gemini; no consume cuota real.

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
3. Variables: `GEMINI_API_KEY`, `GEMINI_MODEL` y, si aplica, `APP_URL` o `SITE_URL`.
4. `vercel.json` mantiene rewrites SPA y configuración de funciones.
