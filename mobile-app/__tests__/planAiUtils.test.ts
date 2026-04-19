import {
  applyPlanRevisionPatchToBucket,
  buildRawBucketFromSnapshot,
  buildSerializableProfileSnapshot,
  getAffectedPlanSlotsFromPatch,
  getPatchSummaryLines,
  hasPlanRevisionPatchChanges,
} from '../src/utils/planAiUtils';
import { perfilesData, equivalenciasData, supplementsData } from '../src/data';

describe('planAiUtils', () => {
  it('normaliza summary y detecta cambios del patch', () => {
    const patch = {
      summary: ['  Ajuste de desayuno  ', '', 'Reducir lacteos'],
      planPatchSlots: [
        {
          dia: 'Lunes',
          momento: 'desayuno',
          opciones: [],
        },
      ],
    };

    expect(getPatchSummaryLines(patch as any)).toEqual(['Ajuste de desayuno', 'Reducir lacteos']);
    expect(hasPlanRevisionPatchChanges(patch as any)).toBe(true);
    expect(getAffectedPlanSlotsFromPatch(patch as any)).toEqual([
      { dia: 'Lunes', momento: 'desayuno' },
    ]);
  });

  it('aplica patch sobre bucket serializado sin perder identidad del perfil', () => {
    const snapshot = buildSerializableProfileSnapshot(
      perfilesData.el,
      equivalenciasData.el,
      supplementsData.el
    );
    const bucket = buildRawBucketFromSnapshot('el', snapshot) as any;
    const originalName = bucket.perfilEL.nombre;

    const parsedBucket = applyPlanRevisionPatchToBucket('el', bucket, {
      summary: ['Actualizar desayuno'],
      profilePatch: {
        nombre: 'No debe cambiar',
        meta: 'Deficit ligero',
      },
      planPatchSlots: [
        {
          dia: 'Lunes',
          momento: 'desayuno',
          opciones: [
            {
              nombre: 'Hot cakes de avena',
              porciones: '2 piezas + 1 taza de fruta',
              detalle: 'Avena, huevo, platano y canela',
              tags: ['rapido'],
              super: ['avena', 'huevo', 'platano'],
              caloriasKcal: 420,
              proteinaG: 24,
              grasasG: 11,
            },
            {
              nombre: 'Yogurt con fruta',
              porciones: '1 bowl',
              detalle: 'Yogurt, frutos rojos y nuez',
              tags: ['fresco'],
              super: ['yogurt', 'frutos rojos', 'nuez'],
              caloriasKcal: 360,
              proteinaG: 18,
              grasasG: 12,
            },
            {
              nombre: 'Huevos con tortilla',
              porciones: '2 huevos + 2 tortillas',
              detalle: 'Huevo, tortilla y aguacate',
              tags: ['clasico'],
              super: ['huevo', 'tortilla', 'aguacate'],
              caloriasKcal: 390,
              proteinaG: 22,
              grasasG: 16,
            },
          ],
        },
      ],
    } as any);

    expect(parsedBucket.perfilEL.nombre).toBe(originalName);
    expect(parsedBucket.perfilEL.meta).toBe('Deficit ligero');
    expect(parsedBucket.planEL.Lunes.desayuno[0].nombre).toBe('Hot cakes de avena');
  });
});
