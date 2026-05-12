import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('AT-06: Recipe Search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/discovery');
  });

test('clearing search input restores default results', async ({ page }) => {
    await page.locator('#discovery-search-input').fill('börek');
    await page.waitForResponse((r) => r.url().includes('/recipes') && r.status() === 200);

    await page.locator('#discovery-search-input').fill('');
    await page.waitForResponse((r) => r.url().includes('/recipes') && r.status() === 200);

    await expect(page.getByTestId('recipe-card').first()).toBeVisible({ timeout: 10000 });
  });
});
