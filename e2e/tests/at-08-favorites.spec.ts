import { test, expect } from '@playwright/test';
import { login, TEST_RECIPE_ID } from './helpers';

test.describe('AT-08: Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/recipes/${TEST_RECIPE_ID}`);
  });

  test('favorite button is visible on recipe detail', async ({ page }) => {
    await expect(page.getByTestId('favorite-btn')).toBeVisible();
  });

  test('clicking favorite button toggles aria-pressed to true', async ({ page }) => {
    const btn = page.getByTestId('favorite-btn');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    const wasFavorited = (await btn.getAttribute('aria-pressed')) === 'true';

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/favorites') && r.status() < 300),
      btn.click(),
    ]);

    const nowFavorited = (await btn.getAttribute('aria-pressed')) === 'true';
    expect(nowFavorited).toBe(!wasFavorited);
  });

});
