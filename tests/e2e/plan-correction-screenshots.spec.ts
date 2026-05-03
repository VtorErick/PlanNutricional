import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const resultsDir = path.join(repoRoot, 'scripts', 'results-deepseek-v4-flash');
const screenshotDir = path.join(repoRoot, 'docs', 'screenshots', 'plan-correction');

const WEEK_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const MEAL_MOMENT_KEYS = ['desayuno', 'colacion_am', 'comida', 'colacion_pm', 'cena'];

function slotsToObject(slots: any[]) {
  const plan: any = {};
  for (const slot of slots) {
    if (!plan[slot.dia]) plan[slot.dia] = {};
    plan[slot.dia][slot.momento] = slot.opciones;
  }
  for (const dia of WEEK_DAYS) {
    if (!plan[dia]) plan[dia] = {};
    for (const momento of MEAL_MOMENT_KEYS) {
      if (!plan[dia][momento]) plan[dia][momento] = [];
    }
  }
  return plan;
}

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function buildSelections(planObj: any, prefix: 'el' | 'ella') {
  const selections: Record<string, boolean> = {};
  for (const dia of WEEK_DAYS) {
    for (const momento of MEAL_MOMENT_KEYS) {
      const firstMeal = planObj[dia]?.[momento]?.[0];
      if (firstMeal?.nombre) {
        selections[`${prefix}-${dia}-${momento}-${firstMeal.nombre}`] = true;
      }
    }
  }
  return selections;
}

async function seedPlanData(page: any, planEl: any, planElla: any, perfilEl: any, perfilElla: any) {
  const selecciones = {
    ...buildSelections(planEl, 'el'),
    ...buildSelections(planElla, 'ella'),
  };

  await page.addInitScript(
    ({ customData, dataVersions, seleccionesDieta }) => {
      window.localStorage.clear();
      window.localStorage.setItem('darkMode', JSON.stringify(false));
      window.localStorage.setItem('customData', JSON.stringify(customData));
      window.localStorage.setItem('dataVersions', JSON.stringify(dataVersions));
      window.localStorage.setItem('seleccionesDieta', JSON.stringify(seleccionesDieta));
      window.localStorage.setItem('comprasCheck', JSON.stringify({}));
      window.localStorage.setItem('diaActivo', JSON.stringify('Lunes'));
      window.localStorage.setItem('perfilActivo', JSON.stringify('ambos'));
    },
    {
      customData: {
        el: { planEL: planEl, perfilEL: perfilEl },
        ella: { planELLA: planElla, perfilELLA: perfilElla },
      },
      dataVersions: { el: 'custom', ella: 'custom' },
      seleccionesDieta: selecciones,
    }
  );
}

async function takeSwapSheetScreenshot(page: any, suffix: string) {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  // Navigate to Plan tab
  const planTab = page.locator('nav').locator('button').filter({ hasText: /Plan|Calendario/i }).first();
  if (await planTab.isVisible().catch(() => false)) {
    await planTab.click();
    await page.waitForTimeout(500);
  }

  // Wait for plan content
  await expect(page.locator('text=Desayuno').first()).toBeVisible({ timeout: 10000 });

  // Click on El's desayuno slot to open swap sheet
  const elDesayunoSlot = page.locator('[data-testid="moment-empty-desayuno-el"]').first();
  if (await elDesayunoSlot.isVisible().catch(() => false)) {
    await elDesayunoSlot.click();
  } else {
    // If already selected (after), click the selected card
    const selectedCard = page.locator('[data-testid^="selected-meal-el-Lunes-desayuno-"]').first();
    if (await selectedCard.isVisible().catch(() => false)) {
      await selectedCard.click();
    }
  }

  // Wait for swap sheet to appear
  await expect(page.locator('text=Elegir platillo').first()).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(800);

  // Take viewport screenshot while swap sheet is open
  await page.screenshot({
    path: path.join(screenshotDir, `swapsheet-${suffix}.png`),
    animations: 'disabled',
  });
}

async function takePlanScreenshots(page: any, suffix: string) {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');

  // Navigate to Plan tab
  const planTab = page.locator('nav').locator('button').filter({ hasText: /Plan|Calendario/i }).first();
  if (await planTab.isVisible().catch(() => false)) {
    await planTab.click();
    await page.waitForTimeout(500);
  }

  // Wait for plan content
  await expect(page.locator('text=Desayuno').first()).toBeVisible({ timeout: 10000 });

  // Take full-page screenshot
  await page.screenshot({
    path: path.join(screenshotDir, `plan-${suffix}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

test('plan correction before and after screenshots', async ({ page }) => {
  test.setTimeout(60_000);
  const rawEl = readJson(path.join(resultsDir, 'el-plan-parsed.json'));
  const rawElla = readJson(path.join(resultsDir, 'ella-plan-parsed.json'));
  const repairedEl = readJson(path.join(resultsDir, 'el-plan-repaired.json'));
  const repairedElla = readJson(path.join(resultsDir, 'ella-plan-repaired.json'));
  const perfilEl = readJson(path.join(resultsDir, 'precomputed-el.json'));
  const perfilElla = readJson(path.join(resultsDir, 'precomputed-ella.json'));

  const rawPlanEl = slotsToObject(rawEl.planSemanalEL || []);
  const rawPlanElla = slotsToObject(rawElla.planSemanalELLA || []);

  // BEFORE (raw AI data)
  await seedPlanData(page, rawPlanEl, rawPlanElla, perfilEl, perfilElla);
  await takeSwapSheetScreenshot(page, 'before');
  await takePlanScreenshots(page, 'before');

  // AFTER (repaired data)
  await seedPlanData(page, repairedEl, repairedElla, perfilEl, perfilElla);
  await takeSwapSheetScreenshot(page, 'after');
  await takePlanScreenshots(page, 'after');
});
