import type { RoundPhase, RoundResult } from '../../types';
import { ResultPanel } from './ResultPanel';
import { RouletteWheel } from './RouletteWheel';

export function ArcadeCabinet(props: {
  phase: RoundPhase;
  isPreview: boolean;
  reducedMotion: boolean;
  balance: number;
  winningNumber: number | null;
  adjacent: boolean;
  result: RoundResult | null;
  onSpinComplete: () => void;
  onNext: () => void;
}) {
  const {
    phase,
    isPreview,
    reducedMotion,
    balance,
    winningNumber,
    adjacent,
    result,
    onSpinComplete,
    onNext,
  } = props;
  const showResult = phase === 'result' && result != null;

  return (
    <section className="cd-cabinet" aria-label="Arcade cabinet">
      <span className="cd-screw cd-screw-tl" aria-hidden="true" />
      <span className="cd-screw cd-screw-tr" aria-hidden="true" />
      <span className="cd-screw cd-screw-bl" aria-hidden="true" />
      <span className="cd-screw cd-screw-br" aria-hidden="true" />
      <p className="cd-phase-row">
        <span className="cd-sr">Phase</span>
        <span className="cd-phase" data-testid="phase">
          {phase}
        </span>
      </p>
      <div className="cd-screen">
        <div className={showResult ? 'cd-wheel-hold is-hidden' : 'cd-wheel-hold'}>
          <RouletteWheel
            phase={phase}
            isPreview={isPreview}
            reducedMotion={reducedMotion}
            winningNumber={winningNumber}
            onSpinComplete={onSpinComplete}
          />
        </div>
        {phase === 'spinning' ? (
          <p className="cd-spinning" data-testid="spinning-label">
            SPINNING...
          </p>
        ) : null}
        {showResult ? (
          <ResultPanel result={result} balance={balance} reducedMotion={reducedMotion} />
        ) : null}
        {adjacent ? (
          <p className="cd-adjacent" data-testid="adjacent-label">
            SO CLOSE
          </p>
        ) : null}
        {showResult ? (
          <button type="button" className="cd-btn cd-next" data-testid="next-round" onClick={onNext}>
            NEXT ROUND
          </button>
        ) : null}
      </div>
      <div className="cd-deck" aria-hidden="true">
        <div className="cd-joystick" />
        <div className="cd-deck-buttons">
          <span className="cd-deck-btn is-green" />
          <span className="cd-deck-btn is-blue" />
          <span className="cd-deck-btn is-violet" />
        </div>
      </div>
    </section>
  );
}
