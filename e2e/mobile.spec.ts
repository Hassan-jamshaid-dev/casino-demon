import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const play = page.getByTestId('nav-play');
  if (await play.isVisible()) await play.click();
});

test('phone layout shows the disclaimer and a red bet without horizontal overflow', async ({ page }) => {
  await expect(page.getByTestId('fictional-disclaimer')).toBeVisible();
  await expect(page.getByTestId('balance')).toBeVisible();

  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');

  await expect(page.getByTestId('gamble')).toBeVisible();

  const fits = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth <= root.clientWidth + 2;
  });
  expect(fits).toBe(true);
});
