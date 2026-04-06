# Plan de Arquitectura Moderna - Plan Nutricional

## 📋 Información del Proyecto

**Aplicación:** Planificador de comidas personalizado con perfiles (El, Ella, Ambos)  
**Stack actual:** React + TypeScript + Vite + Tailwind + React Router  
**Estado:** Refactorización en progreso - migrando de arquitectura monolítica a feature-based  

---

## Estado Actual vs Objetivo

### Problemas Identificados
| Problema | Impacto | Ejemplo concreto |
|----------|---------|------------------|
| `App.tsx` tiene ~1,674 líneas | Difícil de mantener, riesgo de bugs | Cambiar lógica de selección afecta routing |
| Vistas embebidas en App.tsx | Código muerto difícil de detectar | Admin, AI Generator, Landing dentro de App.tsx |
| OutletContext con 50+ props | Acoplamiento excesivo, render innecesario | Cualquier cambio en estado causa re-render de todas las páginas |
| Lógica de negocio mezclada con UI | No testeable, violación SRP | `toggleSeleccion` definido en App.tsx pero usado solo en PlanPage |
| Sin separación de servicios | API calls dispersos, sin caché | Llamadas a Gemini en componente, no reusable |

### Datos que maneja la App
```typescript
// Perfiles (estático, de data.ts)
interface Perfil {
  id: 'el' | 'ella'
  nombre: string
  meta: string              // "Bajar 5kg en 2 meses"
  perfil: string            // "Mujer 35 años, sedentaria"
  objetivosPorMomento: {    // Porciones por tiempo de comida
    desayuno: { frutas: 1, verduras: 2, proteina: 3, ... }
    comida: { ... }
    ...
  }
  resumenPersonal: string[] // "Come proteína en cada comida"
}

// Estado de selecciones (dinámico, localStorage)
type SeleccionKey = `${perfilId}-${dia}-${momento}-${comidaNombre}`
// Ej: "el-Lunes-desayuno-Tacos de huevo"

// Compras (calculado de selecciones)
interface ListaCompra {
  ingrediente: string
  usos: Array<{ dia, momento, perfil, comida }>
}
```

---

## Arquitectura Propuesta

### 1. Estructura de Carpetas (Feature-Based)

```
src/
├── 📁 app/                          # Configuración raíz
│   ├── App.tsx                     # Solo routing + providers
│   ├── router.tsx                  # Config de rutas (ya existe)
│   └── providers.tsx               # Context providers wrapper
│
├── 📁 features/                     # Por funcionalidad (no por tipo)
│   ├── 📁 plan/
│   │   ├── components/
│   │   │   ├── MealSelector.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── hooks/
│   │   │   ├── usePlanSelection.ts
│   │   │   └── useAutoScroll.ts
│   │   ├── stores/
│   │   │   └── planStore.ts        # Zustand (no Redux)
│   │   ├── PlanPage.tsx
│   │   └── types.ts
│   │
│   ├── 📁 shopping/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   └── useShoppingList.ts
│   │   ├── stores/
│   │   │   └── shoppingStore.ts
│   │   └── ComprasPage.tsx
│   │
│   ├── 📁 ai-generator/
│   │   ├── components/
│   │   │   └── NutritionQuestionnaire.tsx
│   │   ├── services/
│   │   │   └── geminiService.ts    # API calls encapsuladas
│   │   ├── hooks/
│   │   │   └── useGeminiGeneration.ts
│   │   └── GeneratePage.tsx        # Mover desde App.tsx
│   │
│   ├── 📁 admin/
│   │   ├── components/
│   │   ├── AdminPage.tsx           # Completar con Admin View
│   │   └── hooks/
│   │       └── useAdminSettings.ts
│   │
│   └── 📁 landing/
│       ├── components/
│       └── LandingPage.tsx         # Mover desde App.tsx
│
├── 📁 shared/                       # Reutilizable entre features
│   ├── components/
│   │   ├── ui/                     # Shadcn/ui base
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Navigation.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── cn.ts
│   └── types/
│       └── global.ts
│
├── 📁 data/                         # Datos estáticos
│   ├── perfiles/
│   └── equivalencias/
│
└── 📁 stores/                       # Estado global (mínimo)
    └── rootStore.ts                 # Zustand - solo si es necesario
```

---

## 2. Stack Tecnológico Recomendado

### Estado Global: ¿Redux Toolkit vs Zustand vs Context?

| Criterio | Redux Toolkit | Zustand | React Context | Ganador |
|----------|--------------|---------|---------------|---------|
| Boilerplate | ~40 líneas/slice | ~10 líneas | ~20 líneas | Zustand |
| Re-renders | Controlados | Granulares | Todo el árbol | Zustand |
| Learning Curve | Moderada | Baja | Baja | Zustand |
| DevTools | Excelente | Buena | Básica | Redux |
| Bundle Size | ~11KB | ~1KB | 0KB | Zustand |
| TypeScript | Verbose | Nativo | Nativo | Zustand |
| App Size | Enterprise | Small-Medium | Small | Depende |

**Veredicto:** Para esta app (~50 estados), **Zustand** es suficiente.  
**Context API** solo para: tema, autenticación (datos que raramente cambian).  
**Redux** solo si: 10+ features complejas, time-travel debugging heavy, equipo grande.

### Stack Completo Recomendado

```yaml
Core (ya implementado):
  - React 18 + TypeScript strict
  - Vite (build tool)
  - React Router v6 (routing)
  - Tailwind CSS (estilos)
  - Framer Motion (animaciones)

State Management (nuevo):
  - Zustand: Estado global (reemplaza OutletContext)
  - TanStack Query: Server state, caché de API
  - React Hook Form: Formularios
  - Zod: Validación de schemas

UI Components (recomendado):
  - shadcn/ui: Componentes base accesibles
  - Lucide React: Iconos (ya implementado)

Servicios:
  - axios: HTTP client (mejor que fetch para interceptors)
  - @tanstack/react-query: Caché, reintentos, estados de loading/error

Testing:
  - Vitest: Unit tests (nativo Vite)
  - React Testing Library: Tests de componentes
  - Playwright: E2E tests
  - MSW (Mock Service Worker): Mock de API en tests

Calidad de código:
  - ESLint + Prettier: Formato y reglas
  - Husky: Git hooks para pre-commit lint
  - TypeScript strict: Null checks activados

Instalación de dependencias nuevas:
```bash
# Estado global
npm install zustand

# Server state + caché
npm install @tanstack/react-query axios

# Formularios + validación
npm install react-hook-form zod @hookform/resolvers

# Testing
npm install -D vitest @testing-library/react @testing-library/jid-dom jsdom
npm install -D @playwright/test msw
```
```

---

## 3. Plan de Migración por Fases

### Fase 1: Extracción de Vistas (Week 1)

**Objetivo:** Reducir App.tsx de ~1,600 a ~400 líneas

1. Mover `showAdmin` → `AdminPage.tsx` completo
2. Mover `showQuestionnaire` → `GeneratePage.tsx` completo  
3. Mover landing `!perfilActivo` → `LandingPage.tsx` completo
4. App.tsx solo maneja `Outlet` y layout básico

**Resultado esperado:** App.tsx = Routing + Header + Navigation + Footer

### Fase 2: Hooks Personalizados (Week 2)

**Objetivo:** Desacoplar lógica de UI

1. `usePlanSelection.ts`
   - `toggleSeleccion()`
   - `selecciones` state
   - `momentoCompletado` computed

2. `useAutoScroll.ts`
   - `scrollToMomento()`
   - `mealSectionRefs`
   - `pendingAutoScrollMomento`

3. `useGeminiGeneration.ts`
   - `handleGenerateWithAi()`
   - `callGeminiDirectly()` → extraer a `geminiService.ts`

4. `useLocalStorage.ts`
   - Unificar persistencia (actualmente dispersa en useEffects)

### Fase 3: Feature-Based Structure (Week 3)

**Objetivo:** Reorganizar carpetas

```bash
# Comandos de migración
mkdir -p src/features/{plan,shopping,ai-generator,admin,landing}
mv src/pages/PlanPage.tsx src/features/plan/
mv src/components/MealSelector.tsx src/features/plan/components/
# ... etc
```

### Fase 4: State Management (Week 4)

**Objetivo:** Reemplazar OutletContext con Zustand

**Stores recomendadas:**

```typescript
// stores/planStore.ts
interface PlanState {
  selecciones: Record<string, boolean>;
  diaActivo: string;
  momentosEnEdicion: Record<string, boolean>;
  momentosColapsados: Record<string, boolean>;
  
  // Actions
  toggleSeleccion: (key: string) => void;
  setDiaActivo: (dia: string) => void;
}

// stores/uiStore.ts
interface UIState {
  progressExpanded: boolean;
  adminTab: 'settings' | 'manual';
  setProgressExpanded: (v: boolean) => void;
}
```

**Beneficios:**
- No más prop drilling
- Cada feature tiene su propio estado
- DevTools de Zustand para debugging
- Persistencia granular con `persist` middleware

---

## 4. Ejemplo de Refactor: De App.tsx a Feature

### Antes (App.tsx - 50 líneas mezcladas)
```tsx
// Estado disperso
const [selecciones, setSelecciones] = useState({...})
const mealSectionRefs = useRef(...)

// Lógica mezclada
const toggleSeleccion = useCallback((...) => {
  // 20 líneas de lógica
  setSelecciones(...)
  // 10 líneas más de lógica
}, [deps])

// UI mezclada
{tab === 'plan' && <PlanPage ...50 props />}
```

### Después (PlanPage.tsx autónomo)
```tsx
// features/plan/PlanPage.tsx
export function PlanPage() {
  const { selecciones, toggleSeleccion } = usePlanSelection()
  const { scrollToMomento } = useAutoScroll()
  
  return (
    <div>
      <ProgressBar onMomentClick={scrollToMomento} />
      <MealSelector 
        selecciones={selecciones} 
        onToggle={toggleSeleccion}
      />
    </div>
  )
}
```

---

## 5. Roadmap Priorizado

### Alta Prioridad (Hacer primero)
1. ✅ Extraer vistas de App.tsx (Admin, Generate, Landing)
2. ✅ Crear `geminiService.ts` para desacoplar AI
3. ✅ Implementar `usePlanSelection` hook

### Media Prioridad (Hacer después)
4. Migrar a feature-based folders
5. Implementar Zustand para estado global
6. Crear hooks genéricos (`useLocalStorage`, `useForm`)

### Baja Prioridad (Nice to have)
7. Agregar TanStack Query para cacheo
8. Implementar tests con Vitest
9. Agregar Storybook para componentes

---

## 6. Anti-Patrones a Evitar

❌ **NO hacer:**
- Redux para esta app (overkill)
- Contextos anidados más de 2 niveles
- Props drilling más de 2 niveles
- Lógica de negocio en componentes presentacionales
- `any` types en TypeScript

✅ **SÍ hacer:**
- Zustand para estado compartido
- Co-locar lógica con componentes (hooks)
- Feature-based folders
- Strict TypeScript
- Tests unitarios para hooks críticos

---

## 7. Métricas de Éxito

Después del refactor:
- [ ] App.tsx < 300 líneas
- [ ] Cada page < 200 líneas
- [ ] 0 `any` types
- [ ] Cada hook tiene test unitario
- [ ] Build time < 5 segundos
- [ ] Bundle size < 500KB (gzipped)

---

## Resumen Ejecutivo

**Para esta app, NO usar Redux.** Zustand + TanStack Query es suficiente.

**Orden de prioridad:**
1. Extraer vistas de App.tsx (más impacto inmediato)
2. Crear hooks personalizados (mejora testabilidad)
3. Migrar a feature-based (mejora maintainability)
4. Implementar Zustand (opcional, si OutletContext se vuelve problema)

**Tiempo estimado:** 3-4 semanas de trabajo part-time.

---

## 8. Glosario de Términos del Dominio

| Término | Descripción | Ejemplo |
|---------|-------------|---------|
| **Perfil** | Usuario del plan ('el', 'ella') | "El" = hombre 35 años |
| **Momento** | Tiempo de comida en el día | desayuno, colacion_am, comida, colacion_pm, cena |
| **Selección** | Comida elegida por el usuario | "el-Lunes-desayuno-Tacos de huevo" = true |
| **Plan** | Todas las comidas de una semana por día y momento | plan['Lunes']['desayuno'] = [comida1, comida2, comida3] |
| **Equivalencias** | Tabla de intercambio de alimentos | 1 porción fruta = 1 manzana mediana |
| **Objetivos por Momento** | Cuántas porciones de cada grupo en cada tiempo | desayuno: {frutas: 1, proteina: 2} |
| **Progreso del Día** | Porcentaje de momentos completados | 60% = 3 de 5 momentos con selección |
| **Compras** | Lista de ingredientes calculada de selecciones | Ingredientes de todas las comidas elegidas |
| **Ambos** | Modo donde se ven 2 perfiles simultáneamente | Para parejas que compran juntas |

---

## 9. Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Landing   │  │    Plan     │  │       Admin         │  │
│  │  (selección │  │  (selección │  │  (API keys, config) │  │
│  │   perfil)   │  │   comidas)  │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                      │            │
│         └────────────────┼──────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────┼───────────────────────────────┐  │
│  │         LAYER: Estado (Zustand Stores)              │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │  │
│  │  │ planStore   │ │  uiStore    │ │ adminStore      │   │  │
│  │  │ • seleccion │ │ • diaActivo │ │ • geminiApiKey  │   │  │
│  │  │ • diaActivo │ │ • tema      │ │ • geminiModel   │   │  │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬────────┘   │  │
│  └─────────┼──────────────┼───────────────┼──────────────┘  │
│            │              │               │                 │
│  ┌─────────┼──────────────┼───────────────┼───────────────┐ │
│  │         │   LAYER: Persistencia (localStorage)        │ │
│  │         ▼              ▼               ▼              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │ │
│  │  │selecciones  │ │   diaActivo │ │  geminiApiKey   │   │ │
│  │  │   JSON      │ │   string    │ │   string        │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────┐ │
│  │         LAYER: Servicios (API externa)                │ │
│  │  ┌─────────────┐                                      │ │
│  │  │geminiService│ ←── Llama a Gemini API              │ │
│  │  │             │      (solo en /generate)             │ │
│  │  └─────────────┘                                      │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Troubleshooting / Problemas Comunes

### "No se persisten las selecciones"
**Causa:** localStorage key incorrecta o parse error  
**Fix:** Verificar `localStorage.getItem('seleccionesDieta')` en DevTools → Application

### "Zustand no detecta cambios"
**Causa:** Mutando estado directamente en lugar de usar actions  
**Fix:** Siempre usar `store.setState()` o actions definidos en el store

### "Componente no re-renderiza cuando cambia store"
**Causa:** Usando `store.getState()` en lugar de hook  
**Fix:** Usar `usePlanStore()` hook, no la instancia directa

### "TypeScript error: Property does not exist"
**Causa:** Interface de store no actualizada  
**Fix:** Actualizar `PlanState` interface cuando agregues nuevas propiedades

---

## 11. Cómo Empezar (Checklist Primer Día)

```bash
# 1. Instalar dependencias necesarias
npm install zustand

# 2. Crear estructura de carpetas
mkdir -p src/features/{plan,shopping,ai-generator,admin,landing}/{components,hooks,services,stores}
mkdir -p src/shared/{components,hooks,lib}

# 3. Verificar que todo compila
npm run build

# 4. Crear primer hook de prueba
# Crear archivo: src/features/plan/hooks/usePlanSelection.ts

# 5. Testear que funciona
npm run dev
```

**Primer archivo a crear:** `src/features/plan/hooks/usePlanSelection.ts`  
**Segundo archivo:** `src/features/plan/stores/planStore.ts`  
**Tercer archivo:** Extraer `AdminView` de App.tsx a `src/features/admin/AdminPage.tsx`

---

## 12. Recursos Adicionales

- **Zustand Docs:** https://docs.pmnd.rs/zustand/getting-started/introduction
- **TanStack Query:** https://tanstack.com/query/latest
- **Feature-Based Architecture:** https://react-file-structure.surge.sh/
- **Vite Best Practices:** https://vitejs.dev/guide/best-practices.html

---

**Documento versión:** 1.0  
**Última actualización:** Abril 2026  
**Autor:** Arquitecto de Software (AI Assistant)
