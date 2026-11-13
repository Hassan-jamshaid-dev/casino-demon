import type {
  BetKind,
  Presentation,
  ResolvedRound,
  RouletteColor,
  TestConfig,
  WinLossMode,
} from '../types';

export type { BetKind, TestConfig };

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

/** Clockwise European wheel, starting at 0. */
export const WHEEL_ORDER: readonly number[] = Object.freeze([
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]);

const BLACK_NUMBERS: readonly number[] = Object.freeze(
  Array.from({ length: 36 }, (_, index) => index + 1).filter((number) => !RED_NUMBERS.has(number)),
);

export const DEFAULT_TEST_CONFIG: TestConfig = Object.freeze({
  enabled: false,
  forceColor: null,
  forceNumber: null,
  winLossMode: 'normal',
  bonusRound: false,
  bonusMultiplier: 2,
  adjacentSpot: false,
  houseEdgePercent: 2,
});

const WIN_LOSS_MODES = new Set<WinLossMode>(['normal', 'always-win', 'always-loss']);

export interface ValidateWagerInput {
  kind: BetKind;
  number: number;
  amountRaw: string;
  balance: number;
}

export type ValidateWagerResult =
  | { ok: true; amount: number; payoutPreview: number }
  | { ok: false; error: string };

export interface ResolveRoundInput {
  bet: { kind: BetKind; number: number; amount: number };
  vip: boolean;
  testConfig: TestConfig;
  rng?: () => number;
  /** When set, a win pays this multiple of the stake instead of the normal 5× or 2× table. */
  returnMultiple?: number;
}

function isWinLossMode(value: unknown): value is WinLossMode {
  return typeof value === 'string' && WIN_LOSS_MODES.has(value as WinLossMode);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const truncated = Math.trunc(value);
  if (truncated < min) return min;
  if (truncated > max) return max;
  return truncated;
}

export function isPocket(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 36;
}

export function colorOf(number: number): RouletteColor {
  if (number === 0) return 'green';
  if (RED_NUMBERS.has(number)) return 'red';
  return 'black';
}

export function wheelNeighbors(number: number): [number, number] {
  const index = WHEEL_ORDER.indexOf(number);
  if (index < 0) {
    throw new RangeError(`Number ${number} is not on the wheel`);
  }
  const length = WHEEL_ORDER.length;
  const previous = WHEEL_ORDER[(index - 1 + length) % length] ?? 0;
  const next = WHEEL_ORDER[(index + 1) % length] ?? 0;
  return [previous, next];
}

export function numbersOfColor(color: RouletteColor): number[] {
  if (color === 'green') return [0];
  if (color === 'red') return [...RED_NUMBERS];
  return [...BLACK_NUMBERS];
}

export function potentialReturn(kind: BetKind, amount: number): number {
  return kind === 'number' ? amount * 5 : amount * 2;
}

export function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function sanitizeTestConfig(base: TestConfig, patch: Partial<TestConfig> = {}): TestConfig {
  const next: TestConfig = {
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : base.enabled === true,
    winLossMode: isWinLossMode(patch.winLossMode)
      ? patch.winLossMode
      : isWinLossMode(base.winLossMode)
        ? base.winLossMode
        : 'normal',
    bonusRound: typeof patch.bonusRound === 'boolean' ? patch.bonusRound : base.bonusRound === true,
    adjacentSpot:
      typeof patch.adjacentSpot === 'boolean' ? patch.adjacentSpot : base.adjacentSpot === true,
    bonusMultiplier: clampInt(
      'bonusMultiplier' in patch ? patch.bonusMultiplier : base.bonusMultiplier,
      2,
      10,
      2,
    ),
    houseEdgePercent: clampInt(
      'houseEdgePercent' in patch ? patch.houseEdgePercent : base.houseEdgePercent,
      0,
      15,
      0,
    ),
    forceNumber: isPocket(base.forceNumber) ? base.forceNumber : null,
    forceColor: base.forceColor === 'red' || base.forceColor === 'black' ? base.forceColor : null,
  };

  const setsNumber = 'forceNumber' in patch && typeof patch.forceNumber === 'number' && Number.isFinite(patch.forceNumber);
  const setsColor = 'forceColor' in patch && (patch.forceColor === 'red' || patch.forceColor === 'black');

  if (setsNumber) {
    next.forceNumber = clampInt(patch.forceNumber, 0, 36, 0);
    next.forceColor = null;
  } else if (setsColor) {
    next.forceColor = patch.forceColor === 'black' ? 'black' : 'red';
    next.forceNumber = null;
  } else {
    if ('forceNumber' in patch && patch.forceNumber === null) next.forceNumber = null;
    if ('forceColor' in patch && patch.forceColor === null) next.forceColor = null;
  }

  if (next.forceNumber !== null) {
    next.forceNumber = clampInt(next.forceNumber, 0, 36, 0);
    next.forceColor = null;
  } else if (next.forceColor !== 'red' && next.forceColor !== 'black') {
    next.forceColor = null;
  }

  return next;
}

export function validateWager(input: ValidateWagerInput): ValidateWagerResult {
  const raw = input.amountRaw.trim();
  if (!raw) return { ok: false, error: 'Enter a wager' };
  if (!/^\d+$/.test(raw)) return { ok: false, error: 'Whole credits only' };

  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, error: 'Wager must be at least 1' };
  }
  if (amount > 100_000) return { ok: false, error: 'Wager cannot exceed 100000' };
  if (amount > input.balance) return { ok: false, error: 'Not enough credits' };
  if (input.kind === 'number' && !isPocket(input.number)) {
    return { ok: false, error: 'Pick a number from 0 to 36' };
  }

  return { ok: true, amount, payoutPreview: potentialReturn(input.kind, amount) };
}

function rollIndex(length: number, rng: () => number): number {
  if (length <= 1) return 0;
  const raw = rng();
  const unit = Number.isFinite(raw) ? raw : 0;
  const scaled = Math.floor(unit * length);
  if (scaled <= 0) return 0;
  if (scaled >= length) return length - 1;
  return scaled;
}

function pickFrom(items: readonly number[], rng: () => number): number {
  const picked = items[rollIndex(items.length, rng)];
  return picked ?? items[0] ?? 0;
}

function fairPocket(rng: () => number): number {
  return rollIndex(37, rng);
}

function pocketWins(bet: { kind: BetKind; number: number }, pocket: number): boolean {
  if (bet.kind === 'number') return pocket === bet.number;
  return colorOf(pocket) === bet.kind;
}

function losingPockets(bet: { kind: BetKind; number: number }): number[] {
  const losers: number[] = [];
  for (let pocket = 0; pocket <= 36; pocket += 1) {
    if (!pocketWins(bet, pocket)) losers.push(pocket);
  }
  return losers;
}

function presentationFor(won: boolean, vip: boolean, isBonus: boolean): Presentation {
  if (!won) return isBonus ? 'bonus-loss' : 'loss';
  if (vip) return 'vip-win';
  if (isBonus) return 'bonus-win';
  return 'win';
}

function decideTestPocket(
  bet: { kind: BetKind; number: number },
  config: TestConfig,
  rng: () => number,
): { winningNumber: number; forced: boolean; adjacent: boolean } {
  if (config.adjacentSpot && bet.kind === 'number' && isPocket(bet.number)) {
    return {
      winningNumber: pickFrom(wheelNeighbors(bet.number), rng),
      forced: true,
      adjacent: true,
    };
  }

  if (config.winLossMode === 'always-win') {
    const winningNumber =
      bet.kind === 'number' && isPocket(bet.number)
        ? bet.number
        : pickFrom(numbersOfColor(bet.kind === 'black' ? 'black' : 'red'), rng);
    return { winningNumber, forced: true, adjacent: false };
  }

  if (config.winLossMode === 'always-loss') {
    return { winningNumber: pickFrom(losingPockets(bet), rng), forced: true, adjacent: false };
  }

  if (config.forceNumber !== null && isPocket(config.forceNumber)) {
    return { winningNumber: config.forceNumber, forced: true, adjacent: false };
  }

  if (config.forceColor === 'red' || config.forceColor === 'black') {
    return {
      winningNumber: pickFrom(numbersOfColor(config.forceColor), rng),
      forced: true,
      adjacent: false,
    };
  }

  const fair = fairPocket(rng);
  if (config.houseEdgePercent > 0 && pocketWins(bet, fair) && rng() < config.houseEdgePercent / 100) {
    return { winningNumber: pickFrom(losingPockets(bet), rng), forced: true, adjacent: false };
  }

  return { winningNumber: fair, forced: false, adjacent: false };
}

export function resolveRound(input: ResolveRoundInput): ResolvedRound {
  const rng = input.rng ?? Math.random;
  const config = sanitizeTestConfig(input.testConfig);
  const bet = input.bet;

  let winningNumber: number;
  let forced = false;
  let adjacent = false;

  if (!config.enabled) {
    winningNumber = fairPocket(rng);
  } else {
    const decision = decideTestPocket(bet, config, rng);
    winningNumber = decision.winningNumber;
    forced = decision.forced;
    adjacent = decision.adjacent;
  }

  const winningColor = colorOf(winningNumber);
  const won = pocketWins(bet, winningNumber);
  const isBonus = config.enabled && config.bonusRound;
  const bonusMultiplier = isBonus ? config.bonusMultiplier : 1;
  const tableReturn =
    typeof input.returnMultiple === 'number' && Number.isFinite(input.returnMultiple)
      ? bet.amount * input.returnMultiple
      : potentialReturn(bet.kind, bet.amount);
  const payout = won ? tableReturn * bonusMultiplier : 0;

  return {
    winningNumber,
    winningColor,
    won,
    payout,
    net: payout - bet.amount,
    isBonus,
    bonusMultiplier,
    forced,
    adjacent,
    presentation: presentationFor(won, input.vip, isBonus),
  };
}
