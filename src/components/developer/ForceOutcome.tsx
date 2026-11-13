import type { TestConfig } from '../../types';
import { DevSwitch } from './DevSwitch';

type ForceOutcomeProps = {
  forceColor: TestConfig['forceColor'];
  forceNumber: TestConfig['forceNumber'];
  adjacentSpot: boolean;
  bonusRound: boolean;
  bonusMultiplier: number;
  onPatch: (patch: Partial<TestConfig>) => void;
};

export function ForceOutcome({
  forceColor,
  forceNumber,
  adjacentSpot,
  bonusRound,
  bonusMultiplier,
  onPatch,
}: ForceOutcomeProps) {
  const shown = forceNumber ?? 17;

  function setNumber(next: number) {
    const clamped = Math.min(36, Math.max(0, next));
    onPatch({ forceNumber: clamped, forceColor: null });
  }

  return (
    <section className="dev-col" aria-labelledby="force-outcome-heading">
      <h2 id="force-outcome-heading" className="dev-kicker">
        FORCE OUTCOME
      </h2>
      <div className="dev-force-row" role="group" aria-label="Force outcome">
        <button
          type="button"
          className="dev-btn dev-force dev-force--red"
          data-testid="force-red"
          aria-pressed={forceColor === 'red'}
          onClick={() => onPatch({ forceColor: 'red', forceNumber: null })}
        >
          RED
        </button>
        <button
          type="button"
          className="dev-btn dev-force dev-force--black"
          data-testid="force-black"
          aria-pressed={forceColor === 'black'}
          onClick={() => onPatch({ forceColor: 'black', forceNumber: null })}
        >
          BLACK
        </button>
        <button
          type="button"
          className="dev-btn dev-force dev-force--number"
          data-testid="force-number"
          aria-pressed={forceNumber !== null}
          onClick={() => onPatch({ forceNumber: forceNumber ?? 17, forceColor: null })}
        >
          NUMBER
        </button>
      </div>
      <div className="dev-stepper" role="group" aria-label="Forced number">
        <button
          type="button"
          className="dev-btn"
          aria-label="Decrease forced number"
          onClick={() => setNumber(shown - 1)}
        >
          ◀
        </button>
        <span
          className={
            forceNumber === null
              ? 'dev-stepper-value dev-stepper-value--idle'
              : 'dev-stepper-value'
          }
          data-testid="force-number-value"
          aria-live="polite"
        >
          {shown}
        </span>
        <button
          type="button"
          className="dev-btn"
          aria-label="Increase forced number"
          onClick={() => setNumber(shown + 1)}
        >
          ▶
        </button>
      </div>
      <div className="dev-field">
        <DevSwitch
          testId="adjacent-toggle"
          label="ADJACENT SPOT"
          checked={adjacentSpot}
          describedBy="adjacent-help"
          onChange={(checked) => onPatch({ adjacentSpot: checked })}
        />
        <p id="adjacent-help" className="dev-help">
          Number bets land on a neighboring pocket (a near-miss loss). Ignored unless test mode is
          applied.
        </p>
      </div>
      <DevSwitch
        testId="bonus-toggle"
        label="BONUS ROUND"
        checked={bonusRound}
        onChange={(checked) => onPatch({ bonusRound: checked })}
      />
      <div className="dev-field">
        <label className="dev-field-label" htmlFor="bonus-multiplier">
          Bonus multiplier
        </label>
        <input
          id="bonus-multiplier"
          className="dev-input dev-input--short"
          data-testid="bonus-multiplier"
          type="number"
          min={2}
          max={10}
          step={1}
          inputMode="numeric"
          value={bonusMultiplier}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isNaN(next)) {
              return;
            }
            onPatch({ bonusMultiplier: next });
          }}
        />
      </div>
    </section>
  );
}
