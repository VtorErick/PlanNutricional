# Plan Nutricional

Aplicación web en React + Vite para gestionar planes nutricionales personalizados para `El`, `Ella` o `Ambos`, con generación por IA, edición de comidas, seguimiento diario y documentación visual validada en móvil con Playwright.

## Estado actual

- Landing mobile-first con acceso a perfiles individuales y vista compartida.
- Cuestionario IA en varios pasos para generar o actualizar planes.
- Ajustes avanzados para Gemini, respaldo/restauración JSON y reseteo local.
- Vista de plan con selección de comidas por momento, edición de platillos y descarga de PDF.
- Vistas dedicadas de equivalencias, suplementos, calorías, compras y resumen.
- Persistencia local en `localStorage`.
- Suite E2E móvil con capturas reales en `docs/screenshots/mobile`.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Framer Motion
- jsPDF / jspdf-autotable
- Playwright

## Variables de entorno

Opcionales para la generación con IA:

```bash
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run test:e2e
```

`npm run test:e2e` compila la app, levanta `vite preview`, ejecuta la suite móvil y actualiza las capturas usadas en esta documentación.

## Flujos cubiertos por pruebas móviles

- Landing y acceso a administración.
- Configuración de generación IA.
- Cuestionario completo para `Ambos` con generación simulada.
- Selección de comidas en `Mi Plan`.
- Edición de un platillo y descarga de PDF diario.
- Navegación móvil por `Equivalencias`, `Suplementos`, `Calorías`, `Compras` y `Resumen`.

## Capturas actuales

### Landing

![Landing móvil](docs/screenshots/mobile/landing-mobile.png)

### Configuración

![Ajustes avanzados en móvil](docs/screenshots/mobile/admin-settings-mobile.png)

### Confirmación del cuestionario IA

![Confirmación del cuestionario en móvil](docs/screenshots/mobile/questionnaire-confirm-mobile.png)

### Mi Plan

![Vista de plan en móvil](docs/screenshots/mobile/plan-mobile.png)

### Compras

![Lista de compras en móvil](docs/screenshots/mobile/shopping-mobile.png)

### Calorías

![Monitoreo de calorías en móvil](docs/screenshots/mobile/calories-mobile.png)

### Resumen

![Resumen en móvil](docs/screenshots/mobile/summary-mobile.png)

## Estructura relevante

```text
api/                         Endpoints para Gemini en despliegue
docs/screenshots/mobile/     Capturas generadas por Playwright
src/components/views/        Landing, plan, compras, calorías, resumen, etc.
src/context/                 Estado global y navegación
src/data/defaults/           Fixtures base de los perfiles
tests/e2e/                   Suite móvil y helpers de seed/mocks
playwright.config.ts         Configuración E2E
```

## Guía de uso

La guía operativa de la aplicación está en [GUIA_DE_USO.md](GUIA_DE_USO.md).
