# Plan de Optimización: Reducir Tiempo de Respuesta de IA a <1 Minuto

## Diagnóstico Actual

### Tiempos Medidos
| Escenario | Modelo Usado | Duración |
|-----------|-------------|----------|
| Perfil "El" individual | gemini-3-flash-preview | **2 min 30s** |
| Perfil "Ambos" (conjunto) | gemini-3.1-pro-preview | **4 min 56s** |
| Target objetivo | gemini-3-flash-preview | **< 1 minuto** |

### Flujos que usan IA
1. **Cuestionario (Generación completa)** - `handleGenerateWithAi`
   - Genera: perfil completo + plan semanal + suplementos + equivalencias
   - Target: 'el', 'ella', o 'ambos'
   
2. **Ajuste de Plan (Delta)** - `handleRevisePlanWithAi` con `requestMode: 'adjust'`
   - Solo devuelve slots modificados (`planPatchSlots`)
   - Mantiene perfil, solo cambia comidas específicas
   - Payload más ligero: solo instrucción + plan actual + catálogo
   
3. **Recrear Plan (Regeneración)** - `handleRevisePlanWithAi` con `requestMode: 'regenerate'`
   - Similar a generación completa pero con contexto del plan actual
   - Puede usar instrucción o volver al cuestionario

### Modelos Disponibles (orden de velocidad)
1. **gemini-3-flash-preview** - Más rápido, ideal para tareas estructuradas
2. **gemini-2.5-flash** - Rápido, buen balance
3. **gemini-2.5-pro** - Lento pero preciso
4. **gemini-3.1-pro-preview** - Más lento, el que se usó en "ambos"

> El modelo por defecto actual es `gemini-3.1-pro-preview` (lento). Flash es ~2x más rápido.

### Causas Raíz del Lento Rendimiento

#### 1. Prompt Masivo (~15-20KB de tokens)
El prompt enviado a la IA incluye:
- **Catálogo completo de comidas**: 200+ platos con `id`, `nombre`, `tags[]`, `super[]`, `momentos[]` → **~8-10KB**
- **Catálogo de suplementos**: 10+ suplementos con `id`, `name`, `goalSupport`, etc. → **~2-3KB**
- **Instrucciones del sistema**: ~2KB de reglas estrictas
- **Schema JSON de respuesta**: Esquema anidado masivo → **~5-8KB**
- **Datos del cuestionario/contexto**: Edad, peso, altura, objetivos, preferencias, etc.

**Total estimado: 15,000-25,000 tokens de entrada**

#### 2. Respuesta Masiva (~8-15KB de tokens)
La IA debe generar:
- **Perfil completo**: 15+ campos con objetivos, distribución, momentos, resumen
- **Plan semanal**: 35 slots × 3 opciones = **105 objetos de comida**, cada uno con `idRef`, `porciones`, `detalle`, `caloriasKcal`, `proteinaG`, `grasasG`
- **Suplementos**: Lista de IDs
- **Validación interna**: El schema forza a la IA a "pensar" más

**Total estimado: 8,000-15,000 tokens de salida**

#### 3. Llamada Extra: Listado de Modelos
Antes de generar, el código hace una llamada a `https://generativelanguage.googleapis.com/v1beta/models` para listar modelos disponibles. Esto agrega **~500ms-2s** de latencia.

#### 4. Fallbacks en Cadena
Si un modelo falla, se intenta con otro. Cada intento puede tardar 30-60s antes de timeout.

#### 5. Validación Estricta Post-Respuesta
El servidor valida cada campo de la respuesta IA. Si falta algo, se considera error y se reintenta con otro modelo, reiniciando todo el proceso.

---

## Plan de Optimización Completo

### FASE 1: Quick Wins - Cambios de bajo riesgo, alto impacto inmediato

**Meta: De ~2.5-5 min a ~1-1.5 min**

#### 1.1 Cambiar modelo por defecto a Flash
- Cambiar `DEFAULT_GEMINI_MODEL` de `gemini-3.1-pro-preview` a `gemini-3-flash-preview`
- Impacto: ~40-50% de reducción de tiempo

#### 1.2 Reducir timeouts agresivamente
- Individual: 150s → 35s
- Ambos: 120s → 45s  
- Ajuste (adjust): 60s → 30s
- Regenerate: 120s → 45s
- Impacto: La IA no tiene tiempo de "pensar" en exceso

#### 1.3 Eliminar llamada a `listAvailableModels`
- Usar lista hardcodeada de modelos conocidos
- Impacto: -500ms a -2s por request

#### 1.4 Activar rotación de comidas (`USE_ROTATION = true`)
- `buildOptimizedMealsCatalog` ya tiene la lógica, solo hay que cambiar el default
- Seleccionar 35 comidas óptimas en lugar de 56
- Impacto: -20-30% de tokens de entrada

#### 1.5 Compactar catálogo enviado
- Quitar `super[]` del prompt (la IA no necesita ingredientes para seleccionar IDs, solo `id`, `nombre`, `tags`, `momentos`)
- Impacto: -30-40% de tokens del catálogo

---

### FASE 2: Pre-computar Perfil Localmente (Reduce tokens de salida en ~40%)

**Meta: De ~1-1.5 min a ~40-60s**

**Problema:** La IA gasta tokens y tiempo generando datos que pueden calcularse con matemáticas simples.

**Solución:** Calcular localmente antes de llamar a la IA:

| Campo | Cálculo Local | Ahorro |
|-------|--------------|--------|
| `perfil` (línea) | `peso + " kg | " + altura + " m | " + edad + " anos | IMC " + (peso/(altura²))` | ~50 tokens |
| `metaCaloricaKcalDia` | Fórmula Mifflin-St Jeor × factor actividad - déficit/sobrante según objetivo | ~30 tokens |
| `imc` y `detallesPerfil` | Cálculo directo + template de texto | ~200 tokens |
| `descripcion` | Template basado en objetivos + restricciones | ~150 tokens |
| `notaSalud` | Reglas basadas en diagnósticos | ~100 tokens |
| `momentos` | Generar desde hora despertar/hora dormir | ~100 tokens |
| `distribucionDiaria` | Fórmulas SMAE según calorías y objetivos | ~200 tokens |
| `objetivosPorMomento` | Distribuir `distribucionDiaria` entre 5 momentos según reglas nutricionales | ~300 tokens |
| `suplementos` | Reglas simples: si "masa muscular" → whey + creatina; si "bajar peso" → whey; etc. | ~50 tokens |

**Implementación:** Crear `src/utils/profileGenerator.ts` con funciones puras.

**Impacto:** La IA ya no genera `perfilEL`, `suplementosEL`, `distribucionDiaria`, `objetivosPorMomento`. Solo genera `planSemanalEL`.

**Para el flujo de ajuste (adjust):** Como ya no se genera perfil, el ajuste es aún más rápido. Solo se pide `planPatchSlots`.

---

### FASE 3: Simplificar Schema JSON de Respuesta + Paralelización

**Meta: De ~60s a <30s individual, <45s ambos**

#### 3.1 Simplificar schema JSON
- Eliminar `additionalProperties: false`, `propertyOrdering`, `maxLength`, `minItems`, `maxItems`
- Dejar solo tipos básicos: `type: 'string'`, `type: 'integer'`, `type: 'array'`
- Validación post-respuesta en el servidor cubre la calidad

#### 3.2 Paralelizar generación de "ambos"
- Pre-computar ambos perfiles localmente (Fase 2)
- Llamar a la IA 2 veces en paralelo:
  - Thread A: Generar `planSemanalEL`
  - Thread B: Generar `planSemanalELLA`
- Esperar ambas con `Promise.all()`
- Ventaja: Cada llamada es ~50% más ligera. En paralelo, el tiempo total es el del más lento.

#### 3.3 Cachear catálogo filtrado
- Cachear resultado de `buildOptimizedMealsCatalog` en memoria por 5 minutos
- Indexado por hash de restricciones del usuario

---

## Resumen de Impacto Esperado

| Optimización | Reducción de Tokens | Reducción de Tiempo |
|-------------|--------------------|--------------------|
| Fase 1: Modelo Flash + timeouts | N/A | -40-50% total |
| Fase 1: Compactar catálogo | -30-40% entrada | -15-20% total |
| Fase 2: Pre-computar perfil | -40% salida | -30-40% total |
| Fase 3: Schema simplificado | -30% overhead IA | -15-20% total |
| Fase 3: Paralelizar "ambos" | N/A | -50% total (ambos) |

### Proyección de Tiempos Finales

| Escenario | Tiempo Actual | Después Fase 1 | Después Fase 2 | Después Fase 3 |
|-----------|--------------|---------------|---------------|---------------|
| Individual (El/Ella) | 2m 30s | ~1m | ~40s | **<30s** |
| Ambos | 4m 56s | ~2m | ~1m 20s | **<45s** |
| Ajuste (delta) | ~1m | ~30s | ~20s | **<15s** |
| Regenerate | ~2-3m | ~1m | ~40s | **<30s** |

---

## Plan de Implementación Fase por Fase

### FASE 1: Quick Wins (NO avanzar a Fase 2 sin validar)
1. Cambiar `DEFAULT_GEMINI_MODEL` a `gemini-3-flash-preview`
2. Reducir timeouts: 35s individual / 45s ambos / 30s adjust / 45s regenerate
3. Eliminar llamada a `listAvailableModels`
4. Activar `USE_ROTATION = true`
5. Compactar catálogo: quitar `super[]` del prompt enviado a IA

**Validación:**
- [ ] Test generación individual "el" < 2 minutos
- [ ] Test generación individual "ella" < 2 minutos
- [ ] Test generación "ambos" < 3 minutos
- [ ] Test ajuste (adjust) < 1 minuto
- [ ] Test regeneración (regenerate) < 2 minutos
- [ ] Calidad del plan comparada con baseline (debe ser igual o mejor)

### FASE 2: Pre-computación Local (NO avanzar a Fase 3 sin validar)
6. Crear `src/utils/profileGenerator.ts` para calcular perfil, distribución, objetivos, suplementos
7. Modificar `api/generate-plan.js` para solo pedir `planSemanal` a la IA
8. Combinar perfil pre-computado + plan de IA en el servidor
9. Para ajuste (adjust): solo pedir `planPatchSlots`

**Validación:**
- [ ] Test generación individual < 1 minuto
- [ ] Test generación "ambos" < 1.5 minutos
- [ ] Test ajuste < 30 segundos
- [ ] Verificar calidad: IMC correcto, calorías realistas, distribución SMAE válida
- [ ] Verificar personalización: respeto de preferencias, alergias, estilos de cocina

### FASE 3: Paralelización y Schema Ligero
10. Simplificar schema JSON de respuesta
11. Paralelizar generación de "ambos" en 2 threads
12. Cachear catálogo filtrado en memoria

**Validación:**
- [ ] Test generación individual < 30 segundos
- [ ] Test generación "ambos" < 45 segundos
- [ ] Test ajuste < 15 segundos
- [ ] Calidad final validada con 5 perfiles diferentes

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Flash genera menos calidad que Pro | Validar con pruebas A/B. Si la calidad baja >10%, usar Flash solo para estructura y pedir a Pro que refine. |
| Pre-computación local da resultados imprecisos | Comparar con planes generados por Pro. Ajustar fórmulas. Mantener fallback a generación completa si el usuario lo solicita. |
| Catálogo reducido limita variedad | Probar con 35, 45, 60 comidas. Encontrar el sweet spot entre velocidad y variedad. |
| Schema simplificado = más errores de validación | Mover validación al servidor post-respuesta. Si la IA devuelve un campo mal, corregirlo en código. |
| Paralelización duplica costo de API | El costo es bajo ($0.15/millón de tokens para Flash). El tiempo ahorrado vale el costo extra. |
| Ajuste (adjust) con schema simplificado pierde precisión | El modo adjust ya es delta/patch, la IA solo devuelve slots cambiados. Con menos restricciones, responde más rápido y con igual calidad. |

---

## Confirmación del Modelo Pro

> **Sí, confirmado:** `gemini-3.1-pro-preview` (el modelo por defecto actual) es significativamente más lento que Flash. En nuestras pruebas:
> - Flash respondió en ~2m 30s
> - Pro respondió en ~4m 56s
>
> Flash es ~2x más rápido y debería ser el modelo principal para generación de planes estructurados. Pro debe ser fallback solo cuando Flash falla.
