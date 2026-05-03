import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync('scripts/results-deepseek-v4-flash/el-plan-parsed.json', 'utf-8'));
const slots = raw.planSemanalEL || [];
const miercoles = slots.find((s: any) => s.dia === 'Miércoles' && s.momento === 'desayuno');
console.log('Miercoles desayuno:', JSON.stringify(miercoles, null, 2));
