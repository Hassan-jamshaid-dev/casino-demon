import { expect, test, type Page } from '@playwright/test';

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

test('shows the fictional-credit disclaimer and a 10000 balance', async ({ page }) => {
  await expect(page.getByTestId('fictional-disclaimer')).toBeVisible();
  expect(await balanceDigits(page)).toBe('10000');
});

test('does not gamble when the amount is empty', async ({ page }) => {
  await page.getByTestId('gamble').click();
  await expect(page.getByTestId('error')).toHaveText(/Enter a wager/i);
  await expect(page.getByTestId('phase')).toHaveText('betting');
  expect(await balanceDigits(page)).toBe('10000');
});

test('does not wager more than the balance', async ({ page }) => {
  await page.getByTestId('bet-amount').fill('10001');
  await page.getByTestId('gamble').click();
  await expect(page.getByTestId('error')).toHaveText(/Not enough credits/i);
  await expect(page.getByTestId('phase')).toHaveText('betting');
  expect(await balanceDigits(page)).toBe('10000');
  await expect(page.getByTestId('confirm-gamble')).toHaveCount(0);
});

test('plays a fair red bet and settles 9900 or 10100 to match the result', async ({ page }) => {
  await page.getByTestId('bet-red').click();
  await page.getByTestId('bet-amount').fill('100');
  await page.getByTestId('gamble').click();
  await expect(page.getByTestId('phase')).toHaveText('confirming');
  await page.getByTestId('confirm-gamble').click();
  await expect(page.getByTestId('phase')).toHaveText('spinning');
  await expect(page.getByTestId('phase')).toHaveText('result');

  const title = await page.getByTestId('result-title').innerText();
  const balance = await balanceDigits(page);
  if (/YOU WIN/i.test(title)) {
    expect(balance).toBe('10100');
  } else {
    expect(title).toMatch(/HOUSE WINS/i);
    expect(balance).toBe('9900');
  }
});

test('previews a number bet as a 5x total return', async ({ page }) => {
  await page.getByTestId('bet-number').click();
  await page.getByTestId('bet-amount').fill('100');
  await expect(page.getByTestId('payout-preview')).toContainText(/PAYS\s*500/i);
});
