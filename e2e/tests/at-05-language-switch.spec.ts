import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('AT-05: Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('switches UI language to Turkish', async ({ page }) => {
    await page.locator('[lang="tr"]').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  });

  test('switches UI language back to English', async ({ page }) => {
    await page.locator('[lang="tr"]').click();
    await page.locator('[lang="en"]').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('language preference persists after page reload', async ({ page }) => {
    await page.locator('[lang="tr"]').click();

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  });
});
