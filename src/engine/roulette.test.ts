import { describe, expect, it } from 'vitest';
import type { BetKind, TestConfig } from '../types';
import {
  DEFAULT_TEST_CONFIG,
  RED_NUMBERS,
  WHEEL_ORDER,
  colorOf,
  resolveRound,
  validateWager,
  wheelNeighbors,
} from './roulette';

const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

function asList(value: readonly number[] | Set<number>): number[] {
  return Array.from(value);
}

function scriptedRng(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;
    index += 1;
    return value;
  };
}

/** A draw in [0, 1) that becomes pocket `n` for both `floor(r * 37)` and a wheel-index read of 0. */
function drawPocket(n: number): number {
  return (n + 0.5) / 37;
}

function config(overrides: Partial<TestConfig> = {}): TestConfig {
  return { ...DEFAULT_TEST_CONFIG, ...overrides };
}

function settle(options: {
  kind?: BetKind;
  number?: number;
  amount?: number;
  vip?: boolean;
  testConfig?: TestConfig;
  rng?: () => number;
}) {
  return resolveRound({
    bet: {
      kind: options.kind ?? 'red',
      number: options.number ?? 17,
      amount: options.amount ?? 100,
    },
    vip: options.vip ?? false,
    testConfig: options.testConfig ?? config(),
    rng: options.rng ?? scriptedRng([0]),
  });
}

describe('European wheel', () => {
  it('uses pockets 0-36 and derives color from the number', () => {
    expect(asList(RED_NUMBERS).sort((a, b) => a - b)).toEqual(REDS);
    expect(WHEEL_ORDER).toEqual(WHEEL);
    expect(new Set(WHEEL_ORDER).size).toBe(37);

    expect(colorOf(0)).toBe('green');
    for (const number of REDS) {
      expect(colorOf(number)).toBe('red');
    }
    for (let number = 1; number <= 36; number += 1) {
      const expected = REDS.includes(number) ? 'red' : 'black';
      expect(colorOf(number)).toBe(expected);
    }

    const reds = [];
    const blacks = [];
    const greens = [];
    for (let number = 0; number <= 36; number += 1) {
      const color = colorOf(number);
      if (color === 'red') reds.push(number);
      else if (color === 'black') blacks.push(number);
      else greens.push(number);
    }
    expect(reds).toEqual(REDS);
    expect(greens).toEqual([0]);
    expect(blacks).toHaveLength(18);
    expect(blacks).not.toContain(0);
  });

  it('places 26 and 32 beside 0', () => {
    expect(new Set(wheelNeighbors(0))).toEqual(new Set([26, 32]));
    const index = WHEEL.indexOf(17);
    expect(new Set(wheelNeighbors(17))).toEqual(
      new Set([WHEEL[(index + WHEEL.length - 1) % WHEEL.length], WHEEL[(index + 1) % WHEEL.length]]),
    );
  });
});

describe('validateWager', () => {
  const balance = 1_000_000;

  it('rejects empty, fractional, and non-numeric amounts', () => {
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '', balance })).toEqual({
      ok: false,
      error: 'Enter a wager',
    });
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '1.5', balance })).toEqual({
      ok: false,
      error: 'Whole credits only',
    });
    expect(validateWager({ kind: 'black', number: 17, amountRaw: 'abc', balance })).toEqual({
      ok: false,
      error: 'Whole credits only',
    });
  });

  it('rejects zero, the max, an overdraft, and a pocket outside 0-36', () => {
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '0', balance })).toEqual({
      ok: false,
      error: 'Wager must be at least 1',
    });
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '100001', balance })).toEqual({
      ok: false,
      error: 'Wager cannot exceed 100000',
    });
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '40', balance: 39 })).toEqual({
      ok: false,
      error: 'Not enough credits',
    });
    expect(validateWager({ kind: 'number', number: -1, amountRaw: '10', balance })).toEqual({
      ok: false,
      error: 'Pick a number from 0 to 36',
    });
    expect(validateWager({ kind: 'number', number: 37, amountRaw: '10', balance })).toEqual({
      ok: false,
      error: 'Pick a number from 0 to 36',
    });
  });

  it('previews total return without a bonus', () => {
    expect(validateWager({ kind: 'red', number: 17, amountRaw: '100', balance: 10_000 })).toEqual({
      ok: true,
      amount: 100,
      payoutPreview: 200,
    });
    expect(validateWager({ kind: 'number', number: 17, amountRaw: '100', balance: 10_000 })).toEqual({
      ok: true,
      amount: 100,
      payoutPreview: 500,
    });
    expect(validateWager({ kind: 'black', number: 2, amountRaw: '100000', balance: 100_000 })).toMatchObject({
      ok: true,
      amount: 100_000,
      payoutPreview: 200_000,
    });
  });
});

describe('resolveRound', () => {
  it('is pure for a scripted rng', () => {
    const first = settle({ rng: scriptedRng([0.2, 0.8, 0.1]), testConfig: config({ enabled: false }) });
    const second = settle({ rng: scriptedRng([0.2, 0.8, 0.1]), testConfig: config({ enabled: false }) });
    expect(second).toEqual(first);
    expect(first.winningColor).toBe(colorOf(first.winningNumber));
  });

  it('ignores force, win/loss mode, and house edge when test mode is off', () => {
    const result = settle({
      kind: 'red',
      amount: 100,
      rng: scriptedRng([0]),
      testConfig: config({
        enabled: false,
        forceNumber: 19,
        forceColor: 'red',
        winLossMode: 'always-win',
        adjacentSpot: true,
        bonusRound: true,
        bonusMultiplier: 8,
        houseEdgePercent: 15,
      }),
    });

    expect(result.winningNumber).toBe(0);
    expect(result.winningColor).toBe('green');
    expect(result.won).toBe(false);
    expect(result.forced).toBe(false);
    expect(result.adjacent).toBe(false);
    expect(result.isBonus).toBe(false);
    expect(result.payout).toBe(0);
    expect(result.net).toBe(-100);
    expect(result.presentation).toBe('loss');
  });

  it('pays color wins 2x, number wins 5x, and losses nothing', () => {
    const colorWin = settle({
      kind: 'red',
      amount: 100,
      testConfig: config({ enabled: true, winLossMode: 'always-win' }),
    });
    expect(colorWin.won).toBe(true);
    expect(colorWin.winningColor).toBe('red');
    expect(colorWin.payout).toBe(200);
    expect(colorWin.net).toBe(100);
    expect(colorWin.forced).toBe(true);
    expect(colorWin.presentation).toBe('win');

    const numberWin = settle({
      kind: 'number',
      number: 17,
      amount: 100,
      testConfig: config({ enabled: true, winLossMode: 'always-win' }),
    });
    expect(numberWin.winningNumber).toBe(17);
    expect(numberWin.payout).toBe(500);
    expect(numberWin.net).toBe(400);
    expect(numberWin.presentation).toBe('win');

    const loss = settle({
      kind: 'black',
      amount: 80,
      testConfig: config({ enabled: true, winLossMode: 'always-loss' }),
    });
    expect(loss.won).toBe(false);
    expect(loss.forced).toBe(true);
    expect(loss.payout).toBe(0);
    expect(loss.net).toBe(-80);
    expect(loss.winningColor).not.toBe('black');
    expect(loss.presentation).toBe('loss');
  });

  it('multiplies only a win, and only while test mode and bonus round are on', () => {
    const bonusWin = settle({
      kind: 'red',
      amount: 100,
      testConfig: config({
        enabled: true,
        winLossMode: 'always-win',
        bonusRound: true,
        bonusMultiplier: 4,
      }),
    });
    expect(bonusWin.won).toBe(true);
    expect(bonusWin.isBonus).toBe(true);
    expect(bonusWin.bonusMultiplier).toBe(4);
    expect(bonusWin.payout).toBe(800);
    expect(bonusWin.net).toBe(700);
    expect(bonusWin.presentation).toBe('bonus-win');

    const bonusLoss = settle({
      kind: 'red',
      amount: 100,
      testConfig: config({
        enabled: true,
        winLossMode: 'always-loss',
        bonusRound: true,
        bonusMultiplier: 4,
      }),
    });
    expect(bonusLoss.won).toBe(false);
    expect(bonusLoss.isBonus).toBe(true);
    expect(bonusLoss.payout).toBe(0);
    expect(bonusLoss.net).toBe(-100);
    expect(bonusLoss.presentation).toBe('bonus-loss');

    const bonusIgnored = settle({
      kind: 'red',
      amount: 100,
      rng: scriptedRng([drawPocket(1)]),
      testConfig: config({
        enabled: false,
        bonusRound: true,
        bonusMultiplier: 4,
      }),
    });
    expect(bonusIgnored.won).toBe(true);
    expect(bonusIgnored.isBonus).toBe(false);
    expect(bonusIgnored.payout).toBe(200);
    expect(bonusIgnored.presentation).toBe('win');

    const flaggedOff = settle({
      kind: 'number',
      number: 8,
      amount: 20,
      testConfig: config({
        enabled: true,
        winLossMode: 'always-win',
        bonusRound: false,
        bonusMultiplier: 9,
      }),
    });
    expect(flaggedOff.payout).toBe(100);
    expect(flaggedOff.isBonus).toBe(false);
  });

  it('lets VIP change the win presentation without changing the pocket', () => {
    const shared = {
      kind: 'red' as const,
      amount: 100,
      rng: scriptedRng([drawPocket(1)]),
      testConfig: config({ enabled: false, winLossMode: 'always-win', forceNumber: 4 }),
    };
    const plain = settle({ ...shared, vip: false });
    const vip = settle({ ...shared, vip: true });

    expect(plain.won).toBe(true);
    expect(vip.winningNumber).toBe(plain.winningNumber);
    expect(vip.payout).toBe(plain.payout);
    expect(plain.presentation).toBe('win');
    expect(vip.presentation).toBe('vip-win');

    const vipLoss = settle({
      kind: 'red',
      vip: true,
      rng: scriptedRng([0]),
      testConfig: config({ enabled: false }),
    });
    expect(vipLoss.won).toBe(false);
    expect(vipLoss.winningNumber).toBe(0);
    expect(vipLoss.presentation).toBe('loss');

    const vipBonus = settle({
      kind: 'red',
      amount: 100,
      vip: true,
      testConfig: config({
        enabled: true,
        winLossMode: 'always-win',
        bonusRound: true,
        bonusMultiplier: 3,
      }),
    });
    expect(vipBonus.presentation).toBe('vip-win');
    expect(vipBonus.isBonus).toBe(true);
    expect(vipBonus.payout).toBe(600);
  });

  it('resolves overrides in priority order', () => {
    const adjacent = settle({
      kind: 'number',
      number: 0,
      amount: 50,
      rng: scriptedRng([0]),
      testConfig: config({
        enabled: true,
        adjacentSpot: true,
        winLossMode: 'always-win',
        forceNumber: 0,
        forceColor: 'red',
      }),
    });
    expect(new Set([26, 32]).has(adjacent.winningNumber)).toBe(true);
    expect(adjacent.winningNumber).toBe(wheelNeighbors(0)[0]);
    expect(adjacent.adjacent).toBe(true);
    expect(adjacent.won).toBe(false);
    expect(adjacent.forced).toBe(true);
    expect(adjacent.payout).toBe(0);

    const otherSide = settle({
      kind: 'number',
      number: 0,
      rng: scriptedRng([0.999]),
      testConfig: config({ enabled: true, adjacentSpot: true, winLossMode: 'always-win' }),
    });
    expect(new Set([adjacent.winningNumber, otherSide.winningNumber])).toEqual(new Set([26, 32]));

    const colorNearMissDoesNotApply = settle({
      kind: 'red',
      testConfig: config({ enabled: true, adjacentSpot: true, winLossMode: 'always-win' }),
    });
    expect(colorNearMissDoesNotApply.won).toBe(true);
    expect(colorNearMissDoesNotApply.adjacent).toBe(false);

    const alwaysWinBeatsForce = settle({
      kind: 'red',
      rng: scriptedRng([0]),
      testConfig: config({
        enabled: true,
        winLossMode: 'always-win',
        forceNumber: 0,
        forceColor: 'black',
      }),
    });
    expect(alwaysWinBeatsForce.won).toBe(true);
    expect(alwaysWinBeatsForce.winningColor).toBe('red');
    expect(alwaysWinBeatsForce.forced).toBe(true);

    const alwaysLossBeatsForce = settle({
      kind: 'red',
      testConfig: config({
        enabled: true,
        winLossMode: 'always-loss',
        forceNumber: 1,
        forceColor: 'red',
      }),
    });
    expect(alwaysLossBeatsForce.won).toBe(false);
    expect(alwaysLossBeatsForce.winningNumber).not.toBe(1);

    const forcedNumber = settle({
      kind: 'red',
      rng: scriptedRng([0]),
      testConfig: config({
        enabled: true,
        winLossMode: 'normal',
        forceNumber: 17,
        forceColor: 'red',
      }),
    });
    expect(forcedNumber.winningNumber).toBe(17);
    expect(forcedNumber.winningColor).toBe('black');
    expect(forcedNumber.won).toBe(false);
    expect(forcedNumber.forced).toBe(true);
    expect(forcedNumber.adjacent).toBe(false);

    const forcedColor = settle({
      kind: 'black',
      rng: scriptedRng([0]),
      testConfig: config({
        enabled: true,
        winLossMode: 'normal',
        forceNumber: null,
        forceColor: 'red',
      }),
    });
    expect(forcedColor.winningColor).toBe('red');
    expect(forcedColor.won).toBe(false);
    expect(forcedColor.forced).toBe(true);
    expect(RED_NUMBERS.has(forcedColor.winningNumber)).toBe(true);
  });

  it('keeps a fair loss and can replace a fair win when house edge says so', () => {
    const keepLoss = settle({
      kind: 'red',
      amount: 100,
      rng: scriptedRng([0, 0]),
      testConfig: config({
        enabled: true,
        winLossMode: 'normal',
        forceNumber: null,
        forceColor: null,
        adjacentSpot: false,
        houseEdgePercent: 15,
      }),
    });
    expect(keepLoss.winningNumber).toBe(0);
    expect(keepLoss.won).toBe(false);
    expect(keepLoss.forced).toBe(false);
    expect(keepLoss.payout).toBe(0);
    expect(keepLoss.net).toBe(-100);

    const replaceWin = settle({
      kind: 'red',
      amount: 100,
      rng: scriptedRng([drawPocket(1), 0, 0, 0]),
      testConfig: config({
        enabled: true,
        winLossMode: 'normal',
        forceNumber: null,
        forceColor: null,
        adjacentSpot: false,
        houseEdgePercent: 15,
      }),
    });
    expect(replaceWin.won).toBe(false);
    expect(replaceWin.forced).toBe(true);
    expect(replaceWin.payout).toBe(0);
    expect(replaceWin.net).toBe(-100);
    expect(replaceWin.winningColor).not.toBe('red');

    const keepWin = settle({
      kind: 'red',
      amount: 100,
      rng: scriptedRng([drawPocket(1), 0.99]),
      testConfig: config({
        enabled: true,
        winLossMode: 'normal',
        forceNumber: null,
        forceColor: null,
        houseEdgePercent: 15,
      }),
    });
    expect(keepWin.won).toBe(true);
    expect(keepWin.forced).toBe(false);
    expect(keepWin.winningColor).toBe('red');
    expect(keepWin.payout).toBe(200);
    expect(keepWin.net).toBe(100);
  });
});
