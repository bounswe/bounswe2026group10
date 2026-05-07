import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('AT-04: Allergen Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/discovery');
  });

  test('allergen filter panel opens', async ({ page }) => {
    await page.getByTestId('filter-toggle').click();
    await expect(page.getByTestId('filter-panel')).toBeVisible();
  });

  test('selecting an allergen filters recipe results', async ({ page }) => {
    await page.getByTestId('filter-toggle').click();
    const chip = page.getByTestId('allergen-chip').first();

    const responsePromise = page.waitForResponse((r) => r.url().includes('/recipes') && r.status() === 200);
    await chip.click();
    await responsePromise;

    await expect(chip).toHaveClass(/active/);
  });

  test('clearing allergen filter restores results', async ({ page }) => {
    await expect(page.getByTestId('recipe-card').first()).toBeVisible();
    const recipesBefore = await page.getByTestId('recipe-card').count();

    await page.getByTestId('filter-toggle').click();
    await page.getByTestId('allergen-chip').first().click();
    await page.waitForResponse((r) => r.url().includes('/recipes') && r.status() === 200);

    await page.getByTestId('clear-filters').click();
    await page.waitForResponse((r) => r.url().includes('/recipes') && r.status() === 200);

    const recipesAfter = await page.getByTestId('recipe-card').count();
    expect(recipesAfter).toBe(recipesBefore);
  });
});
