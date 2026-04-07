import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const screenshotDir = path.join(repoRoot, 'docs', 'screenshots', 'mobile');

const elFixture = JSON.parse(
  readFileSync(path.join(repoRoot, 'src', 'data', 'defaults', 'perfil-el.json'), 'utf8')
);
const ellaFixture = JSON.parse(
  readFileSync(path.join(repoRoot, 'src', 'data', 'defaults', 'perfil-ella.json'), 'utf8')
);

type SeedPlanOptions = {
  selectedDays?: string[];
};

export function getGeneratedPlanResponse(targetProfile: 'el' | 'ella' | 'ambos' = 'ambos') {
  if (targetProfile === 'el') {
    return { elData: elFixture };
  }

  if (targetProfile === 'ella') {
    return { ellaData: ellaFixture };
  }

  return { elData: elFixture, ellaData: ellaFixture };
}

function buildSelectionSeed(days: string[]) {
  const selections: Record<string, boolean> = {};
  const sources = [
    ['el', elFixture.planEL as Record<string, Record<string, Array<{ nombre: string }>>>],
    ['ella', ellaFixture.planELLA as Record<string, Record<string, Array<{ nombre: string }>>>],
  ] as const;

  for (const [profileId, plan] of sources) {
    for (const day of days) {
      const dayPlan = plan[day] || {};
      for (const [momentoKey, meals] of Object.entries(dayPlan)) {
        const firstMeal = Array.isArray(meals) ? meals[0] : null;
        if (!firstMeal?.nombre) continue;
        selections[`${profileId}-${day}-${momentoKey}-${firstMeal.nombre}`] = true;
      }
    }
  }

  return selections;
}

export async function seedGeneratedPlans(
  page: Page,
  options: SeedPlanOptions = {}
) {
  const selectedDays = options.selectedDays ?? [];
  const selecciones = buildSelectionSeed(selectedDays);

  await page.addInitScript(
    ({ customData, dataVersions, seleccionesDieta }) => {
      window.localStorage.clear();
      window.localStorage.setItem('darkMode', JSON.stringify(false));
      window.localStorage.setItem('customData', JSON.stringify(customData));
      window.localStorage.setItem('dataVersions', JSON.stringify(dataVersions));
      window.localStorage.setItem('seleccionesDieta', JSON.stringify(seleccionesDieta));
      window.localStorage.setItem('comprasCheck', JSON.stringify({}));
      window.localStorage.setItem('diaActivo', JSON.stringify('Lunes'));
    },
    {
      customData: {
        el: elFixture,
        ella: ellaFixture,
      },
      dataVersions: {
        el: 'custom',
        ella: 'custom',
      },
      seleccionesDieta: selecciones,
    }
  );
}

export async function mockPlanGenerationApis(page: Page) {
  await page.route('**/api/gemini-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        message: 'Gemini disponible para pruebas.',
        selectedModel: 'gemini-2.5-flash',
        availableModels: ['gemini-2.5-flash', 'gemini-2.0-flash'],
        generationChecked: true,
      }),
    });
  });

  await page.route('**/api/generate-plan', async (route) => {
    const rawBody = route.request().postData() || '{}';
    const payload = JSON.parse(rawBody) as { targetProfile?: 'el' | 'ella' | 'ambos' };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(getGeneratedPlanResponse(payload.targetProfile || 'ambos')),
    });
  });
}

export async function saveDocScreenshot(page: Page, fileName: string) {
  mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, fileName),
    fullPage: true,
    animations: 'disabled',
  });
}
