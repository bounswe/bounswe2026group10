import { Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL ?? 'e2e-test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPassword123!';
export const TEST_RECIPE_ID = process.env.TEST_RECIPE_ID ?? 'f3d8b31e-c400-4464-a297-366c1deace76';

export async function login(page: Page) {
  await page.goto('/login');
  await page.locator('#login-email').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  await page.locator('#login-submit').click();
  await page.waitForURL('**/home');
}
