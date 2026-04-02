# Plan de Comidas 2026 - App React Moderna

Una aplicación web moderna y responsiva para gestionar planes de nutrición personalizados. Diseñada con React 19, Vite, TypeScript y TailwindCSS.

## 🎯 Características

- **Dos Perfiles Personalizados**: Vo y Va con planes específicos
- **Plan Semanal Completo**: Lunes a Domingo con múltiples opciones por comida
- **Selector Interactivo**: Marca tus comidas durante el día
- **Seguimiento de Progreso**: Visualiza tu avance diario en tiempo real
- **Equivalencias Inteligentes**: Consulta porciones y equivalencias de alimentos
- **Interfaz Moderna**: Animaciones suaves, gradientes, y diseño 2026
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

## 🔧 Personalización

Edita `src/data.ts` para:
- Agregar nuevos perfiles
- Modificar planes de comidas
- Cambiar equivalencias
- Ajustar horarios

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
