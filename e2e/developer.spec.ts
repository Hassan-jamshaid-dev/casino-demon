import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  const play = page.getByTestId('nav-play');
  if (await play.isVisible()) await play.click();
});

async function balanceDigits(page: Page): Promise<string> {
  const text = await page.getByTestId('balance').innerText();
  return text.replace(/\D/g, '');
}

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
  const checked = await locator.getAttribute('aria-checked');
  if (pressed !== 'true' && checked !== 'true') {
    await locator.click();
  }
}

async function chooseAlwaysWin(page: Page) {
  const control = page.getByTestId('win-loss-mode');
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === 'SELECT') {
    await control.selectOption('always-win');
    return;
  }
  await control.click();
  const option = page.getByRole('option', { name: /always win/i });
  if ((await option.count()) > 0) {
    await option.first().click();
    return;
  }
  await page.getByText(/always win/i).click();
}

async function openDeveloperLogin(page: Page) {
  await page.getByTestId('menu-button').click();
  await expect(page.getByTestId('dev-login')).toBeVisible();
}

test('bad login shows an error and does not open the rig counter', async ({ page }) => {
  await openDeveloperLogin(page);
  await page.getByTestId('dev-username').fill('x');
  await page.getByTestId('dev-password').fill('y');
  await page.getByTestId('dev-login').click();

  await expect(page.getByTestId('error')).toContainText(/invalid developer credentials/i);
  await expect(page.getByTestId('rig-counter')).toHaveCount(0);
  await expect(page.getByTestId('dev-login')).toBeVisible();
});

test('demo login reaches the dashboard and the security note is visible', async ({ page }) => {
  await openDeveloperLogin(page);
  await expect(page.getByTestId('security-note')).toBeVisible();
  await page.getByTestId('dev-username').fill('hassan');
  await page.getByTestId('dev-password').fill('1234');
  await page.getByTestId('dev-login').click();

  await expect(page.getByTestId('rig-counter')).toBeVisible();
  await expect(page.getByTestId('apply-test')).toBeVisible();
});

test('applied always-win forces a 100 red bet to pay back 200', async ({ page }) => {
  await openDeveloperLogin(page);
  await page.getByTestId('dev-username').fill('hassan');
  await page.getByTestId('dev-password').fill('1234');
  await page.getByTestId('dev-login').click();
  await expect(page.getByTestId('test-mode-toggle')).toBeVisible();

  await turnOn(page.getByTestId('test-mode-toggle'));
  await chooseAlwaysWin(page);
  await page.getByTestId('apply-test').click();
  await page.getByTestId('close-dev').click();

  await expect(page.getByTestId('test-mode-banner')).toBeVisible();
  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');
  await page.getByTestId('gamble').click();
  await page.getByTestId('confirm-gamble').click();

  await expect(page.getByTestId('result-title')).toContainText(/YOU WIN/i);
  expect(await balanceDigits(page)).toBe('10100');
});

test('logout returns to the contestant screen', async ({ page }) => {
  await openDeveloperLogin(page);
  await page.getByTestId('dev-username').fill('hassan');
  await page.getByTestId('dev-password').fill('1234');
  await page.getByTestId('dev-login').click();
  await expect(page.getByTestId('dev-logout')).toBeVisible();

  await page.getByTestId('dev-logout').click();
  await expect(page.getByTestId('fictional-disclaimer')).toBeVisible();
  await expect(page.getByTestId('balance')).toBeVisible();
  await expect(page.getByTestId('rig-counter')).toHaveCount(0);
});
