import { expect, test, type Page } from '@playwright/test';

import {
  buildAdjustPlanResponse,
  getFirstMealName,
  mockGeminiStatusApi,
  mockPlanGenerationApis,
  saveDocScreenshot,
  seedGeneratedPlans,
} from './helpers/app-fixtures';

async function skipOptionalSteps(page: Page, count: number) {
  for (let index = 0; index < count; index += 1) {
    await expect(page.getByTestId('questionnaire-skip')).toBeVisible();
    await page.getByTestId('questionnaire-skip').click();
  }
}

async function completeProfileQuestionnaire(page: Page, profile: 'el' | 'ella', age: string) {
  await expect(page.getByTestId(`questionnaire-step-fisica-${profile}`)).toBeVisible();
  await page.getByRole('spinbutton').first().fill(age);
  await page.getByTestId('questionnaire-next').click();

  await expect(page.getByTestId(`questionnaire-step-objetivo-${profile}`)).toBeVisible();
  await page.getByRole('button', { name: /Perder grasa/i }).click();
  await page.getByTestId('questionnaire-next').click();

  await skipOptionalSteps(page, 4);

  await expect(page.getByTestId(`questionnaire-step-lifestyle-${profile}`)).toBeVisible();
  await page.getByTestId('questionnaire-next').click();
}

test.describe.configure({ mode: 'serial' });

test('landing, admin, and questionnaire generation flow work on mobile', async ({ page }) => {
  await mockPlanGenerationApis(page);
  await page.goto('/home');

  await expect(page.getByTestId('landing-customize-ambos')).toBeVisible();
  await saveDocScreenshot(page, 'landing-mobile.png');

  await page.getByTestId('header-settings-button').click();
  await expect(page.getByTestId('admin-tab-settings')).toBeVisible();
  await page.getByTestId('admin-tab-settings').click();
  await expect(
    page.getByRole('heading', { name: /^AI$/i })
  ).toBeVisible();
  await saveDocScreenshot(page, 'admin-settings-mobile.png');
  await page.getByTestId('admin-close-button').click();

  await page.getByTestId('landing-customize-ambos').click();
  await expect(page.getByTestId('questionnaire-step-who')).toBeVisible();
  await page.getByTestId('questionnaire-target-ambos').click();

  await completeProfileQuestionnaire(page, 'el', '33');
  await completeProfileQuestionnaire(page, 'ella', '32');

  await expect(page.getByTestId('questionnaire-step-portions')).toBeVisible();
  await page.getByTestId('questionnaire-next').click();
  await expect(page.getByTestId('questionnaire-step-cocina')).toBeVisible();
  await page.getByTestId('questionnaire-next').click();
  await expect(page.getByTestId('questionnaire-step-confirm')).toBeVisible();
  await expect(page.getByTestId('questionnaire-model-preview')).toContainText(/Modelo previsto/i);
  await saveDocScreenshot(page, 'questionnaire-confirm-mobile.png');

  await page.getByTestId('questionnaire-generate').click();
  await expect(page.getByRole('heading', { name: /Plan generado/i })).toBeVisible();
  await expect(page.getByText(/Modelo usado:/i)).toBeVisible();
  await page.getByRole('button', { name: /Aceptar/i }).click();
  await expect(page.getByTestId('landing-profile-ambos-card')).toBeVisible();
});

async function openDayPickerAndSelectDay(page: Page, day: string) {
  const dayButton = page.locator('button').filter({ hasText: new RegExp(`^${day.slice(0, 3)}$`, 'i') }).first();
  await dayButton.click();
}

async function selectMobileTab(page: Page, tab: string) {
  const directTab = page.getByTestId(`mobile-tab-${tab}`);
  if (await directTab.isVisible().catch(() => false)) {
    await directTab.click();
    return;
  }

  await page.getByTestId('mobile-more-button').click();
  await page.getByTestId(`mobile-tab-${tab}`).click();
}

test('single-profile plan flow supports selecting meals and downloading PDF on mobile', async ({
  page,
}) => {
  await seedGeneratedPlans(page, { selectedDays: ['Lunes', 'Sabado'] });
  await page.goto('/miplan?profile=el');

  const selectedMeal = page.locator('[data-testid^="selected-meal-el-Lunes-desayuno-"]').first();
  await expect(selectedMeal).toBeVisible();

  await selectedMeal.click();
  await expect(page.getByText('Elegir platillo')).toBeVisible();
  await page.getByTestId('meal-swap-option-el-Lunes-desayuno-2').click();
  await expect(page.getByText('Elegir platillo')).not.toBeVisible();

  await openDayPickerAndSelectDay(page, 'Sab');
  await page.locator('[data-testid^="selected-meal-el-Sabado-desayuno-"]').first().click();
  await page.getByTestId('meal-swap-option-el-Sabado-desayuno-2').click();

  await openDayPickerAndSelectDay(page, 'Lun');

  const dayPdfDownload = page.waitForEvent('download');
  await page.getByTestId('header-pdf-button').click();
  await page.getByRole('button', { name: /Menu de hoy/i }).click();
  const download = await dayPdfDownload;
  expect(download.suggestedFilename()).toContain('Menu_Seleccionado_Lunes');

  await saveDocScreenshot(page, 'plan-mobile.png');

  await page.goto('/admin');
  await expect(page.getByTestId('admin-export-json-el')).toBeVisible();
  const customJsonDownload = page.waitForEvent('download');
  await page.getByTestId('admin-export-json-el').click();
  const jsonDownload = await customJsonDownload;
  expect(jsonDownload.suggestedFilename()).toBe('perfil-el-personalizado.json');

  await page.locator('button[title="Eliminar version personalizada"]').first().click();
  await expect(page.getByRole('button', { name: /Cancelar/i })).toBeVisible();
  await page.getByRole('button', { name: /Cancelar/i }).click();

  const customJsonDownloadAfterCancel = page.waitForEvent('download');
  await page.getByTestId('admin-export-json-el').click();
  const jsonDownloadAfterCancel = await customJsonDownloadAfterCancel;
  expect(jsonDownloadAfterCancel.suggestedFilename()).toBe('perfil-el-personalizado.json');

  await page.locator('button[title="Eliminar version personalizada"]').first().click();
  await page.getByRole('button', { name: /Confirmar/i }).click();

  const originalJsonDownload = page.waitForEvent('download');
  await page.getByTestId('admin-export-json-el').click();
  const originalDownload = await originalJsonDownload;
  expect(originalDownload.suggestedFilename()).toBe('perfil-el.json');
});

test('mobile flow supports AI plan adjustment without recreating the whole plan', async ({ page }) => {
  const originalBreakfast = getFirstMealName('el', 'Lunes', 'desayuno');
  const untouchedTuesdayBreakfast = getFirstMealName('el', 'Martes', 'desayuno');
  const updatedBreakfast = 'Desayuno ajustado por IA';

  await seedGeneratedPlans(page, { selectedDays: ['Lunes', 'Martes'] });
  await mockGeminiStatusApi(page);
  await page.route('**/api/generate-plan', async (route) => {
    const response = buildAdjustPlanResponse('el', 'Lunes', 'desayuno', [
      {
        nombre: updatedBreakfast,
        porciones: '1 porcion',
        detalle: 'Opcion ajustada para la prueba de IA',
        tags: ['ajuste'],
        super: ['avena', 'fruta'],
        caloriasKcal: 320,
        proteinaG: 20,
        carbohidratosG: 38,
        grasasG: 10,
      },
      {
        nombre: 'Alternativa ligera de IA',
        porciones: '1 porcion',
        detalle: 'Segunda opcion ajustada',
        tags: ['ajuste'],
        super: ['yogur', 'fruta'],
        caloriasKcal: 290,
        proteinaG: 18,
        carbohidratosG: 37,
        grasasG: 8,
      },
      {
        nombre: 'Tercera opcion IA',
        porciones: '1 porcion',
        detalle: 'Tercera opcion del parche',
        tags: ['ajuste'],
        super: ['pan', 'huevo'],
        caloriasKcal: 340,
        proteinaG: 22,
        carbohidratosG: 38,
        grasasG: 11,
      },
    ]);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  await page.goto('/miplan?profile=el');

  await expect(page.getByText(originalBreakfast)).toBeVisible();
  await page.getByTestId('plan-ai-open').click();
  await expect(page.getByTestId('plan-ai-mode-adjust')).toBeVisible();
  await page.getByTestId('plan-ai-mode-adjust').click();
  await page.getByTestId('plan-ai-instruction').fill('Menos pescado en la noche y cambia el desayuno del lunes.');
  await page.getByTestId('plan-ai-submit').click();

  await expect(page.getByText(/Plan actualizado con IA/i)).toBeVisible();
  await expect(page.getByText(/Modelo usado:/i)).toBeVisible();
  await page.getByRole('button', { name: /Aceptar/i }).click();
  await expect(page.getByText(updatedBreakfast)).toBeVisible();
  await expect(page.getByText(originalBreakfast)).toHaveCount(0);

  await openDayPickerAndSelectDay(page, 'Martes');
  await expect(page.getByText(untouchedTuesdayBreakfast)).toBeVisible();
});

test('AI regenerate tolerates patch-shaped responses and still refreshes the visible plan', async ({
  page,
}) => {
  const updatedBreakfast = 'Desayuno regenerado por IA';

  await seedGeneratedPlans(page, { selectedDays: ['Lunes', 'Martes'] });
  await mockGeminiStatusApi(page);
  await page.route('**/api/generate-plan', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        modelUsed: 'gemini-3.1-pro-preview',
        responseMode: 'regenerate',
        elData: {
          summary: ['Se regenero el desayuno del lunes.'],
          planPatch: {
            Lunes: {
              desayuno: [
                {
                  nombre: updatedBreakfast,
                  porciones: '1 porcion',
                  detalle: 'Nueva opcion regenerada para la prueba',
                  tags: ['regenerado'],
                  super: ['avena', 'berries'],
                  caloriasKcal: 330,
                  proteinaG: 21,
                  carbohidratosG: 39,
                  grasasG: 10,
                },
                {
                  nombre: 'Segunda opcion regenerada',
                  porciones: '1 porcion',
                  detalle: 'Alternativa regenerada',
                  tags: ['regenerado'],
                  super: ['pan', 'huevo'],
                  caloriasKcal: 340,
                  proteinaG: 22,
                  carbohidratosG: 38,
                  grasasG: 11,
                },
                {
                  nombre: 'Tercera opcion regenerada',
                  porciones: '1 porcion',
                  detalle: 'Tercera alternativa regenerada',
                  tags: ['regenerado'],
                  super: ['yogur', 'fruta'],
                  caloriasKcal: 300,
                  proteinaG: 18,
                  carbohidratosG: 39,
                  grasasG: 8,
                },
              ],
            },
          },
        },
      }),
    });
  });

  await page.goto('/miplan?profile=el');
  await page.getByTestId('plan-ai-open').click();
  await page.getByTestId('plan-ai-mode-regenerate').click();
  await page.getByTestId('plan-ai-instruction').fill('Rehaz el plan con desayunos mas ligeros.');
  await page.getByTestId('plan-ai-submit').click();

  await expect(page.getByText(/Plan recreado/i)).toBeVisible();
  await expect(page.getByText(/Modelo usado:/i)).toBeVisible();
  await page.getByRole('button', { name: /Aceptar/i }).click();
  await expect(page.getByText(updatedBreakfast)).toBeVisible();
});

test('combined mobile navigation renders every major view with populated data', async ({ page }) => {
  await seedGeneratedPlans(page, { selectedDays: ['Lunes', 'Martes'] });
  await page.goto('/miplan?profile=ambos');

  const fullPlanDownload = page.waitForEvent('download');
  await page.getByTestId('header-pdf-button').click();
  await page.getByRole('button', { name: /Plan completo/i }).click();
  const download = await fullPlanDownload;
  expect(download.suggestedFilename()).toBe('Plan_Nutricional_Ambos.pdf');

  await selectMobileTab(page, 'plan');
  await page.getByTestId('plan-equivalencias-open').click();
  await expect(page.getByRole('heading', { name: /Equivalencias/i })).toBeVisible();
  await saveDocScreenshot(page, 'equivalencias-mobile.png');
  await page.getByLabel(/Cerrar gu.a de equivalencias/i).click();

  await page.getByTestId('plan-suplementos-nav').click();
  await expect(page.getByRole('heading', { name: 'Suplementos', exact: true })).toBeVisible();
  await saveDocScreenshot(page, 'supplements-mobile.png');
  await page.getByLabel('Cerrar suplementos').click();

  await selectMobileTab(page, 'calorias');
  await expect(page.getByRole('heading', { name: /Kcal por/i })).toBeVisible();
  await page.getByRole('button', { name: /^Mar/i }).first().click();
  await saveDocScreenshot(page, 'calories-mobile.png');

  await selectMobileTab(page, 'compras');
  await expect(page.getByRole('heading', { name: /Supermercado/i })).toBeVisible();
  const expandButton = page.locator('button[aria-label^="Expandir comidas de"]').first();
  await expandButton.click();
  await page.locator('button[aria-label^="Marcar ingrediente"]').first().click();
  await saveDocScreenshot(page, 'shopping-mobile.png');

  await selectMobileTab(page, 'resumen');
  await expect(page.getByRole('heading', { name: /^Resumen$/ })).toBeVisible();
  await saveDocScreenshot(page, 'summary-mobile.png');
});
