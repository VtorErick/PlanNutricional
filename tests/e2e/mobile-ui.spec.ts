import { expect, test, type Page } from '@playwright/test';

import {
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

  await expect(page.getByTestId(`questionnaire-step-horarios-${profile}`)).toBeVisible();
  await page.getByTestId('questionnaire-skip').click();
}

test.describe.configure({ mode: 'serial' });

test('landing, admin, and questionnaire generation flow work on mobile', async ({ page }) => {
  await mockPlanGenerationApis(page);
  await page.goto('/home');

  await expect(page.getByTestId('landing-customize-ambos')).toBeVisible();
  await saveDocScreenshot(page, 'landing-mobile.png');

  await page.getByTestId('landing-admin-button').click();
  await expect(page.getByTestId('admin-tab-settings')).toBeVisible();
  await page.getByTestId('admin-tab-settings').click();
  await expect(
    page.getByRole('heading', { name: /Generaci.*autom.*planes/i })
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
  await saveDocScreenshot(page, 'questionnaire-confirm-mobile.png');

  await page.getByTestId('questionnaire-generate').click();
  await expect(page.getByRole('heading', { name: /Plan generado/i })).toBeVisible();
  await page.getByRole('button', { name: /Aceptar/i }).click();
  await expect(page.getByTestId('landing-profile-ambos-card')).toBeVisible();
});

test('single-profile plan flow supports selecting meals, editing, and downloading PDF on mobile', async ({
  page,
}) => {
  await seedGeneratedPlans(page);
  await page.goto('/miplan?profile=el');

  await expect(page.getByTestId('moment-empty-desayuno-single')).toBeVisible();
  await page.getByTestId('moment-empty-desayuno-single').click();
  await expect(page.getByTestId('meal-option-el-Lunes-desayuno-0')).toBeVisible();
  await page.getByTestId('meal-option-el-Lunes-desayuno-0').click();

  const selectedMeal = page.locator('[data-testid^="selected-meal-el-Lunes-desayuno-"]').first();
  await expect(selectedMeal).toBeVisible();
  await selectedMeal.click();
  await page.getByTestId('meal-edit-el-Lunes-desayuno-0').click();

  await page.getByPlaceholder('Ej. Omelette con fruta').fill('Desayuno de prueba Playwright');
  await page.getByRole('button', { name: /Confirmar y reemplazar/i }).click();
  await expect(page.getByText(/Platillo actualizado/i)).toBeVisible();
  await page.getByRole('button', { name: /Aceptar/i }).click();
  await expect(page.getByText('Desayuno de prueba Playwright')).toBeVisible();

  const dayPdfDownload = page.waitForEvent('download');
  await page.getByTestId('header-pdf-button').click();
  await page.getByRole('button', { name: /PDF del d/i }).click();
  const download = await dayPdfDownload;
  expect(download.suggestedFilename()).toContain('Menu_Seleccionado_Lunes');

  await saveDocScreenshot(page, 'plan-mobile.png');
});

test('combined mobile navigation renders every major view with populated data', async ({ page }) => {
  await seedGeneratedPlans(page, { selectedDays: ['Lunes', 'Martes'] });
  await page.goto('/miplan?profile=ambos');

  await page.getByTestId('mobile-tab-equivalencias').click();
  await expect(page.getByRole('heading', { name: /Equivalencias/i })).toBeVisible();
  await saveDocScreenshot(page, 'equivalencias-mobile.png');

  await page.getByTestId('mobile-tab-suplementos').click();
  await expect(page.getByRole('heading', { name: /Suplementos/i })).toBeVisible();
  await saveDocScreenshot(page, 'supplements-mobile.png');

  await page.getByTestId('mobile-tab-calorias').click();
  await expect(page.getByText(/Semana en un vistazo/i)).toBeVisible();
  await page.getByRole('button', { name: /Martes/i }).click();
  await saveDocScreenshot(page, 'calories-mobile.png');

  await page.getByTestId('mobile-tab-compras').click();
  await expect(page.getByRole('heading', { name: /Supermercado/i })).toBeVisible();
  const expandButton = page.locator('button[aria-label^="Expandir comidas de"]').first();
  await expandButton.click();
  await page.locator('button[aria-label^="Marcar ingrediente"]').first().click();
  await saveDocScreenshot(page, 'shopping-mobile.png');

  await page.getByTestId('mobile-tab-resumen').click();
  await expect(page.getByRole('heading', { name: /^Resumen$/ })).toBeVisible();
  await saveDocScreenshot(page, 'summary-mobile.png');
});
