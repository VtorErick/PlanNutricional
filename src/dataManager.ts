import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Profile, Equivalencia, MealItem } from './data';

/**
 * Parsea un JSON limpio y valida su estructura básica
 * Ahora es más permisivo para aceptar estructuras generadas por IA
 */
export function parseObjectToData(parsed: any, expectedPrefix: 'VO' | 'VA'): any {
  const perfilKey = `perfil${expectedPrefix}`;
  const equivKey = `equivalencias${expectedPrefix}`;
  const planKey = `plan${expectedPrefix}`;

  // Verificar que tenga las raíces esperadas
  if (!parsed[perfilKey] || !parsed[equivKey] || !parsed[planKey]) {
    const wrongPrefix = expectedPrefix === 'VO' ? 'VA' : 'VO';
    if (parsed[`perfil${wrongPrefix}`]) {
      throw new Error(`Intentaste subir un archivo de V(${wrongPrefix.toLowerCase()}) en la sección de V(${expectedPrefix.toLowerCase()}). Sube el archivo correcto.`);
    }
    throw new Error(`El archivo JSON no contiene las estructuras requeridas (${perfilKey}, ${equivKey}, ${planKey}).`);
  }

  const perfil = parsed[perfilKey];
  // Validación permisiva: solo verificar que tenga nombre y momentos (array)
  if (!perfil.nombre || !Array.isArray(perfil.momentos)) {
    throw new Error('La estructura del perfil no coincide con el formato esperado. Faltan: nombre o momentos.');
  }

  const equivalencias = parsed[equivKey];
  if (!Array.isArray(equivalencias) || equivalencias.length === 0) {
    throw new Error('Las equivalencias deben ser un arreglo no vacío.');
  }

  const plan = parsed[planKey];
  if (typeof plan !== 'object' || plan === null) {
    throw new Error('El plan de comidas no tiene un formato válido.');
  }

  // Validar que el plan tenga al menos un día con momentos
  const dias = Object.keys(plan);
  if (dias.length === 0) {
    throw new Error('El plan no contiene días.');
  }

  // Validar que cada día tenga los momentos esperados
  const momentosKeys = perfil.momentos.map((m: any) => m.key);
  for (const dia of dias) {
    const diaPlan = plan[dia];
    if (typeof diaPlan !== 'object' || diaPlan === null) {
      throw new Error(`El día ${dia} no tiene formato válido.`);
    }
    // Verificar que existan los momentos (pueden estar vacíos)
    for (const momento of momentosKeys) {
      if (!Array.isArray(diaPlan[momento])) {
        // Si no existe, inicializar como array vacío
        diaPlan[momento] = [];
      }
    }
  }

  return parsed;
}

export function parseJsonToData(jsonString: string, expectedPrefix: 'VO' | 'VA'): any {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('El archivo no tiene un formato JSON válido.');
  }

  return parseObjectToData(parsed, expectedPrefix);
}

/**
 * Descarga el contenido como texto con extension .json
 */
export function downloadJsonFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Genera y descarga un PDF formateado basándose en los datos provistos.
 */
export function downloadDietPdf(perfilData: any, planObj: Record<string, Record<string, MealItem[]>>, isVA: boolean) {
  const doc = new jsPDF() as any;
  const color: [number, number, number] = isVA ? [225, 29, 72] : [37, 99, 235];

  const drawHeader = (doc: any, title: string, subtitle: string, meta: string) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(0, 0, 210, 36, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(240, 240, 240);
    doc.text(subtitle, 14, 28);
    
    if (meta) {
      doc.setFontSize(10);
      doc.text(`Meta: ${meta}`, 14, 33);
    }
  };

  const dias = Object.keys(planObj);

  dias.forEach((dia, dIdx) => {
    if (dIdx > 0) doc.addPage();
    drawHeader(doc, `Plan Nutricional: ${perfilData.nombre}`, perfilData.perfil, perfilData.meta);
    
    let startY = 46;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(`Menú para el día: ${dia}`, 14, startY);
    startY += 8;

    const momentosKeys = perfilData.momentos.map((m: any) => m.key);
    
    momentosKeys.forEach((momentoKey: string) => {
      const momentoLabel = perfilData.momentos.find((m: any) => m.key === momentoKey)?.label || momentoKey;
      const comidas = planObj[dia][momentoKey] || [];
      if (comidas.length === 0) return;

      const pageHeight = doc.internal.pageSize.getHeight();
      if (startY > pageHeight - 75) {
        doc.addPage();
        startY = 20;
      }

      const bodyData = comidas.map((c: any) => [
        c.nombre,
        c.porciones,
        c.super && c.super.length > 0 ? `${c.detalle}\n+ Extras: ${c.super.join(', ')}` : c.detalle
      ]);

      autoTable(doc, {
        startY: startY,
        head: [[momentoLabel.toUpperCase(), 'Porciones', 'Detalle']],
        body: bodyData,
        theme: 'plain',
        headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 10, cellPadding: 5 },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [70, 70, 70], lineColor: [235, 235, 235], lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [250, 251, 252] },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold', textColor: color },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });
  });

  doc.save(`Plan_Nutricional_${perfilData.nombre}.pdf`);
}

/**
 * Genera y descarga un PDF resumido con ÚNICAMENTE las comidas seleccionadas del día activo.
 */
export function downloadDaySelectionPdf(
  diaActivo: string,
  seleccionesInfo: { perfilData: any; color: [number, number, number]; planObj: Record<string, Record<string, MealItem[]>>; perfilId: string }[],
  selecciones: Record<string, boolean>
) {
  const doc = new jsPDF() as any;

  seleccionesInfo.forEach((info, index) => {
    if (index > 0) doc.addPage();
    const { perfilData, color, planObj, perfilId } = info;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`Registro Diario: ${diaActivo}`, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(240, 240, 240);
    doc.text(`Perfil: ${perfilData.nombre} | ${perfilData.meta}`, 14, 28);

    let startY = 46;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text("Comidas seleccionadas y completadas", 14, startY);
    startY += 8;

    const momentosKeys = perfilData.momentos.map((m: any) => m.key);
    let itemsFound = 0;
    
    momentosKeys.forEach((momentoKey: string) => {
      const momentoLabel = perfilData.momentos.find((m: any) => m.key === momentoKey)?.label || momentoKey;
      const comidas = planObj[diaActivo]?.[momentoKey] || [];
      const comidasSeleccionadas = comidas.filter((c: any) => selecciones[`${perfilId}-${diaActivo}-${momentoKey}-${c.nombre}`]);
      
      if (comidasSeleccionadas.length === 0) return;
      itemsFound++;

      const pageHeight = doc.internal.pageSize.getHeight();
      if (startY > pageHeight - 75) {
        doc.addPage();
        startY = 20;
      }

      const bodyData = comidasSeleccionadas.map((c: any) => [
        c.nombre,
        c.porciones,
        c.super && c.super.length > 0 ? `${c.detalle}\n+ Extras: ${c.super.join(', ')}` : c.detalle
      ]);

      autoTable(doc, {
        startY: startY,
        head: [[momentoLabel.toUpperCase(), 'Porciones', 'Detalle']],
        body: bodyData,
        theme: 'plain',
        headStyles: { fillColor: color, textColor: 255, fontStyle: 'bold', fontSize: 10, cellPadding: 5, halign: 'left' },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [70, 70, 70], lineColor: [235, 235, 235], lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold', textColor: color },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    if (itemsFound === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text("No completaste comidas registradas bajo este perfil para hoy.", 14, startY + 5);
    }
  });

  const sufix = seleccionesInfo.length > 1 ? 'Ambos' : seleccionesInfo[0].perfilData.nombre;
  doc.save(`Menu_Seleccionado_${diaActivo}_${sufix}.pdf`);
}
