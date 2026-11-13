import type { RoundResult } from '../../types';

export type DemoTick = {
  id: string;
  label: string;
  demo?: boolean;
};

/** Shown only when the cabinet has no real rounds and the context has no demoTicker. */
const SAMPLE_DEMO: readonly DemoTick[] = [
  { id: 'demo-17', label: '17 RED', demo: true },
  { id: 'demo-0', label: '0 GREEN', demo: true },
  { id: 'demo-8', label: '8 BLACK', demo: true },
  { id: 'demo-32', label: '32 RED', demo: true },
  { id: 'demo-11', label: '11 BLACK', demo: true },
  { id: 'demo-26', label: '26 BLACK', demo: true },
];

function ticketColor(text: string): 'red' | 'black' | 'green' | 'unknown' {
  const upper = text.toUpperCase();
  if (upper.includes('GREEN')) return 'green';
  if (upper.includes('RED')) return 'red';
  if (upper.includes('BLACK')) return 'black';
  return 'unknown';
}

function historyText(entry: RoundResult): string {
  return `${entry.winningNumber} ${entry.winningColor.toUpperCase()}`;
}

export function WinnerTicker(props: {
  history: readonly RoundResult[];
  demoTicker?: readonly DemoTick[];
}) {
  const useDemo = props.history.length === 0;
  const samples = props.demoTicker && props.demoTicker.length > 0 ? props.demoTicker : SAMPLE_DEMO;
  const rows = useDemo
    ? samples.map((item) => ({ id: item.id, text: item.label.trim().toUpperCase() }))
    : [...props.history]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 12)
        .map((entry) => ({ id: entry.id, text: historyText(entry) }));

  return (
    <section className="cd-ticker" data-testid="ticker" aria-labelledby="cd-ticker-label">
      <h2 id="cd-ticker-label" className="cd-ticker-label">
        {useDemo ? 'DEMO RESULTS' : 'RECENT RESULTS'}
      </h2>
      {useDemo ? <p className="cd-helper">Sample entries, not real players.</p> : null}
      <ul className="cd-ticket-list">
        {rows
          .filter((row) => row.text !== '')
          .map((row) => (
            <li key={row.id} className={`cd-ticket is-${ticketColor(row.text)}`}>
              {row.text}
            </li>
          ))}
      </ul>
    </section>
  );
}
