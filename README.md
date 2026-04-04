# Plan de Comidas 2026 - App React Moderna

Una aplicación web moderna y responsiva para gestionar planes de nutrición personalizados. Diseñada con React 19, Vite, TypeScript y TailwindCSS.

## 🎯 Características

- **Dos Perfiles Personalizados**: Vo y Va con planes específicos
- **Plan Semanal Completo**: Lunes a Domingo con múltiples opciones por comida
- **Selector Interactivo**: Marca tus comidas durante el día
- **Seguimiento de Progreso**: Visualiza tu avance diario en tiempo real
- **Equivalencias Inteligentes**: Consulta porciones y equivalencias de alimentos
- **Interfaz Moderna**: Animaciones suaves, gradientes, y diseño 2026
- **Generación con IA mediante cuestionario**: Crea JSON VO/VA automáticamente con Gemini
- **Completamente Responsiva**: Funciona perfecto en móvil, tablet y desktop

## 🚀 Quick Start

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La app se abrirá automáticamente en `http://localhost:5173`

### Producción

```bash
npm run build
npm run preview
```

## 📦 Tecnologías

- **React 19** - Framework UI
- **Vite** - Build tool ultrarrápido
- **TypeScript** - Type safety
- **TailwindCSS** - Estilos modernos
- **Framer Motion** - Animaciones fluidas
- **Lucide React** - Iconografía limpia

## 📁 Estructura

```
src/
├── components/
│   ├── MealSelector.tsx      # Selector de comidas
│   ├── EquivalenciasCard.tsx # Tarjeta de equivalencias
│   └── ProfileCard.tsx       # Perfil del usuario
├── data.ts                   # Datos de perfiles y planes
├── App.tsx                   # App principal
├── main.tsx                  # Entry point
└── index.css                 # Estilos globales
```

## 🎨 Diseño

La app cuenta con:
- Gradientes modernos en azul y primarios
- Animaciones de Framer Motion
- Interfaz oscura (dark mode ready)
- Cards con efectos hover
- Progress bar animado
- Transiciones suaves entre tabs

## 📝 Uso

1. **Selecciona Perfil**: Elige entre Vo o Va
2. **Elige Día**: Navega por los días de la semana
3. **Marca Comidas**: Selecciona las comidas que consumiste
4. **Monitorea Progreso**: Observa tu avance del día
5. **Consulta Equivalencias**: Aprende porciones y consejos nutricionales
6. **Lee Resumen**: Entiende los fundamentos de tu plan

## 🔧 Personalización y Datos Dinámicos

La plataforma permite personalización flexible sin requerir conocimientos de código y sin usar un servidor:

1. **Editar Archivos Directamente**: Edita `src/data/perfil-vo.ts` y `perfil-va.ts` para agregar dietas predeterminadas en el proyecto antes de compilar (Vercel).
2. **Subida Dinámica en Navegador (Client-Side)**: 
   - Gracias al Administrador de Datos en la página de inicio, los usuarios pueden descargar sus planes en `.ts`.
   - Si se requiere actualizar el plan pero la página ya se encuentra compilada y hosteada (p. ej. en Vercel), simplemente pueden subir el nuevo `.ts` o un archivo de texto con la misma estructura.
   - **Limitaciones de Vercel (Sitios Estáticos)**: Al carecer de back-end, la información subida se *evalúa dinámicamente* en el teléfono o PC de cada usuario y se **guarda en el LocalStorage**. Funciona perfectamente como una personalización individual que mantiene su rapidez. Si borran la caché de su navegador, volverán a la versión original.
   - Para que un cambio sea universal para todos sin tener que subir su `.ts` manualmente, la modificación debe hacerse mediante un commit al repositorio en Vercel.

## 💡 Notas de Desarrollo

- La app está configurada con TypeScript strict mode para máxima seguridad
- Todas las animaciones usan Framer Motion para rendimiento óptimo
- Responsive diseño usando Tailwind breakpoints
- Sin librerías de UI externas: puro estilos personalizados

## 📱 Navegadores Soportados

- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Mobile browsers

---

**Hecho con ❤️ - Nutrición Inteligente 2026**


## 🤖 Variables de entorno (Vercel)

Agrega estas variables en tu proyecto de Vercel:

- `GEMINI_API_KEY` (obligatoria)
- `GEMINI_MODEL` (opcional, por defecto `gemini-1.5-flash`)
