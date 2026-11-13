import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEMO_DEV_PASSWORD, DEMO_DEV_USERNAME } from '../constants/auth';
import {
  BALANCE_CAP,
  DEFAULT_BET_SELECTION,
  HISTORY_LIMIT,
  MAX_LOAD,
  STARTING_BALANCE,
} from '../constants/game';
import {
  DEFAULT_TEST_CONFIG,
  colorOf,
  createId,
  potentialReturn,
  resolveRound,
  sanitizeTestConfig,
  validateWager,
  wheelNeighbors,
} from '../engine/roulette';
import { loadState, saveState } from '../persistence/storage';
import type {
  BetKind,
  BetSelection,
  PendingRound,
  PersistedState,
  Presentation,
  RoundPhase,
  RoundResult,
  Screen,
  TestConfig,
  TickerEntry,
} from '../types';

const DEMO_TICKER: TickerEntry[] = [
  { id: 'demo-17', label: '17 BLACK', demo: true },
  { id: 'demo-32', label: '32 RED', demo: true },
  { id: 'demo-0', label: '0 GREEN', demo: true },
  { id: 'demo-19', label: '19 RED', demo: true },
  { id: 'demo-26', label: '26 BLACK', demo: true },
  { id: 'demo-3', label: '3 RED', demo: true },
  { id: 'demo-15', label: '15 BLACK', demo: true },
  { id: 'demo-21', label: '21 RED', demo: true },
];

interface GameState {
  balance: number;
  vip: boolean;
  phase: RoundPhase;
  screen: Screen;
  selection: BetSelection;
  loadAmount: string;
  pending: PendingRound | null;
  result: RoundResult | null;
  history: RoundResult[];
  testConfig: TestConfig;
  testDraft: TestConfig;
  rigCount: number;
  devAuthenticated: boolean;
  error: string | null;
  notice: string | null;
  isPreview: boolean;
  bossPhase: RoundPhase;
  bossPending: PendingRound | null;
  bossRound: RoundResult | null;
  bossNumber: number;
  bossAmount: string;
}

type PreviewKind = 'win' | 'loss' | 'vip-win' | 'bonus';

interface GameApi extends GameState {
  demoTicker: TickerEntry[];
  playerBonus: number;
  openScreen: (next?: Screen) => void;
  reducedMotion: boolean;
  setSelectionKind: (kind: BetKind) => void;
  setSelectionNumber: (number: number) => void;
  setSelectionAmount: (raw: string) => void;
  setLoadAmount: (raw: string) => void;
  loadBalance: () => void;
  toggleVip: () => void;
  requestGamble: () => void;
  cancelConfirm: () => void;
  confirmGamble: () => void;
  completeSpin: () => void;
  nextRound: () => void;
  openDevLogin: () => void;
  openDevDashboard: () => void;
  backToContestant: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateTestDraft: (patch: Partial<TestConfig>) => void;
  applyTestDraft: () => void;
  resetTestConfig: () => void;
  resetAccount: () => void;
  previewPresentation: (kind: PreviewKind) => void;
  clearPreview: () => void;
  clearError: () => void;
  clearNotice: () => void;
  setBossNumber: (number: number) => void;
  setBossAmount: (raw: string) => void;
  requestBossGamble: () => void;
  confirmBossGamble: () => void;
  cancelBossGamble: () => void;
  completeBossSpin: () => void;
  nextBossRound: () => void;
}

const GameContext = createContext<GameApi | null>(null);

/** Survives StrictMode replays. A new provider gets this same set, keyed by pending id. */
const settledPendingIdentities = new Set<string>();

function digitsOnly(raw: string, maxDigits: number): string {
  return String(raw).replace(/\D/g, '').slice(0, maxDigits);
}

export const BOSS_MIN_WAGER = 10_000;
export const BOSS_PAYOUT_MULTIPLE = 10;

function validateBossWager(
  amountRaw: string,
  pocket: number,
  balance: number,
): { ok: true; amount: number } | { ok: false; error: string } {
  if (balance < BOSS_MIN_WAGER) {
    return { ok: false, error: 'You need 10000 fictional credits to enter.' };
  }
  if (!Number.isInteger(pocket) || pocket < 0 || pocket > 36) {
    return { ok: false, error: 'Pick a number from 0 to 36' };
  }
  const raw = amountRaw.trim();
  if (!/^\d+$/.test(raw)) {
    return { ok: false, error: 'Minimum wager is 10000 fictional credits.' };
  }
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount < BOSS_MIN_WAGER) {
    return { ok: false, error: 'Minimum wager is 10000 fictional credits.' };
  }
  if (amount > balance) {
    return { ok: false, error: 'Not enough credits' };
  }
  return { ok: true, amount };
}

function clampPocket(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(36, Math.max(0, Math.trunc(value)));
}

function copySelection(selection: BetSelection = DEFAULT_BET_SELECTION): BetSelection {
  return { kind: selection.kind, number: selection.number, amount: selection.amount };
}

function pendingIdentity(pending: PendingRound): string {
  return `${pending.id}|${pending.resolved.winningNumber}|${pending.amount}`;
}

function roundFromPending(pending: PendingRound, timestamp = Date.now()): RoundResult {
  return {
    ...pending.resolved,
    id: pending.id,
    kind: pending.kind,
    betNumber: pending.betNumber,
    amount: pending.amount,
    timestamp,
  };
}

function appendHistory(history: RoundResult[], entry: RoundResult): RoundResult[] {
  if (entry.id.startsWith('preview-')) return history;
  if (history.some((round) => round.id === entry.id)) return history;
  return [...history, entry].slice(-HISTORY_LIMIT);
}

function toPersisted(state: GameState): PersistedState {
  return {
    version: 1,
    balance: state.balance,
    vip: state.vip,
    history: state.history.filter((round) => !round.id.startsWith('preview-')).slice(-HISTORY_LIMIT),
    testConfig: sanitizeTestConfig(state.testConfig),
    rigCount: state.rigCount,
    devAuthenticated: state.devAuthenticated,
    pending: state.pending ?? state.bossPending,
  };
}

function absorbPending(
  loaded: PersistedState,
  identities: Set<string>,
): { persisted: PersistedState; result: RoundResult | null; phase: RoundPhase; changed: boolean } {
  const pending = loaded.pending;
  if (!pending) {
    return { persisted: loaded, result: null, phase: 'betting', changed: false };
  }

  const identity = pendingIdentity(pending);
  const recorded = loaded.history.find((round) => round.id === pending.id) ?? null;
  const bossRound = pending.source === 'boss';
  if (pending.payoutApplied || recorded) {
    identities.add(identity);
    return {
      persisted: { ...loaded, pending: null },
      result: bossRound ? null : recorded,
      phase: bossRound ? 'betting' : 'result',
      changed: true,
    };
  }

  identities.add(identity);
  const result = roundFromPending(pending);
  return {
    persisted: {
      ...loaded,
      balance: loaded.balance + pending.resolved.payout,
      history: appendHistory(loaded.history, result),
      rigCount: pending.resolved.forced ? loaded.rigCount + 1 : loaded.rigCount,
      pending: null,
    },
    result: bossRound ? null : result,
    phase: bossRound ? 'betting' : 'result',
    changed: true,
  };
}

function gameFromPersisted(
  persisted: PersistedState,
  result: RoundResult | null,
  phase: RoundPhase,
): GameState {
  return {
    balance: persisted.balance,
    vip: persisted.vip,
    phase,
    screen: 'menu',
    selection: copySelection(),
    loadAmount: '',
    pending: persisted.pending,
    result,
    history: persisted.history,
    testConfig: sanitizeTestConfig(persisted.testConfig),
    testDraft: sanitizeTestConfig(persisted.testConfig),
    rigCount: persisted.rigCount,
    devAuthenticated: persisted.devAuthenticated,
    error: null,
    notice: null,
    isPreview: false,
    bossPhase: 'betting',
    bossPending: null,
    bossRound: null,
    bossNumber: 0,
    bossAmount: '',
  };
}

function bootstrapGameState(): GameState {
  const loaded = loadState();
  const absorbed = absorbPending(loaded, settledPendingIdentities);
  if (absorbed.changed) saveState(absorbed.persisted);
  return gameFromPersisted(absorbed.persisted, absorbed.result, absorbed.phase);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function previewAmount(selection: BetSelection): number {
  if (selection.kind !== 'number') return 1000;
  if (!/^\d+$/.test(selection.amount)) return 1000;
  const amount = Number(selection.amount);
  if (!Number.isSafeInteger(amount) || amount < 1) return 1000;
  return amount;
}

function buildPreview(kind: PreviewKind, selection: BetSelection, bonusMultiplier: number): RoundResult {
  const colorBet = selection.kind !== 'number';
  const amount = previewAmount(selection);
  const betNumber = selection.kind === 'number' ? clampPocket(selection.number) : null;
  let winningNumber: number;
  if (kind === 'loss') {
    winningNumber = colorBet ? 0 : wheelNeighbors(clampPocket(selection.number))[0];
  } else if (colorBet) {
    winningNumber = selection.kind === 'black' ? 17 : 1;
  } else {
    winningNumber = clampPocket(selection.number);
  }

  const won = kind !== 'loss';
  const isBonus = kind === 'bonus';
  const appliedMultiplier = isBonus ? bonusMultiplier : 1;
  const payout = won ? potentialReturn(selection.kind, amount) * appliedMultiplier : 0;
  const presentation: Presentation =
    kind === 'loss' ? 'loss' : kind === 'vip-win' ? 'vip-win' : kind === 'bonus' ? 'bonus-win' : 'win';

  return {
    id: `preview-${createId()}`,
    kind: selection.kind,
    betNumber,
    amount,
    timestamp: Date.now(),
    winningNumber,
    winningColor: colorOf(winningNumber),
    won,
    payout,
    net: payout - amount,
    isBonus,
    bonusMultiplier: appliedMultiplier,
    forced: false,
    adjacent: false,
    presentation,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(bootstrapGameState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const settledRef = useRef(settledPendingIdentities);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  const commit = useCallback((next: GameState, immediate = false) => {
    stateRef.current = next;
    setState(next);
    if (!immediate) return;
    const failure = saveState(toPersisted(next));
    if (!failure || next.error) return;
    const withError = { ...next, error: failure };
    stateRef.current = withError;
    setState(withError);
  }, []);

  const settlePending = useCallback(
    (current: GameState): GameState | null => {
      const pending = current.pending;
      if (!pending || pending.payoutApplied) return null;
      const identity = pendingIdentity(pending);
      const recorded = current.history.find((round) => round.id === pending.id) ?? null;
      if (recorded || settledRef.current.has(identity)) {
        settledRef.current.add(identity);
        return {
          ...current,
          pending: null,
          phase: 'result',
          result: recorded ?? current.result,
          isPreview: false,
        };
      }

      settledRef.current.add(identity);
      const result = roundFromPending(pending);
      return {
        ...current,
        balance: current.balance + pending.resolved.payout,
        history: appendHistory(current.history, result),
        rigCount: pending.resolved.forced ? current.rigCount + 1 : current.rigCount,
        pending: null,
        result,
        phase: 'result',
        isPreview: false,
      };
    },
    [],
  );

  useEffect(() => {
    const settled = settlePending(stateRef.current);
    if (settled) commit(settled, true);
  }, [commit, settlePending]);

  useEffect(() => {
    const failure = saveState(toPersisted(stateRef.current));
    if (!failure) return;
    setState((current) => {
      if (current.error) return current;
      const withError = { ...current, error: failure };
      stateRef.current = withError;
      return withError;
    });
  }, [
    state.balance,
    state.vip,
    state.history,
    state.testConfig,
    state.rigCount,
    state.devAuthenticated,
    state.pending,
    state.bossPending,
  ]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const setSelectionKind = useCallback((kind: BetKind) => {
    const current = stateRef.current;
    commit({ ...current, selection: { ...current.selection, kind } });
  }, [commit]);

  const setSelectionNumber = useCallback((number: number) => {
    const current = stateRef.current;
    commit({ ...current, selection: { ...current.selection, number: clampPocket(number) } });
  }, [commit]);

  const setSelectionAmount = useCallback((raw: string) => {
    const current = stateRef.current;
    commit({ ...current, selection: { ...current.selection, amount: digitsOnly(raw, 7) } });
  }, [commit]);

  const setLoadAmount = useCallback((raw: string) => {
    commit({ ...stateRef.current, loadAmount: digitsOnly(raw, 7) });
  }, [commit]);

  const loadBalance = useCallback(() => {
    const current = stateRef.current;
    const raw = current.loadAmount.trim();
    if (!raw) {
      commit({ ...current, error: 'Enter credits to load' });
      return;
    }
    if (!/^\d+$/.test(raw)) {
      commit({ ...current, error: 'Whole credits only' });
      return;
    }
    const amount = Number(raw);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      commit({ ...current, error: 'Load at least 1 credit' });
      return;
    }
    if (amount > MAX_LOAD) {
      commit({ ...current, error: 'Cannot load more than 1000000 at once' });
      return;
    }
    if (current.balance >= BALANCE_CAP) {
      commit({ ...current, error: 'Balance is already at the cap' });
      return;
    }
    const added = Math.min(amount, BALANCE_CAP - current.balance);
    commit({
      ...current,
      balance: current.balance + added,
      error: null,
      notice: `Loaded ${added} fictional credits.`,
    });
  }, [commit]);

  const toggleVip = useCallback(() => {
    const current = stateRef.current;
    commit({ ...current, vip: !current.vip });
  }, [commit]);

  const requestGamble = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== 'betting' || current.pending) return;
    const validation = validateWager({
      kind: current.selection.kind,
      number: current.selection.number,
      amountRaw: current.selection.amount,
      balance: current.balance,
    });
    if (!validation.ok) {
      commit({ ...current, error: validation.error });
      return;
    }
    commit({ ...current, phase: 'confirming', error: null });
  }, [commit]);

  const cancelConfirm = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== 'confirming') return;
    commit({ ...current, phase: 'betting', error: null });
  }, [commit]);

  const confirmGamble = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== 'confirming' || current.pending) return;
    const validation = validateWager({
      kind: current.selection.kind,
      number: current.selection.number,
      amountRaw: current.selection.amount,
      balance: current.balance,
    });
    if (!validation.ok) {
      commit({ ...current, error: validation.error });
      return;
    }

    const resolved = resolveRound({
      bet: {
        kind: current.selection.kind,
        number: current.selection.number,
        amount: validation.amount,
      },
      vip: current.vip,
      testConfig: current.testConfig,
    });
    const pending: PendingRound = {
      id: createId(),
      amount: validation.amount,
      kind: current.selection.kind,
      betNumber: current.selection.kind === 'number' ? current.selection.number : null,
      resolved,
      payoutApplied: false,
    };
    commit(
      {
        ...current,
        balance: current.balance - validation.amount,
        pending,
        phase: 'spinning',
        result: null,
        isPreview: false,
        error: null,
      },
      true,
    );
  }, [commit]);

  const completeSpin = useCallback(() => {
    const settled = settlePending(stateRef.current);
    if (!settled) return;
    commit(settled, true);
  }, [commit, settlePending]);

  const nextRound = useCallback(() => {
    const current = stateRef.current;
    commit({
      ...current,
      phase: 'betting',
      result: null,
      error: null,
      isPreview: false,
    });
  }, [commit]);

  const settleBoss = useCallback((current: GameState): GameState => {
    const pending = current.bossPending;
    if (!pending || pending.payoutApplied) {
      return { ...current, bossPending: null };
    }
    const identity = pendingIdentity(pending);
    if (settledRef.current.has(identity)) {
      return { ...current, bossPending: null };
    }
    settledRef.current.add(identity);
    const result = roundFromPending(pending);
    return {
      ...current,
      balance: current.balance + pending.resolved.payout,
      history: appendHistory(current.history, result),
      rigCount: pending.resolved.forced ? current.rigCount + 1 : current.rigCount,
      bossPending: null,
      bossRound: result,
      bossPhase: 'result',
    };
  }, []);

  const leaveBoss = useCallback((current: GameState, screen: Screen): GameState => {
    if (current.screen !== 'boss' || screen === 'boss') return { ...current, screen };
    if (current.bossPhase === 'confirming') {
      return { ...current, screen, bossPhase: 'betting' };
    }
    if (current.bossPending) return { ...settleBoss(current), screen };
    return { ...current, screen };
  }, [settleBoss]);

  const openDevLogin = useCallback(() => {
    commit(leaveBoss(stateRef.current, 'dev-login'));
  }, [commit, leaveBoss]);

  const openDevDashboard = useCallback(() => {
    const current = stateRef.current;
    commit(leaveBoss(current, current.devAuthenticated ? 'dev-dashboard' : 'dev-login'));
  }, [commit, leaveBoss]);

  const backToContestant = useCallback(() => {
    commit(leaveBoss(stateRef.current, 'contestant'));
  }, [commit, leaveBoss]);

  const login = useCallback((username: string, password: string) => {
    const current = stateRef.current;
    if (username !== DEMO_DEV_USERNAME || password !== DEMO_DEV_PASSWORD) {
      commit({ ...current, error: 'Invalid developer credentials' });
      return false;
    }
    commit({
      ...current,
      devAuthenticated: true,
      screen: 'dev-dashboard',
      error: null,
    });
    return true;
  }, [commit]);

  const logout = useCallback(() => {
    const current = leaveBoss(stateRef.current, 'contestant');
    commit({ ...current, devAuthenticated: false });
  }, [commit, leaveBoss]);

  const updateTestDraft = useCallback((patch: Partial<TestConfig>) => {
    const current = stateRef.current;
    commit({ ...current, testDraft: sanitizeTestConfig(current.testDraft, patch) });
  }, [commit]);

  const applyTestDraft = useCallback(() => {
    const current = stateRef.current;
    const applied = sanitizeTestConfig(current.testDraft);
    commit({
      ...current,
      testConfig: applied,
      testDraft: applied,
      notice: applied.enabled
        ? 'Test mode applied. Outcomes are forced and labeled.'
        : 'Settings applied. Test mode is off, so normal play stays fair.',
    });
  }, [commit]);

  const resetTestConfig = useCallback(() => {
    const defaults = sanitizeTestConfig(DEFAULT_TEST_CONFIG);
    commit({
      ...stateRef.current,
      testConfig: defaults,
      testDraft: sanitizeTestConfig(DEFAULT_TEST_CONFIG),
      rigCount: 0,
      notice: 'Test configuration reset.',
    });
  }, [commit]);

  const resetAccount = useCallback(() => {
    const current = stateRef.current;
    commit({
      ...current,
      balance: STARTING_BALANCE,
      vip: false,
      history: [],
      pending: null,
      phase: 'betting',
      result: null,
      isPreview: false,
      selection: copySelection(),
      bossPhase: 'betting',
      bossPending: null,
      bossRound: null,
      bossAmount: '',
      error: null,
      notice: 'Account reset to 10000 fictional credits.',
    });
  }, [commit]);

  const previewPresentation = useCallback((kind: PreviewKind) => {
    const current = stateRef.current;
    if (current.pending) return;
    const multiplier = sanitizeTestConfig(current.testDraft).bonusMultiplier;
    const left = leaveBoss(current, 'contestant');
    commit({
      ...left,
      phase: 'result',
      isPreview: true,
      result: buildPreview(kind, current.selection, multiplier),
    });
  }, [commit, leaveBoss]);

  const clearPreview = useCallback(() => {
    const current = stateRef.current;
    if (!current.isPreview) return;
    commit({ ...current, isPreview: false, result: null, phase: 'betting' });
  }, [commit]);

  const clearError = useCallback(() => {
    const current = stateRef.current;
    if (current.error === null) return;
    commit({ ...current, error: null });
  }, [commit]);

  const clearNotice = useCallback(() => {
    const current = stateRef.current;
    if (current.notice === null) return;
    commit({ ...current, notice: null });
  }, [commit]);

  const setBossNumber = useCallback((number: number) => {
    const current = stateRef.current;
    commit({ ...current, bossNumber: clampPocket(number) });
  }, [commit]);

  const setBossAmount = useCallback((raw: string) => {
    const current = stateRef.current;
    commit({ ...current, bossAmount: digitsOnly(raw, 7) });
  }, [commit]);

  const requestBossGamble = useCallback(() => {
    const current = stateRef.current;
    if (current.bossPhase !== 'betting' || current.bossPending || current.pending) return;
    const validation = validateBossWager(current.bossAmount, current.bossNumber, current.balance);
    if (!validation.ok) {
      commit({ ...current, error: validation.error });
      return;
    }
    commit({ ...current, bossPhase: 'confirming', error: null });
  }, [commit]);

  const cancelBossGamble = useCallback(() => {
    const current = stateRef.current;
    if (current.bossPhase !== 'confirming') return;
    commit({ ...current, bossPhase: 'betting', error: null });
  }, [commit]);

  const confirmBossGamble = useCallback(() => {
    const current = stateRef.current;
    if (current.bossPhase !== 'confirming' || current.bossPending || current.pending) return;
    const validation = validateBossWager(current.bossAmount, current.bossNumber, current.balance);
    if (!validation.ok) {
      commit({ ...current, error: validation.error, bossPhase: 'betting' });
      return;
    }

    const resolved = resolveRound({
      bet: {
        kind: 'number',
        number: current.bossNumber,
        amount: validation.amount,
      },
      vip: current.vip,
      testConfig: current.testConfig,
      returnMultiple: BOSS_PAYOUT_MULTIPLE,
    });
    const pending: PendingRound = {
      id: createId(),
      amount: validation.amount,
      kind: 'number',
      betNumber: current.bossNumber,
      resolved,
      payoutApplied: false,
      source: 'boss',
    };
    commit(
      {
        ...current,
        balance: current.balance - validation.amount,
        bossPending: pending,
        bossPhase: 'spinning',
        bossRound: null,
        error: null,
      },
      true,
    );
  }, [commit]);

  const completeBossSpin = useCallback(() => {
    const current = stateRef.current;
    if (!current.bossPending) return;
    commit(settleBoss(current), true);
  }, [commit, settleBoss]);

  const nextBossRound = useCallback(() => {
    const current = stateRef.current;
    commit({
      ...current,
      bossPhase: 'betting',
      bossRound: null,
      error: null,
    });
  }, [commit]);

  const openScreen = useCallback((next?: Screen) => {
    const allowed: Screen[] = ['menu', 'contestant', 'dev-login', 'dev-dashboard', 'boss'];
    const screen: Screen = next && allowed.includes(next) ? next : 'contestant';
    commit(leaveBoss(stateRef.current, screen));
  }, [commit, leaveBoss]);

  const api = useMemo<GameApi>(
    () => ({
      ...state,
      openScreen,
      playerBonus: 1,
      demoTicker: DEMO_TICKER ?? [],
      reducedMotion,
      setSelectionKind,
      setSelectionNumber,
      setSelectionAmount,
      setLoadAmount,
      loadBalance,
      toggleVip,
      requestGamble,
      cancelConfirm,
      confirmGamble,
      completeSpin,
      nextRound,
      openDevLogin,
      openDevDashboard,
      backToContestant,
      login,
      logout,
      updateTestDraft,
      applyTestDraft,
      resetTestConfig,
      resetAccount,
      previewPresentation,
      clearPreview,
      clearError,
      clearNotice,
      setBossNumber,
      setBossAmount,
      requestBossGamble,
      confirmBossGamble,
      cancelBossGamble,
      completeBossSpin,
      nextBossRound,
    }),
    [
      state,
      openScreen,
      reducedMotion,
      setSelectionKind,
      setSelectionNumber,
      setSelectionAmount,
      setLoadAmount,
      loadBalance,
      toggleVip,
      requestGamble,
      cancelConfirm,
      confirmGamble,
      completeSpin,
      nextRound,
      openDevLogin,
      openDevDashboard,
      backToContestant,
      login,
      logout,
      updateTestDraft,
      applyTestDraft,
      resetTestConfig,
      resetAccount,
      previewPresentation,
      clearPreview,
      clearError,
      clearNotice,
      setBossNumber,
      setBossAmount,
      requestBossGamble,
      confirmBossGamble,
      cancelBossGamble,
      completeBossSpin,
      nextBossRound,
    ],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
