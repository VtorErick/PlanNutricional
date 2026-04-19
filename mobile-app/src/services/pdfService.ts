import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { MealItem, Profile } from '../types';

function buildPlanTable(profile: Profile, plan: Record<string, Record<string, MealItem[]>>) {
  const sections = Object.entries(plan)
    .map(([dia, moments]) => {
      const rows = profile.momentos
        .map((moment) => {
          const comidas = moments[moment.key] || [];
          if (!comidas.length) return '';

          const meals = comidas
            .map(
              (meal) => `
                <li>
                  <strong>${meal.nombre}</strong><br />
                  ${meal.porciones}<br />
                  ${meal.detalle}
                </li>
              `
            )
            .join('');

          return `
            <section style="margin-bottom: 16px;">
              <h3 style="margin: 0 0 8px; color: #0f172a;">${moment.label}</h3>
              <ul style="margin: 0; padding-left: 18px; color: #334155;">
                ${meals}
              </ul>
            </section>
          `;
        })
        .join('');

      return `
        <article style="margin-bottom: 24px; page-break-inside: avoid;">
          <h2 style="color: #1d4ed8; margin-bottom: 12px;">${dia}</h2>
          ${rows}
        </article>
      `;
    })
    .join('');

  return `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a;">
        <h1 style="margin-bottom: 6px;">Plan Nutricional - ${profile.nombre}</h1>
        <p style="margin-top: 0; color: #475569;">${profile.meta}</p>
        ${sections}
      </body>
    </html>
  `;
}

export async function generatePlanPDF(
  profile: Profile,
  plan: Record<string, Record<string, MealItem[]>>
) {
  const html = buildPlanTable(profile, plan);
  const { uri } = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('El sistema no permite compartir archivos PDF en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Plan Nutricional - ${profile.nombre}`,
    UTI: 'com.adobe.pdf',
  });
}
