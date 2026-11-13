import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  // Clear once for a fresh boot. A persistent init script would wipe the
  // settled balance on the reload this file is here to prove.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const play = page.getByTestId('nav-play');
  if (await play.isVisible()) await play.click();
});

async function turnOn(locator: Locator) {
  const nested = locator.locator('input[type="checkbox"], input[type="radio"]');
  if ((await nested.count()) > 0) {
    await nested.first().check();
    return;
  }

  const kind = await locator.evaluate((el) => {
    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      return 'checkable';
    }
    const role = el.getAttribute('role');
    if (role === 'switch' || role === 'checkbox') return 'checkable';
    return 'button';
  });

  if (kind === 'checkable') {
    await locator.check();
    return;
  }

  const pressed = await locator.getAttribute('aria-pressed');
  const expanded = await locator.getAttribute('aria-checked');
  if (pressed !== 'true' && expanded !== 'true') {
    await locator.click();
  }
}

async function playAlwaysWinRed(page: Page) {
  await page.getByTestId('menu-button').click();
  await page.getByTestId('dev-username').fill('hassan');
  await page.getByTestId('dev-password').fill('1234');
  await page.getByTestId('dev-login').click();
  await turnOn(page.getByTestId('test-mode-toggle'));
  await page.getByTestId('win-loss-mode').selectOption('always-win');
  await page.getByTestId('apply-test').click();
  await page.getByTestId('close-dev').click();

  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');
  await page.getByTestId('gamble').click();
  await page.getByTestId('confirm-gamble').click();

  await expect(page.getByTestId('result-title')).toContainText(/YOU WIN/i, { timeout: 15_000 });
  await expect(page.getByTestId('balance')).toContainText(/10,?100/);
}

test('reload keeps the settled balance from casino-demon:v1', async ({ page }) => {
  await playAlwaysWinRed(page);

  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('casino-demon:v1')), {
      timeout: 15_000,
    })
    .toContain('10100');

  await page.reload();
  await expect(page.getByTestId('balance')).toContainText(/10,?100/);
  await expect(page.getByTestId('balance')).toBeVisible();
});

test('corrupt saved state recovers to the 10000 stake instead of a blank page', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('casino-demon:v1', '{bad'));
  await page.reload();

  await expect(page.getByTestId('balance')).toBeVisible();
  await expect(page.getByTestId('balance')).toContainText(/10,?000/);
  await expect(page.getByTestId('fictional-disclaimer')).toBeVisible();
  await expect(page.getByTestId('menu-button')).toBeVisible();
});
