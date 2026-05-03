import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync('scripts/results-deepseek-v4-flash/el-plan-parsed.json', 'utf-8'));
const slots = raw.planSemanalEL || [];
const days = new Set(slots.map((s: any) => s.dia));
console.log('Dias presentes:', Array.from(days));
console.log('Total slots:', slots.length);
