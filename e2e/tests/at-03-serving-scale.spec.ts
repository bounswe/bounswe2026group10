import { test, expect } from '@playwright/test';
import { login, TEST_RECIPE_ID } from './helpers';

test.describe('AT-03: Serving Size Scaling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/recipes/${TEST_RECIPE_ID}`);
  });

  test('increases serving count when plus button is clicked', async ({ page }) => {
    const valueEl = page.getByTestId('serving-value');
    await expect(valueEl).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    const initial = parseInt(await valueEl.innerText(), 10);

    await page.getByTestId('serving-plus').click();

    await expect(valueEl).toHaveText(String(initial + 1), { timeout: 5000 });
  });
});
