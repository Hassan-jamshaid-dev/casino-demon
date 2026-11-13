import type { BetSelection } from '../types';

export const STORAGE_KEY = 'casino-demon:v1';
export const STARTING_BALANCE = 10_000;
export const MIN_WAGER = 1;
export const MAX_WAGER = 100_000;
export const MAX_LOAD = 1_000_000;
export const BALANCE_CAP = 9_999_999;
export const HISTORY_LIMIT = 40;
export const COLOR_RETURN_MULTIPLIER = 2;
export const NUMBER_RETURN_MULTIPLIER = 5;

export const DEFAULT_BET_SELECTION: BetSelection = {
  kind: 'red',
  number: 17,
  amount: '',
};
