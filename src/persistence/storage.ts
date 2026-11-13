import { BALANCE_CAP, HISTORY_LIMIT, STARTING_BALANCE, STORAGE_KEY } from '../constants/game';
import {
  DEFAULT_TEST_CONFIG,
  colorOf,
  createId,
  isPocket,
  sanitizeTestConfig,
} from '../engine/roulette';
import type {
  BetKind,
  PendingRound,
  PersistedState,
  Presentation,
  ResolvedRound,
  RoundResult,
  TestConfig,
} from '../types';

const PRESENTATIONS = new Set<Presentation>(['win', 'loss', 'vip-win', 'bonus-win', 'bonus-loss']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isKind(value: unknown): value is BetKind {
  return value === 'red' || value === 'black' || value === 'number';
}

export function defaultPersistedState(): PersistedState {
  return {
    version: 1,
    balance: STARTING_BALANCE,
    vip: false,
    history: [],
    testConfig: sanitizeTestConfig(DEFAULT_TEST_CONFIG),
    rigCount: 0,
    devAuthenticated: false,
    pending: null,
  };
}

function normalizeBalance(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return STARTING_BALANCE;
  return Math.max(0, Math.trunc(value));
}

function normalizeRigCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function normalizeResolved(value: unknown): ResolvedRound | null {
  if (!isRecord(value) || !isPocket(value.winningNumber)) return null;
  if (typeof value.won !== 'boolean') return null;
  if (typeof value.payout !== 'number' || !Number.isFinite(value.payout)) return null;
  if (typeof value.net !== 'number' || !Number.isFinite(value.net)) return null;
  if (typeof value.isBonus !== 'boolean') return null;
  if (typeof value.bonusMultiplier !== 'number' || !Number.isFinite(value.bonusMultiplier)) return null;
  if (typeof value.forced !== 'boolean' || typeof value.adjacent !== 'boolean') return null;
  if (typeof value.presentation !== 'string' || !PRESENTATIONS.has(value.presentation as Presentation)) {
    return null;
  }

  return {
    winningNumber: value.winningNumber,
    winningColor: colorOf(value.winningNumber),
    won: value.won,
    payout: value.payout,
    net: value.net,
    isBonus: value.isBonus,
    bonusMultiplier: value.bonusMultiplier,
    forced: value.forced,
    adjacent: value.adjacent,
    presentation: value.presentation as Presentation,
  };
}

function normalizeRound(value: unknown): RoundResult | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.startsWith('preview-')) return null;
  if (!isKind(value.kind)) return null;
  if (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0) return null;
  if (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) return null;

  let betNumber: number | null = null;
  if (value.betNumber !== null && value.betNumber !== undefined) {
    if (!isPocket(value.betNumber)) return null;
    betNumber = value.betNumber;
  }
  if (value.kind === 'number' && betNumber === null) return null;

  const resolved = normalizeResolved(value);
  if (!resolved) return null;

  return {
    ...resolved,
    id: value.id,
    kind: value.kind,
    betNumber,
    amount: value.amount,
    timestamp: value.timestamp,
  };
}

function normalizeHistory(value: unknown): RoundResult[] {
  if (!Array.isArray(value)) return [];
  const rounds: RoundResult[] = [];
  for (const entry of value) {
    const round = normalizeRound(entry);
    if (!round) continue;
    if (rounds.some((existing) => existing.id === round.id)) continue;
    rounds.push(round);
  }
  return rounds.slice(-HISTORY_LIMIT);
}

function normalizePending(value: unknown): PendingRound | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isKind(value.kind)) return null;
  if (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0) return null;

  const resolved = normalizeResolved(value.resolved);
  if (!resolved) return null;

  let betNumber: number | null = null;
  if (value.kind === 'number') {
    if (!isPocket(value.betNumber)) return null;
    betNumber = value.betNumber;
  } else if (value.betNumber !== null && value.betNumber !== undefined && isPocket(value.betNumber)) {
    betNumber = value.betNumber;
  }

  const id = typeof value.id === 'string' && value.id.length > 0 ? value.id : createId();
  return {
    id,
    amount: value.amount,
    kind: value.kind,
    betNumber,
    resolved,
    payoutApplied: value.payoutApplied === true,
    source: value.source === 'boss' ? 'boss' : undefined,
  };
}

function normalizeTestConfig(value: unknown): TestConfig {
  if (!isRecord(value)) return sanitizeTestConfig(DEFAULT_TEST_CONFIG);
  const patch: Partial<TestConfig> = {};
  if (typeof value.enabled === 'boolean') patch.enabled = value.enabled;
  if (typeof value.bonusRound === 'boolean') patch.bonusRound = value.bonusRound;
  if (typeof value.adjacentSpot === 'boolean') patch.adjacentSpot = value.adjacentSpot;
  if (value.winLossMode === 'normal' || value.winLossMode === 'always-win' || value.winLossMode === 'always-loss') {
    patch.winLossMode = value.winLossMode;
  }
  if (typeof value.bonusMultiplier === 'number') patch.bonusMultiplier = value.bonusMultiplier;
  if (typeof value.houseEdgePercent === 'number') patch.houseEdgePercent = value.houseEdgePercent;
  if (value.forceNumber === null || typeof value.forceNumber === 'number') {
    patch.forceNumber = value.forceNumber as number | null;
  }
  if (value.forceColor === null || value.forceColor === 'red' || value.forceColor === 'black') {
    patch.forceColor = value.forceColor;
  }
  return sanitizeTestConfig(DEFAULT_TEST_CONFIG, patch);
}

function normalizePersisted(value: unknown): PersistedState {
  if (!isRecord(value) || value.version !== 1) return defaultPersistedState();
  return {
    version: 1,
    balance: Math.min(normalizeBalance(value.balance), Number.MAX_SAFE_INTEGER),
    vip: value.vip === true,
    history: normalizeHistory(value.history),
    testConfig: normalizeTestConfig(value.testConfig),
    rigCount: normalizeRigCount(value.rigCount),
    devAuthenticated: value.devAuthenticated === true,
    pending: normalizePending(value.pending),
  };
}

export function loadState(): PersistedState {
  try {
    if (typeof localStorage === 'undefined') return defaultPersistedState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw.trim() === '') return defaultPersistedState();
    return normalizePersisted(JSON.parse(raw) as unknown);
  } catch {
    return defaultPersistedState();
  }
}

export function saveState(state: PersistedState): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const payload: PersistedState = {
      version: 1,
      balance: state.balance,
      vip: state.vip,
      history: state.history.filter((round) => !round.id.startsWith('preview-')).slice(-HISTORY_LIMIT),
      testConfig: sanitizeTestConfig(state.testConfig),
      rigCount: Math.max(0, Math.trunc(state.rigCount)),
      devAuthenticated: state.devAuthenticated,
      pending: state.pending,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return null;
  } catch {
    return 'Could not save progress on this device.';
  }
}

export function persistedBalanceRoom(balance: number): number {
  return Math.max(0, BALANCE_CAP - balance);
}
