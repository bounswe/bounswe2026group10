import { test, expect } from '@playwright/test';

test.describe('AT-01: Authentication', () => {
  test('login page renders email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('successful login redirects to home', async ({ page }) => {
    const email = process.env.TEST_EMAIL ?? 'e2e-test@example.com';
    const password = process.env.TEST_PASSWORD ?? 'TestPassword123!';

    await page.goto('/login');
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.locator('#login-submit').click();
    await page.waitForURL('**/home');

    await expect(page).toHaveURL(/\/home/);
  });

  test('wrong credentials shows error alert', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('wrong@example.com');
    await page.locator('#login-password').fill('WrongPass999!');
    await page.locator('#login-submit').click();

    await expect(page.locator('#login-server-error')).toBeVisible({ timeout: 10000 });
  });
});
