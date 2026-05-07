import { test, expect } from '@playwright/test';
import { login, TEST_RECIPE_ID } from './helpers';

test.describe('AT-02: Ingredient Substitution Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/recipes/${TEST_RECIPE_ID}`);
  });

  test('opens substitution modal when substitute button is clicked', async ({ page }) => {
    await page.getByTestId('substitute-btn').first().click();
    await expect(page.getByTestId('substitution-modal')).toBeVisible();
  });

  test('substitution modal shows at least one substitution', async ({ page }) => {
    await page.getByTestId('substitute-btn').first().click();
    const modal = page.getByTestId('substitution-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId('substitution-item').first()).toBeVisible();
  });

  test('substitution modal closes on close button click', async ({ page }) => {
    await page.getByTestId('substitute-btn').first().click();
    await expect(page.getByTestId('substitution-modal')).toBeVisible();
    await page.getByTestId('substitution-modal-close').click();
    await expect(page.getByTestId('substitution-modal')).not.toBeVisible();
  });
});
