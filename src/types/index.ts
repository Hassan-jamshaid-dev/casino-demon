export type RouletteColor = 'red' | 'black' | 'green';
export type BetKind = 'red' | 'black' | 'number';
export type RoundPhase = 'betting' | 'confirming' | 'spinning' | 'result';
export type Screen = 'menu' | 'contestant' | 'dev-login' | 'dev-dashboard' | 'boss';
export type Presentation = 'win' | 'loss' | 'vip-win' | 'bonus-win' | 'bonus-loss';
export type WinLossMode = 'normal' | 'always-win' | 'always-loss';

export interface BetSelection {
  kind: BetKind;
  number: number;
  amount: string;
}

export interface ResolvedRound {
  winningNumber: number;
  winningColor: RouletteColor;
  won: boolean;
  payout: number;
  net: number;
  isBonus: boolean;
  bonusMultiplier: number;
  forced: boolean;
  adjacent: boolean;
  presentation: Presentation;
}

export interface RoundResult extends ResolvedRound {
  id: string;
  kind: BetKind;
  betNumber: number | null;
  amount: number;
  timestamp: number;
}

export interface PendingRound {
  id: string;
  amount: number;
  kind: BetKind;
  betNumber: number | null;
  resolved: ResolvedRound;
  payoutApplied: boolean;
  source?: 'boss';
}

export interface TestConfig {
  enabled: boolean;
  forceColor: 'red' | 'black' | null;
  forceNumber: number | null;
  winLossMode: WinLossMode;
  bonusRound: boolean;
  bonusMultiplier: number;
  adjacentSpot: boolean;
  houseEdgePercent: number;
}

export interface TickerEntry {
  id: string;
  label: string;
  demo: boolean;
}

export interface PersistedState {
  version: 1;
  balance: number;
  vip: boolean;
  history: RoundResult[];
  testConfig: TestConfig;
  rigCount: number;
  devAuthenticated: boolean;
  pending: PendingRound | null;
}
