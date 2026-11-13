export function formatBalance(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}

export function formatSigned(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value);
  const abs = Math.abs(rounded).toLocaleString('en-US');
  if (rounded > 0) return `+${abs}`;
  if (rounded < 0) return `-${abs}`;
  return '0';
}

/** Total credits returned on a win. Color pays 2×, a straight number pays 5×. */
export function totalReturn(kind: 'red' | 'black' | 'number', amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return kind === 'number' ? value * 5 : value * 2;
}

export function paysLabel(kind: 'red' | 'black' | 'number', amount: string): string {
  const total = totalReturn(kind, amount);
  if (total == null) return '—';
  const shown = Number.isInteger(total) ? String(total) : String(Math.round(total * 100) / 100);
  return `PAYS ${shown}`;
}

export function clampPocket(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(36, Math.max(0, Math.trunc(value)));
}
