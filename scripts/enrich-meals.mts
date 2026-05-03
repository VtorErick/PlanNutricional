import { mealsDatabase } from '../src/data/mealsDB.ts';
import * as fs from 'node:fs';

const SMAE_FACTORS: Record<string, { kcal: number; protein: number; carbs: number; fat: number }> = {
  frutas: { kcal: 60, protein: 0, carbs: 15, fat: 0 },
  verduras: { kcal: 25, protein: 1, carbs: 5, fat: 0 },
  cereales: { kcal: 70, protein: 2, carbs: 15, fat: 0 },
  leguminosas: { kcal: 120, protein: 8, carbs: 20, fat: 1 },
  lacteos: { kcal: 100, protein: 8, carbs: 12, fat: 2 },
  proteina: { kcal: 100, protein: 15, carbs: 0, fat: 4 },
  grasas: { kcal: 45, protein: 0, carbs: 0, fat: 5 },
};

// Expanded keyword map for Mexican/international ingredients
const INGREDIENT_MAP: Record<string, string[]> = {
  frutas: ['manzana','platano','banana','fresa','mora','arandano','naranja','pomelo','lima','limon','piña','mango','papaya','uva','pera','sandia','kiwi','melon','durazno','ciruela','guayaba','tuna','chicozapote','mamey','platano macho','coco','datil','higo','chabacano','tejocote','mandarina','toronja','maracuya','granada','lichi','frambuesa','zarzamora'],
  verduras: ['jitomate','tomate','tomate cherry','cebolla','cebolla morada','chile','chile serrano','chile guajillo','chile ancho','chile pasilla','chile habanero','chile de arbol','chile poblano','nopal','nopales','espinaca','lechuga','romana','mix de lechugas','calabaza','calabacita','calabacin','zanahoria','betabel','remolacha','champinon','hongo','hongos','portobello','apio','pepino','brocoli','coliflor','ejote','ejotes','pimiento','pimiento morron','poblano','rajas','pico de gallo','salsa verde','salsa roja','salsa','guacamole','palta','alcachofa','esparrago','berenjena','col','repollo','lechuga orejona','jicama','rabano','nabo','acelga','berros','apio','pepino','tomatillo','miltomate'],
  cereales: ['tortilla','tortillas','pan','pan tostado','pan integral','baguette','ciabatta','tostada','tostadas','arroz','arroz integral','pasta','spaghetti','fettuccine','avena','harina de avena','papa','patata','elote','maiz','masa','masa de maiz','galleta','galletas','cereal','granola','muesli','amaranto','quinua','quinoa','bulgur','couscous','cebada','trigo','sorgo','elote desgranado','tamal','tamalito','tlacoyo','tlacoyos','sope','sopes','memelita','memelitas','enchilada','enchiladas','mollete','molletes','gordita','gorditas','pambazo','torta','tortas','burrito','taco','flauta','quesadilla','empanada','croissant','panecillo','roll','donut','muffin','bagel','pita','naan','focaccia','pan pita','arroz salvaje','fideo','fideos','sopa de pasta','risotto','polenta','harina','fécula','maicena','pan molido','panko'],
  leguminosas: ['frijol','frijoles','frijol negro','frijol bayo','frijol pinto','lenteja','lentejas','garbanzo','garbanzos','haba','habas','soya','edamame','alubia','alubias','chicharos','chicharito','guisante','arveja','frijol refrito','frijoles charros'],
  lacteos: ['leche','leche descremada','leche entera','leche light','yogurt','yoghurt','yogur','yogurt griego','queso','queso manchego','queso cheddar','queso mozzarella','queso parmesano','queso oaxaca','queso asadero','panela','queso panela','cottage','queso cottage','crema','crema ligera','crema light','crema para batir','requeson','jocoque','leche evaporada','leche condensada','leche de almendra','leche de soya','leche de coco','leche de avena','bebida vegetal','kefir','cuajada','natillas','flan','custard','batido de leche','smoothie de yogurt','malteada','queso crema','philadelphia','mascarpone','ricotta','burrata','feta','pecorino','gruyere','emmental','gouda','brie','camembert','provolone'],
  proteina: ['huevo','huevos','huevo cocido','huevo frito','huevo revuelto','huevo estrellado','huevo pochado','claras','clara','jamon','jamon pavo','jamon de pavo','jamon serrano','jamon iberico','pechuga','pechuga de pavo','pechuga de pollo','pollo','pollo deshebrado','pollo a la plancha','pollo empanizado','pollo al horno','pavo','pavo molido','pavo deshebrado','res','carne de res','carne molida','bistec','filete','filete de res','arrachera','corte de res','suadero','longaniza','chorizo','chorizo argentino','chorizo espanol','morcilla','moronga','tripa','tripitas','sesos','pancita','carnitas','cochinita','cochinita pibil','barbacoa','birria','mixiote','cecina','tasajo','machaca','cecina enchilada','pescado','filete de pescado','pescado empapelado','pescado frito','salmon','salmon ahumado','salmon a la plancha','atun','atun enlatado','atun fresco','sardina','sardinas','mojarra','huachinango','sierra','trucha','bacalao','merluza','lenguado','robalo','cazon','marlin','pez espada','calamar','pulpo','camaron','camarones','langosta','langostino','ostion','ostiones','almeja','almejas','mejillon','caracol','surimi','cangrejo','jaiba','jaibas','pepino de mar','callo','callo de hacha','jibia','carne','carne asada','milanesa','milanesa de pollo','milanesa de res','milanesa de cerdo','costilla','costilla de res','costilla de cerdo','chuleta','chuleta de cerdo','chuleta de res','espinazo','tocino','panceta','jamonada','salchicha','salchicha frankfurt','salchicha vienna','hot dog','salami','pepperoni','pastrami','corned beef','roast beef','pastor','al pastor','adobada','suadero','tripa','buche','lengua','cachete','labio','higado','rinon','corazon','molleja','pollo en escabeche','pollo al pastor','pollo rostizado','pollo frito','alas de pollo','muslo','muslo de pollo','pierna','pierna de pollo','cuadrito','pechuga empanizada','nugget','nuggets','hamburguesa','hamburguesa de res','hamburguesa de pollo','patty','filete de pescado','empanizado','cordon bleu','kiev','milanesa napolitana','albóndiga','albóndigas','bistec encebollado','bistec a la mexicana','bistec ranchero','fajitas','fajita','arrachera','rib eye','new york','t-bone','tomahawk','picanha','churrasco','entraña','vacío','matambre','asado','parrillada','corte','carnes frias','charcuteria','soya texturizada','gluten','seitan','tempeh','tofu','tofu firme','tofu silken','proteina vegetal','mock meat','beyond meat','impossible'],
  grasas: ['aguacate','avocado','palta','aceite','aceite de oliva','aceite de coco','aceite de aguacate','aceituna','aceitunas','oliva','olivas','nuez','nueces','nuez de macadamia','nuez pecana','almendra','almendras','cacahuate','mani','maní','semilla','semillas','semilla de calabaza','semilla de girasol','semilla de chía','semilla de lino','linaza','chia','ajonjoli','sesamo','crema de cacahuate','mantequilla de mani','mantequilla de almendra','mantequilla de cacahuate','mantequilla','mantequilla clarificada','ghee','mayonesa','mayonesa light','aderezo','aderezo ranch','aderezo cesar','aderezo italiano','guacamole','tahini','pesto','pesto de albahaca','mantequilla de semillas','aceite de sésamo','aceite de ajonjoli','manteca','manteca de cerdo','tocino','grasa','grasa animal','pepita','pipas','pistache','pistachos','anacardo','nuez de la india','cashew','maranon','piñon','nuez de brasil','avellana','avellanas','hazelnut','coco','aceite de palma','margarina','manteca vegetal','shortening'],
};

function normalizeToken(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function inferSMAE(meal: any) {
  const smae: Record<string, number> = {};
  const tokens = [
    normalizeToken(meal.nombre || ''),
    ...(meal.super || []).map(normalizeToken),
    ...(meal.tags || []).map(normalizeToken),
  ];
  const text = tokens.join(' ');

  Object.entries(INGREDIENT_MAP).forEach(([group, keywords]) => {
    let count = 0;
    keywords.forEach((kw) => {
      const re = new RegExp('\\b' + normalizeToken(kw) + '\\b', 'g');
      const matches = text.match(re);
      if (matches) count += matches.length;
    });
    if (count > 0) {
      smae[group] = Math.min(count, 4);
    }
  });

  // Moment-based minimums
  const moment = (meal.momentos || [])[0];
  if (Object.keys(smae).length === 0) {
    if (moment === 'desayuno') { smae.cereales = 1; smae.proteina = 1; }
    if (moment === 'colacion_am') { smae.frutas = 1; smae.cereales = 1; }
    if (moment === 'comida') { smae.proteina = 1; smae.cereales = 1; smae.verduras = 1; smae.leguminosas = 1; }
    if (moment === 'colacion_pm') { smae.frutas = 1; smae.lacteos = 1; }
    if (moment === 'cena') { smae.proteina = 1; smae.verduras = 1; }
  }

  // Fine-tune for common combos
  const txt = text;
  if (txt.includes('omelette') || txt.includes('huevos') || txt.includes('huevo')) {
    if (!smae.proteina) smae.proteina = 1;
    if (!smae.grasas && (txt.includes('aguacate') || txt.includes('aceite'))) smae.grasas = 1;
  }
  if (txt.includes('chilaquiles') || txt.includes('enchiladas')) {
    if (!smae.cereales) smae.cereales = 2;
    if (!smae.proteina && txt.includes('pollo')) smae.proteina = 1;
    if (!smae.verduras) smae.verduras = 1;
  }
  if (txt.includes('tlacoyo') || txt.includes('sope') || txt.includes('gordita') || txt.includes('memelita') || txt.includes('pambazo')) {
    if (!smae.cereales) smae.cereales = 2;
  }
  if (txt.includes('avena') || txt.includes('hotcakes') || txt.includes('panque') || txt.includes('waffle')) {
    if (!smae.cereales) smae.cereales = 2;
    if (txt.includes('hotcakes') || txt.includes('panque')) smae.cereales = 2;
  }
  if (txt.includes('yogurt') || txt.includes('yoghurt')) {
    if (!smae.lacteos) smae.lacteos = 1;
  }
  if (txt.includes('atun') || txt.includes('sardina') || txt.includes('mojarra') || txt.includes('huachinango') || txt.includes('salmon')) {
    if (!smae.proteina) smae.proteina = 2;
    if (txt.includes('atun') && moment === 'cena') smae.proteina = Math.min((smae.proteina || 0) + 1, 4);
  }
  if (txt.includes('pollo') || txt.includes('res') || txt.includes('cerdo') || txt.includes('pavo')) {
    if (!smae.proteina) smae.proteina = 2;
  }
  if (txt.includes('caldo') || txt.includes('sopa') || txt.includes('consome') || txt.includes('crema')) {
    if (!smae.verduras) smae.verduras = 1;
    if (!smae.proteina && (txt.includes('pollo') || txt.includes('res'))) smae.proteina = 1;
  }
  if (txt.includes('tacos') || txt.includes('taco') || txt.includes('flauta') || txt.includes('quesadilla') || txt.includes('burrito')) {
    if (!smae.cereales) smae.cereales = 2;
    if (!smae.proteina) smae.proteina = 1;
    if (!smae.verduras) smae.verduras = 1;
  }
  if (txt.includes('frijol') || txt.includes('lenteja') || txt.includes('garbanzo')) {
    if (!smae.leguminosas) smae.leguminosas = 1;
    if (!smae.cereales && (txt.includes('tortilla') || txt.includes('pan'))) smae.cereales = 1;
  }
  if (txt.includes('ensalada')) {
    if (!smae.verduras) smae.verduras = 2;
  }
  if (txt.includes('empanizado') || txt.includes('capeado') || txt.includes('empanizado') || txt.includes('frito') || txt.includes('fritos')) {
    if (!smae.grasas) smae.grasas = 1;
  }
  if (txt.includes('guacamole') || txt.includes('aguacate')) {
    if (!smae.grasas) smae.grasas = 1;
  }
  if (txt.includes('smoothie') || txt.includes('licuado') || txt.includes('batido')) {
    if (!smae.frutas) smae.frutas = 1;
    if (!smae.lacteos) smae.lacteos = 1;
  }
  if (txt.includes('wrap') || txt.includes('roll') || txt.includes('sushi') || txt.includes('maki')) {
    if (!smae.cereales) smae.cereales = 1;
    if (!smae.proteina && (txt.includes('pollo') || txt.includes('atun') || txt.includes('salmon'))) smae.proteina = 1;
  }
  if (txt.includes('pizza')) {
    if (!smae.cereales) smae.cereales = 2;
    if (!smae.proteina && txt.includes('pepperoni')) smae.proteina = 1;
  }

  return smae;
}

function calculateMacroEstimate(smae: Record<string, number>) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  Object.entries(smae).forEach(([group, qty]) => {
    const f = SMAE_FACTORS[group];
    if (f && qty > 0) {
      kcal += f.kcal * qty;
      protein += f.protein * qty;
      carbs += f.carbs * qty;
      fat += f.fat * qty;
    }
  });
  return { calories: Math.round(kcal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
}

const enriched = mealsDatabase.map((meal: any) => {
  const m = { ...meal };
  if (!m.macroEstimate) {
    const smae = inferSMAE(m);
    m.macroEstimate = calculateMacroEstimate(smae);
  }
  return m;
});

console.log('Enriched', enriched.filter((m: any) => !mealsDatabase.find((o: any) => o.id === m.id)?.macroEstimate).length, 'meals');

// Verify: show some desayunos
enriched.filter((m: any) => m.momentos.includes('desayuno')).slice(0, 8).forEach((m: any) => {
  console.log(m.id, m.nombre, '→', JSON.stringify(m.macroEstimate));
});

console.log('\n--- Verificacion de coherencia con ejemplos de usuario ---');
// Buscar cenas
enriched.filter((m: any) => m.momentos.includes('cena')).forEach((m: any) => {
  if (m.macroEstimate && m.macroEstimate.protein < 5) {
    console.log('Cena baja en proteina:', m.id, m.nombre, m.macroEstimate);
  }
});

// Buscar platillos sin verduras que deberian tenerlas
enriched.filter((m: any) => m.momentos.includes('comida')).forEach((m: any) => {
  const smae = inferSMAE(m);
  if (smae.verduras === undefined || smae.verduras === 0) {
    console.log('Comida sin verduras:', m.id, m.nombre, JSON.stringify(smae));
  }
});
