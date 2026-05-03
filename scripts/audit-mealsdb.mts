import { mealsDatabase } from '../src/data/mealsDB.ts';

const total = mealsDatabase.length;
const withMacro = mealsDatabase.filter((m: any) => m.macroEstimate).length;
const withSMAE = mealsDatabase.filter((m: any) => (m as any).smaeEstimate).length;

console.log('Total comidas:', total);
console.log('Con macroEstimate:', withMacro);
console.log('Con smaeEstimate:', withSMAE);
console.log('Sin macroEstimate:', total - withMacro);

// Show sample with and without
console.log('\n--- Con macroEstimate (primeras 3) ---');
mealsDatabase.filter((m: any) => m.macroEstimate).slice(0, 3).forEach((m: any) => {
  console.log(m.id, m.nombre, JSON.stringify(m.macroEstimate));
});

console.log('\n--- Sin macroEstimate (primeras 3) ---');
mealsDatabase.filter((m: any) => !m.macroEstimate).slice(0, 3).forEach((m: any) => {
  console.log(m.id, m.nombre, 'sin macros');
});

// Show moment coverage
const momentCounts: Record<string, number> = {};
mealsDatabase.forEach((m: any) => {
  m.momentos.forEach((mom: string) => {
    momentCounts[mom] = (momentCounts[mom] || 0) + 1;
  });
});
console.log('\n--- Comidas por momento ---');
Object.entries(momentCounts).forEach(([k, v]) => console.log(k, v));
