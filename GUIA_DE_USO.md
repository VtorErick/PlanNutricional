# Guía de Uso

Esta guía describe el flujo real actual de la aplicación.

## 1. Entrar a la app

1. Abre la landing.
2. Elige una de estas rutas:
   `El`
   `Ella`
   `Ambos`
3. Si todavía no quieres entrar al plan, usa `Personalizar mi plan` para abrir el cuestionario IA.

Referencia:

![Landing móvil](docs/screenshots/mobile/landing-mobile.png)

## 2. Configurar la generación con IA

Desde `Ajustes avanzados` puedes:

- Usar la configuración recomendada de Gemini.
- Elegir el modelo disponible.
- Guardar una API key personalizada.
- Restaurar la configuración predeterminada.
- Exportar o restaurar planes desde JSON en la pestaña de respaldo.

Referencia:

![Ajustes avanzados en móvil](docs/screenshots/mobile/admin-settings-mobile.png)

## 3. Generar o actualizar un plan

1. En la landing, pulsa `Personalizar mi plan`.
2. Selecciona si el plan será para `El`, `Ella` o `Ambos`.
3. Completa medidas y objetivos.
4. Los pasos de salud, preferencias, horarios, porciones y cocina pueden afinar la generación.
5. En la pantalla final revisa el resumen y pulsa `Generar plan con IA`.

Referencia:

![Confirmación del cuestionario en móvil](docs/screenshots/mobile/questionnaire-confirm-mobile.png)

## 4. Trabajar con Mi Plan

En `Mi Plan` puedes:

- Elegir una comida por cada momento del día.
- Abrir el selector cuando un momento está vacío.
- Editar un platillo existente.
- Restaurar la versión original del platillo.
- Descargar PDF del día o del plan completo desde el encabezado.

Referencia:

![Vista de plan en móvil](docs/screenshots/mobile/plan-mobile.png)

## 5. Navegar las pestañas móviles

La barra inferior móvil permite cambiar entre estas vistas:

- `Plan`
- `Extras` para equivalencias
- `Sups` para suplementos
- `Kcal` para monitoreo de calorías
- `Compras`
- `Resumen`

## 6. Usar Equivalencias

Aquí ves sustituciones y referencias por grupo de alimentos. En modo `Ambos`, puedes alternar entre los dos perfiles.

Referencia:

![Equivalencias en móvil](docs/screenshots/mobile/equivalencias-mobile.png)

## 7. Revisar Suplementos

La vista de suplementos explica:

- Para qué podría servir cada opción.
- Cómo usarla.
- En qué momento tomarla.
- Notas y precauciones.

Referencia:

![Suplementos en móvil](docs/screenshots/mobile/supplements-mobile.png)

## 8. Monitorear calorías

La vista `Kcal` muestra:

- Tarjetas semanales por día.
- Meta diaria total.
- Desviación respecto a la meta.
- Proteína y grasas acumuladas con base en las comidas seleccionadas.

Referencia:

![Calorías en móvil](docs/screenshots/mobile/calories-mobile.png)

## 9. Preparar la lista de compras

La vista `Compras` se alimenta de las comidas seleccionadas. Puedes:

- Ver ingredientes agrupados.
- Expandir en qué recetas se usa cada ingrediente.
- Marcar lo ya comprado.

Referencia:

![Compras en móvil](docs/screenshots/mobile/shopping-mobile.png)

## 10. Leer el resumen del plan

`Resumen` concentra:

- Puntos clave del plan.
- Meta y perfil.
- Tabla de porciones/macros por momento.
- Alternancia por perfil cuando usas `Ambos`.

Referencia:

![Resumen en móvil](docs/screenshots/mobile/summary-mobile.png)

## 11. Persistencia y respaldo

- La app guarda el estado en `localStorage`.
- Si limpias almacenamiento local, perderás cambios no exportados.
- Usa la pestaña de respaldo para exportar JSON y restaurarlo después.

## 12. Validación visual

Las imágenes de esta guía fueron generadas automáticamente por la suite móvil de Playwright ubicada en `tests/e2e/`.
