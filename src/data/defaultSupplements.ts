import type { SupplementRecommendation } from '../types';

export const defaultSupplements = {
  el: [
    {
      name: 'Creatina monohidratada',
      goalSupport: 'Apoya rendimiento y mantenimiento de masa muscular durante el déficit.',
      whyItMayHelp:
        'Puede ayudar a sostener fuerza y desempeño al entrenar mientras bajas grasa.',
      howToUse: '3 a 5 g al día, de forma constante.',
      timing: 'A cualquier hora; prioriza constancia.',
      notes: 'Es un extra opcional. No reemplaza comida ni define el resultado por sí sola.',
      caution: 'Evitar o revisar con profesional si existe enfermedad renal o restricción médica.',
    },
    {
      name: 'Omega 3 (EPA/DHA)',
      goalSupport: 'Complementa una estrategia antiinflamatoria y de salud cardiometabólica.',
      whyItMayHelp:
        'Puede ser útil cuando el consumo de pescados grasos es bajo o irregular.',
      howToUse: 'Seguir la dosis comercial del producto elegido.',
      timing: 'Con una comida principal para mejor tolerancia.',
      notes: 'Debe considerarse un apoyo opcional, no una base de la dieta.',
      caution: 'Revisar con profesional si usas anticoagulantes o tienes cirugía próxima.',
    },
    {
      name: 'Fibra soluble tipo psyllium',
      goalSupport: 'Puede mejorar saciedad y apoyo digestivo.',
      whyItMayHelp:
        'Sirve como complemento cuando la fibra diaria del plan no se alcanza con consistencia.',
      howToUse: 'Empezar con una porción pequeña y subir gradualmente.',
      timing: 'Separada de medicamentos y siempre con suficiente agua.',
      notes: 'No sustituye frutas, verduras ni leguminosas del plan.',
      caution: 'No usar sin suficiente hidratación y revisar si hay molestias digestivas relevantes.',
    },
    {
      name: 'Proteína en polvo sin lactosa o vegetal',
      goalSupport: 'Facilita cubrir proteína cuando el día se complica.',
      whyItMayHelp:
        'Puede ser práctica en días con poco tiempo o cuando no logras llegar a tu objetivo proteico.',
      howToUse: 'Usar solo cuando haga falta completar proteína del día.',
      timing: 'Después de entrenar o como apoyo ocasional entre comidas.',
      notes: 'Es opcional y no debe reemplazar de forma habitual a comidas completas.',
      caution: 'Elegir versiones sin lactosa o vegetales por tolerancia digestiva.',
    },
  ] satisfies SupplementRecommendation[],
  ella: [
    {
      name: 'Myo-inositol + D-chiro inositol',
      goalSupport: 'Puede apoyar el contexto de SOP y la estrategia metabólica del plan.',
      whyItMayHelp:
        'Algunas personas con SOP lo usan como complemento dentro de un abordaje integral.',
      howToUse: 'Seguir dosis y proporción del producto elegido.',
      timing: 'Dividido según indicación del fabricante.',
      notes: 'Es un apoyo opcional y no sustituye alimentación, sueño ni adherencia.',
      caution: 'Idealmente revisar con profesional, sobre todo si ya hay tratamiento médico.',
    },
    {
      name: 'Omega 3 (EPA/DHA)',
      goalSupport: 'Complementa una alimentación con enfoque antiinflamatorio.',
      whyItMayHelp:
        'Puede ser útil como apoyo general si el consumo de pescado azul es bajo.',
      howToUse: 'Seguir la dosis comercial del producto.',
      timing: 'Con comida para mejor tolerancia.',
      notes: 'Es adicional; no es necesario para que el plan funcione.',
      caution: 'Consultar si usas anticoagulantes o tienes una condición médica relevante.',
    },
    {
      name: 'Fibra soluble tipo psyllium',
      goalSupport: 'Puede apoyar tránsito intestinal y saciedad.',
      whyItMayHelp:
        'Puede ser una herramienta extra si hay estreñimiento o si cuesta sostener suficiente fibra diaria.',
      howToUse: 'Introducir poco a poco con agua suficiente.',
      timing: 'Lejos de medicamentos y con hidratación adecuada.',
      notes: 'No sustituye la fibra natural del plan de alimentación.',
      caution: 'Suspender y revisar si empeora la molestia digestiva.',
    },
    {
      name: 'Proteína en polvo sin lactosa o vegetal',
      goalSupport: 'Ayuda a completar proteína en días con poco tiempo o apetito.',
      whyItMayHelp:
        'Puede facilitar adherencia cuando las comidas del día quedan cortas en proteína.',
      howToUse: 'Usar como apoyo puntual, no como base.',
      timing: 'Después de entrenar o como recurso ocasional.',
      notes: 'Es extra y no debe contarse como obligatorio para cumplir el plan.',
      caution: 'Elegir opciones sin lactosa por tolerancia digestiva.',
    },
  ] satisfies SupplementRecommendation[],
} as const;
