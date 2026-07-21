const EMOJI_RULES: Array<{ regex: RegExp; emoji: string }> = [
  { regex: /(avena|oat)/, emoji: '🥣' },
  { regex: /(hot ?cake|pancake|wafle|waffle)/, emoji: '🥞' },
  { regex: /(omelet|huevo|egg|chilaquiles)/, emoji: '🍳' },
  { regex: /(yogur|yoghurt|kefir)/, emoji: '🥛' },
  { regex: /(licuado|smoothie|batido)/, emoji: '🥤' },
  { regex: /(taco|burrito|quesadilla|tostada de tinga|enchilada|tamales?)/, emoji: '🌮' },
  { regex: /(sandwich|torta|baguette|panini)/, emoji: '🥪' },
  { regex: /(wrap|fajita)/, emoji: '🌯' },
  { regex: /(ensalada|salad)/, emoji: '🥗' },
  { regex: /(sopa|soup|caldo|pozole|menudo)/, emoji: '🍲' },
  { regex: /(arroz|rice|risotto)/, emoji: '🍚' },
  { regex: /(pasta|espagueti|spaghetti|macarron|lasan|fideo)/, emoji: '🍝' },
  { regex: /(pizza)/, emoji: '🍕' },
  { regex: /(hamburguesa|burger)/, emoji: '🍔' },
  { regex: /(atun|salmon|pescado|tilapia|camaron|ceviche|sardina)/, emoji: '🐟' },
  { regex: /(pollo|chicken|tinga)/, emoji: '🍗' },
  { regex: /(carne|res|bistec|steak|arrachera|molida|barbacoa|machaca)/, emoji: '🥩' },
  { regex: /(cerdo|puerco|jamon|tocino)/, emoji: '🥓' },
  { regex: /(fruta|manzana|pera|platano|banana|fresa|berries|frutos rojos|papaya|mango|melon|sandia|uva|naranja|mandarina|kiwi|durazno)/, emoji: '🍎' },
  { regex: /(nuez|almendra|nueces|semilla|chia|linaza|granola|trail)/, emoji: '🥜' },
  { regex: /(aguacate|guacamole)/, emoji: '🥑' },
  { regex: /(verdura|vegetal|brocoli|espinaca|lechuga|pepino|zanahoria|calabaza|elote)/, emoji: '🥦' },
  { regex: /(pan|toast|tostada)/, emoji: '🍞' },
  { regex: /(queso|cheese)/, emoji: '🧀' },
  { regex: /(cereal)/, emoji: '🥣' },
  { regex: /(gelatina|postre|brownie|galleta|flan|pastel)/, emoji: '🍮' },
  { regex: /(cafe)/, emoji: '☕' },
  { regex: /(te |te,|infusion)/, emoji: '🍵' },
];

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getMealEmoji(nombre: string): string {
  const normalized = normalizeText(nombre);
  for (const rule of EMOJI_RULES) {
    if (rule.regex.test(normalized)) {
      return rule.emoji;
    }
  }
  return '🍽️';
}
