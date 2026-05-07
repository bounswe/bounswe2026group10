import { test, expect } from '@playwright/test';
import { login, TEST_RECIPE_ID } from './helpers';

test.describe('AT-03: Serving Size Scaling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/recipes/${TEST_RECIPE_ID}`);
  });

  test('increases serving count when plus button is clicked', async ({ page }) => {
    const valueEl = page.getByTestId('serving-value');
    const initial = parseInt(await valueEl.innerText(), 10);

    await page.getByTestId('serving-plus').click();

    await expect(valueEl).toHaveText(String(initial + 1));
  });

  test('decreases serving count when minus button is clicked', async ({ page }) => {
    // Increase first so we have room to decrease
    await page.getByTestId('serving-plus').click();

    const valueEl = page.getByTestId('serving-value');
    const current = parseInt(await valueEl.innerText(), 10);

    await page.getByTestId('serving-minus').click();

    await expect(valueEl).toHaveText(String(current - 1));
  });

  test('ingredient quantities update after serving change', async ({ page }) => {
    const allQtys = page.getByTestId('ingredient-quantity');
    await expect(allQtys.first()).toBeVisible();
    const beforeTexts = await allQtys.allInnerTexts();

    await page.getByTestId('serving-plus').click();
    await page.getByTestId('serving-plus').click();

    await expect(async () => {
      const afterTexts = await allQtys.allInnerTexts();
      expect(afterTexts).not.toEqual(beforeTexts);
    }).toPass({ timeout: 10000 });
  });
});
