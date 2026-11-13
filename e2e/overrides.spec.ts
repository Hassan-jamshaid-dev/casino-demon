import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
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

async function loginDeveloper(page: Page) {
  await page.getByTestId('menu-button').click();
  await page.getByTestId('dev-username').fill('hassan');
  await page.getByTestId('dev-password').fill('1234');
  await page.getByTestId('dev-login').click();
  await expect(page.getByTestId('test-mode-toggle')).toBeVisible();
}

async function applyTestMode(
  page: Page,
  options: { winLoss?: 'always-win' | 'always-loss'; adjacent?: boolean },
) {
  await loginDeveloper(page);
  await turnOn(page.getByTestId('test-mode-toggle'));
  if (options.winLoss) {
    await page.getByTestId('win-loss-mode').selectOption(options.winLoss);
  }
  if (options.adjacent) {
    await turnOn(page.getByTestId('adjacent-toggle'));
  }
  await page.getByTestId('apply-test').click();
}

async function chooseStraightNumber(page: Page, value: string) {
  const field = page.getByTestId('bet-number-value');
  if ((await field.count()) === 0 || !(await field.isVisible())) return;
  const tag = await field.evaluate((el) => el.tagName);
  if (tag === 'SELECT') {
    await field.selectOption(value);
    return;
  }
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    await field.fill(value);
  }
}

async function confirmGamble(page: Page) {
  await page.getByTestId('gamble').click();
  await page.getByTestId('confirm-gamble').click();
}

async function readRigCounter(page: Page) {
  const rig = page.getByTestId('rig-counter');
  if (!(await rig.isVisible())) {
    await page.getByTestId('menu-button').click();
  }
  if (!(await rig.isVisible()) && (await page.getByTestId('dev-username').isVisible())) {
    await page.getByTestId('dev-username').fill('hassan');
    await page.getByTestId('dev-password').fill('1234');
    await page.getByTestId('dev-login').click();
  }
  await expect(rig).toBeVisible();
  const raw = await rig.evaluate((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value;
    return el.textContent ?? '';
  });
  const match = raw.match(/-?\d+/);
  expect(match, `rig counter text: ${raw}`).not.toBeNull();
  return Number(match?.[0]);
}

test('always-win red bet returns 2x total only after test mode is applied', async ({ page }) => {
  await expect(page.getByTestId('balance')).toContainText(/10,?000/);

  await applyTestMode(page, { winLoss: 'always-win' });
  await page.getByTestId('close-dev').click();
  await expect(page.getByTestId('test-mode-banner')).toBeVisible();

  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');
  await confirmGamble(page);

  await expect(page.getByTestId('result-title')).toContainText(/YOU WIN/i, { timeout: 15_000 });
  await expect(page.getByTestId('balance')).toContainText(/10,?100/);
});

test('VIP does not turn an always-loss spin into a win', async ({ page }) => {
  await expect(page.getByTestId('balance')).toContainText(/10,?000/);
  await turnOn(page.getByTestId('vip-toggle'));

  await applyTestMode(page, { winLoss: 'always-loss' });
  await page.getByTestId('close-dev').click();
  await expect(page.getByTestId('test-mode-banner')).toBeVisible();

  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');
  await confirmGamble(page);

  const title = page.getByTestId('result-title');
  await expect(title).toContainText(/HOUSE WINS/i, { timeout: 15_000 });
  await expect(title).not.toContainText(/YOU WIN/i);
  await expect(page.getByTestId('balance')).toContainText(/9,?900/);
});

test('number bet advertises a 5x total return', async ({ page }) => {
  await page.getByTestId('bet-number').click();
  await chooseStraightNumber(page, '17');
  await page.getByTestId('bet-amount').fill('100');

  await expect(page.getByTestId('payout-preview')).toContainText(/PAYS\s*\$?\s*500/i);
});

test('adjacent rig misses a number bet and increments the rig counter', async ({ page }) => {
  await applyTestMode(page, { adjacent: true });
  const before = await readRigCounter(page);
  await page.getByTestId('close-dev').click();

  await page.getByTestId('bet-number').click();
  await chooseStraightNumber(page, '17');
  await page.getByTestId('bet-amount').fill('100');
  await confirmGamble(page);

  await expect(page.getByTestId('result-title')).toContainText(/HOUSE WINS/i, { timeout: 15_000 });
  await expect(page.getByTestId('balance')).toContainText(/9,?900/);

  const after = await readRigCounter(page);
  expect(after).toBeGreaterThan(before);
});
