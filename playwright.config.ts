import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

function resolveBaseURL(): string {
  const fromEnv = process.env.BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const file = path.join(process.cwd(), 'DEV_SERVER.txt');
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8');
    const match = text.match(/https?:\/\/[^\s]+/i);
    if (match?.[0]) return match[0].replace(/\/+$/, '');
  }

  return 'http://127.0.0.1:5173';
}

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: resolveBaseURL(),
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
