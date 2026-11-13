/** @vitest-environment jsdom */
import '../test/setup';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameProvider, useGame } from '../context/GameContext';
import { DEFAULT_TEST_CONFIG } from '../engine/roulette';
import type { PendingRound, RoundResult } from '../types';

const KEY = 'casino-demon:v1';

function installMemoryStorage() {
  const memory = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.has(key) ? (memory.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(String(key), String(value));
    },
  };
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  return storage;
}

function readSaved(): Record<string, unknown> | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as Record<string, unknown>;
}

function seed(partial: Record<string, unknown>) {
  const payload = {
    version: 1,
    balance: 10000,
    vip: false,
    history: [] as RoundResult[],
    testConfig: DEFAULT_TEST_CONFIG,
    rigCount: 0,
    devAuthenticated: false,
    pending: null as PendingRound | null,
    ...partial,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

function settledRound(id: string): RoundResult {
  return {
    id,
    winningNumber: 2,
    winningColor: 'black',
    won: false,
    payout: 0,
    net: -1,
    isBonus: false,
    bonusMultiplier: 1,
    forced: false,
    adjacent: false,
    presentation: 'loss',
    kind: 'red',
    betNumber: null,
    amount: 1,
    timestamp: 1,
  };
}

function pendingWin(payoutApplied: boolean): PendingRound {
  return {
    id: 'pending-1',
    amount: 100,
    kind: 'red',
    betNumber: null,
    payoutApplied,
    resolved: {
      winningNumber: 1,
      winningColor: 'red',
      won: true,
      payout: 200,
      net: 100,
      isBonus: false,
      bonusMultiplier: 1,
      forced: false,
      adjacent: false,
      presentation: 'win',
    },
  };
}

function Probe() {
  const game = useGame();
  return createElement(
    'div',
    null,
    createElement('span', { 'data-testid': 'balance' }, String(game.balance)),
    createElement('span', { 'data-testid': 'phase' }, game.phase),
    createElement('span', { 'data-testid': 'history' }, String(game.history.length)),
    createElement('span', { 'data-testid': 'payout' }, game.result ? String(game.result.payout) : ''),
    createElement(
      'button',
      { type: 'button', 'data-testid': 'add-500', onClick: () => game.setLoadAmount('500') },
      'set',
    ),
    createElement(
      'button',
      { type: 'button', 'data-testid': 'load', onClick: () => game.loadBalance() },
      'load',
    ),
    createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'arm',
        onClick: () => {
          game.setSelectionKind('red');
          game.setSelectionAmount('100');
        },
      },
      'arm',
    ),
    createElement(
      'button',
      { type: 'button', 'data-testid': 'request', onClick: () => game.requestGamble() },
      'request',
    ),
    createElement(
      'button',
      { type: 'button', 'data-testid': 'confirm', onClick: () => game.confirmGamble() },
      'confirm',
    ),
    createElement(
      'button',
      { type: 'button', 'data-testid': 'complete', onClick: () => game.completeSpin() },
      'complete',
    ),
  );
}

function renderGame() {
  return render(createElement(GameProvider, null, createElement(Probe)));
}

function balanceText(): string {
  return screen.getByTestId('balance').textContent ?? '';
}

beforeEach(() => {
  installMemoryStorage();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('local persistence', () => {
  it('starts at 10000 and persists version 1 without a password', () => {
    renderGame();
    expect(balanceText()).toBe('10000');
    const saved = readSaved();
    expect(saved?.version).toBe(1);
    expect(saved?.balance).toBe(10000);
    expect(saved).not.toHaveProperty('password');
    expect(localStorage.getItem(KEY)).toBeTruthy();
  });

  it('recovers from malformed JSON and a wrong version', () => {
    localStorage.setItem(KEY, '{not json');
    const broken = renderGame();
    expect(balanceText()).toBe('10000');
    broken.unmount();

    localStorage.setItem(KEY, JSON.stringify({ version: 2, balance: 50 }));
    renderGame();
    expect(balanceText()).toBe('10000');
  });

  it('reloads a saved balance', () => {
    const first = renderGame();
    fireEvent.click(screen.getByTestId('add-500'));
    fireEvent.click(screen.getByTestId('load'));
    expect(balanceText()).toBe('10500');
    expect(readSaved()?.balance).toBe(10500);
    first.unmount();

    renderGame();
    expect(balanceText()).toBe('10500');
  });

  it('settles an unpaid pending round once on hydrate', async () => {
    seed({ balance: 9900, pending: pendingWin(false) });
    renderGame();
    await waitFor(() => {
      expect(balanceText()).toBe('10100');
    });
    expect(screen.getByTestId('phase').textContent).toBe('result');
    expect(screen.getByTestId('payout').textContent).toBe('200');
    expect(screen.getByTestId('history').textContent).toBe('1');
    expect(readSaved()?.balance).toBe(10100);
    expect(readSaved()?.pending).toBeNull();
  });

  it('does not pay a pending round that was already settled', async () => {
    seed({ balance: 10100, pending: pendingWin(true) });
    renderGame();
    await waitFor(() => {
      expect(readSaved()).toBeTruthy();
    });
    expect(balanceText()).toBe('10100');
    expect(screen.getByTestId('history').textContent).toBe('0');
  });

  it('keeps at most 40 history entries after another settled round', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seed({
      history: Array.from({ length: 40 }, (_, index) => settledRound(`old-${index}`)),
    });
    renderGame();
    expect(screen.getByTestId('history').textContent).toBe('40');

    fireEvent.click(screen.getByTestId('arm'));
    fireEvent.click(screen.getByTestId('request'));
    fireEvent.click(screen.getByTestId('confirm'));
    fireEvent.click(screen.getByTestId('complete'));

    expect(screen.getByTestId('history').textContent).toBe('40');
    expect(balanceText()).toBe('9900');
  });

  it('swallows storage write failures', () => {
    const storage = installMemoryStorage();
    storage.setItem = () => {
      throw new Error('quota');
    };
    expect(() => renderGame()).not.toThrow();
    expect(balanceText()).toBe('10000');
  });
});
