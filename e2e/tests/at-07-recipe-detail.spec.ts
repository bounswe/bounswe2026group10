import { test, expect } from '@playwright/test';
import { login, TEST_RECIPE_ID } from './helpers';

test.describe('AT-07: Recipe Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/recipes/${TEST_RECIPE_ID}`);
  });

  test('recipe title is visible', async ({ page }) => {
    await expect(page.getByTestId('recipe-title')).toBeVisible({ timeout: 10000 });
    const title = await page.getByTestId('recipe-title').innerText();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test('ingredient list contains at least one item', async ({ page }) => {
    await expect(page.getByTestId('ingredient-quantity').first()).toBeVisible({ timeout: 10000 });
    const count = await page.getByTestId('ingredient-quantity').count();
    expect(count).toBeGreaterThan(0);
  });

  test('steps list contains at least one step', async ({ page }) => {
    await expect(page.getByTestId('recipe-step-item').first()).toBeVisible({ timeout: 10000 });
    const count = await page.getByTestId('recipe-step-item').count();
    expect(count).toBeGreaterThan(0);
  });
});
