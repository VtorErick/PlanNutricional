import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MealItem } from '../types';

type DietPdfEntry = {
  perfilData: any;
  planObj: Record<string, Record<string, MealItem[]>>;
  isVA: boolean;
};

function appendDietPlan(
  doc: any,
  perfilData: any,
  planObj: Record<string, Record<string, MealItem[]>>,
  isVA: boolean,
  startOnNewPage = false
) {
  const color: [number, number, number] = isVA ? [225, 29, 72] : [37, 99, 235];

  const drawHeader = (pdfDoc: any, title: string, subtitle: string, meta: string) => {
    pdfDoc.setFillColor(color[0], color[1], color[2]);
    pdfDoc.rect(0, 0, 210, 36, 'F');

    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(22);
    pdfDoc.setTextColor(255, 255, 255);
    pdfDoc.text(title, 14, 20);

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(11);
    pdfDoc.setTextColor(240, 240, 240);
    pdfDoc.text(subtitle, 14, 28);

    if (meta) {
      pdfDoc.setFontSize(10);
      pdfDoc.text(`Meta: ${meta}`, 14, 33);
    }
  };

  const dias = Object.keys(planObj);

  dias.forEach((dia, dayIndex) => {
    if (startOnNewPage || dayIndex > 0) {
      doc.addPage();
      startOnNewPage = false;
    }

    drawHeader(doc, `Plan Nutricional: ${perfilData.nombre}`, perfilData.perfil, perfilData.meta);

    let startY = 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(`Menú para el día: ${dia}`, 14, startY);
    startY += 8;

    const momentosKeys = perfilData.momentos.map((momento: any) => momento.key);

    momentosKeys.forEach((momentoKey: string) => {
      const momentoLabel =
        perfilData.momentos.find((momento: any) => momento.key === momentoKey)?.label ||
        momentoKey;
      const comidas = planObj[dia][momentoKey] || [];
      if (comidas.length === 0) return;

      const pageHeight = doc.internal.pageSize.getHeight();
      if (startY > pageHeight - 75) {
        doc.addPage();
        startY = 20;
      }

      const bodyData = comidas.map((comida: any) => [
        comida.nombre,
        comida.porciones,
        comida.super && comida.super.length > 0
          ? `${comida.detalle}\n+ Extras: ${comida.super.join(', ')}`
          : comida.detalle,
      ]);

      autoTable(doc, {
        startY,
        head: [[momentoLabel.toUpperCase(), 'Porciones', 'Detalle']],
        body: bodyData,
        theme: 'plain',
        headStyles: {
          fillColor: color,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 5,
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [70, 70, 70],
          lineColor: [235, 235, 235],
          lineWidth: 0.1,
        },
        alternateRowStyles: { fillColor: [250, 251, 252] },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold', textColor: color },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });
  });
}

/**
 * Generates and downloads a formatted PDF from the provided plan data.
 */
export function downloadDietPdf(
  perfilData: any,
  planObj: Record<string, Record<string, MealItem[]>>,
  isVA: boolean
) {
  const doc = new jsPDF() as any;
  appendDietPlan(doc, perfilData, planObj, isVA);

  doc.save(`Plan_Nutricional_${perfilData.nombre}.pdf`);
}

export function downloadCombinedDietPdf(entries: DietPdfEntry[]) {
  if (entries.length === 0) {
    throw new Error('No hay perfiles disponibles para exportar.');
  }

  const doc = new jsPDF() as any;

  entries.forEach((entry, index) => {
    appendDietPlan(doc, entry.perfilData, entry.planObj, entry.isVA, index > 0);
  });

  doc.save('Plan_Nutricional_Ambos.pdf');
}

/**
 * Generates and downloads a summary PDF with only the selected meals for the active day.
 */
export function downloadDaySelectionPdf(
  diaActivo: string,
  seleccionesInfo: {
    perfilData: any;
    color: [number, number, number];
    planObj: Record<string, Record<string, MealItem[]>>;
    perfilId: string;
  }[],
  selecciones: Record<string, boolean>
) {
  const doc = new jsPDF() as any;

  seleccionesInfo.forEach((info, index) => {
    if (index > 0) doc.addPage();
    const { perfilData, color, planObj, perfilId } = info;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`Registro Diario: ${diaActivo}`, 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(240, 240, 240);
    doc.text(`Perfil: ${perfilData.nombre} | ${perfilData.meta}`, 14, 28);

    let startY = 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('Comidas seleccionadas y completadas', 14, startY);
    startY += 8;

    const momentosKeys = perfilData.momentos.map((momento: any) => momento.key);
    let itemsFound = 0;

    momentosKeys.forEach((momentoKey: string) => {
      const momentoLabel =
        perfilData.momentos.find((momento: any) => momento.key === momentoKey)?.label ||
        momentoKey;
      const comidas = planObj[diaActivo]?.[momentoKey] || [];
      const comidasSeleccionadas = comidas.filter(
        (comida: any) => selecciones[`${perfilId}-${diaActivo}-${momentoKey}-${comida.nombre}`]
      );

      if (comidasSeleccionadas.length === 0) return;
      itemsFound += 1;

      const pageHeight = doc.internal.pageSize.getHeight();
      if (startY > pageHeight - 75) {
        doc.addPage();
        startY = 20;
      }

      const bodyData = comidasSeleccionadas.map((comida: any) => [
        comida.nombre,
        comida.porciones,
        comida.super && comida.super.length > 0
          ? `${comida.detalle}\n+ Extras: ${comida.super.join(', ')}`
          : comida.detalle,
      ]);

      autoTable(doc, {
        startY,
        head: [[momentoLabel.toUpperCase(), 'Porciones', 'Detalle']],
        body: bodyData,
        theme: 'plain',
        headStyles: {
          fillColor: color,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 5,
          halign: 'left',
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [70, 70, 70],
          lineColor: [235, 235, 235],
          lineWidth: 0.1,
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold', textColor: color },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    if (itemsFound === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text('No completaste comidas registradas bajo este perfil para hoy.', 14, startY + 5);
    }
  });

  const suffix = seleccionesInfo.length > 1 ? 'Ambos' : seleccionesInfo[0].perfilData.nombre;
  doc.save(`Menu_Seleccionado_${diaActivo}_${suffix}.pdf`);
}
