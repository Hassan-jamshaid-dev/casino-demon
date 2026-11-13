import type { BetSelection, RoundPhase, TestConfig } from '../../types';
import { clampPocket, paysLabel } from './format';

export function BettingPanel(props: {
  phase: RoundPhase;
  selection: BetSelection;
  loadAmount: string;
  testConfig: TestConfig;
  onKind: (kind: BetSelection['kind']) => void;
  onNumber: (value: number) => void;
  onAmount: (value: string) => void;
  onLoadAmount: (value: string) => void;
  onLoad: () => void;
  onRequest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    phase,
    selection,
    loadAmount,
    testConfig,
    onKind,
    onNumber,
    onAmount,
    onLoadAmount,
    onLoad,
    onRequest,
    onConfirm,
    onCancel,
  } = props;
  const locked = phase !== 'betting';
  const confirming = phase === 'confirming';
  const pays = paysLabel(selection.kind, selection.amount);

  function commitNumber(raw: string) {
    if (raw.trim() === '') {
      onNumber(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onNumber(clampPocket(parsed));
  }

  return (
    <div className="cd-bet-body">
      <div className="cd-field">
        <label className="cd-label" htmlFor="cd-load-amount">
          LOAD BALANCE
        </label>
        <div className="cd-load-row">
          <input
            id="cd-load-amount"
            className="cd-input"
            data-testid="load-amount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            autoComplete="off"
            aria-describedby="cd-load-help"
            value={loadAmount}
            onChange={(event) => onLoadAmount(event.target.value)}
          />
          <button type="button" className="cd-btn" data-testid="load-balance" onClick={onLoad}>
            LOAD
          </button>
        </div>
        <p id="cd-load-help" className="cd-helper">
          Adds fictional credits on this device.
        </p>
      </div>

      <form
        className="cd-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (phase === 'betting') onRequest();
        }}
      >
        <fieldset className="cd-fieldset">
          <legend className="cd-label">BET ON</legend>
          <div className="cd-bet-types">
            <button
              type="button"
              className="cd-btn cd-bet cd-bet-red"
              data-testid="bet-red"
              aria-pressed={selection.kind === 'red'}
              disabled={locked}
              onClick={() => onKind('red')}
            >
              RED
            </button>
            <button
              type="button"
              className="cd-btn cd-bet cd-bet-black"
              data-testid="bet-black"
              aria-pressed={selection.kind === 'black'}
              disabled={locked}
              onClick={() => onKind('black')}
            >
              BLACK
            </button>
            <button
              type="button"
              className="cd-btn cd-bet cd-bet-number"
              data-testid="bet-number"
              aria-pressed={selection.kind === 'number'}
              disabled={locked}
              onClick={() => onKind('number')}
            >
              NUMBER
              <span className="cd-odds">5×</span>
            </button>
          </div>
        </fieldset>

        {selection.kind === 'number' ? (
          <div className="cd-field">
            <label className="cd-label" htmlFor="cd-pocket-number">
              ENTER NUMBER
            </label>
            <div className="cd-stepper">
              <button
                type="button"
                className="cd-btn cd-step"
                aria-label="Decrease number"
                disabled={locked || selection.number <= 0}
                onClick={() => onNumber(clampPocket(selection.number - 1))}
              >
                −
              </button>
              <input
                id="cd-pocket-number"
                className="cd-input cd-pocket-input"
                data-testid="bet-number-value"
                type="number"
                inputMode="numeric"
                min={0}
                max={36}
                step={1}
                autoComplete="off"
                aria-describedby="cd-pocket-hint"
                disabled={locked}
                value={selection.number}
                onChange={(event) => commitNumber(event.target.value)}
              />
              <button
                type="button"
                className="cd-btn cd-step"
                aria-label="Increase number"
                disabled={locked || selection.number >= 36}
                onClick={() => onNumber(clampPocket(selection.number + 1))}
              >
                +
              </button>
            </div>
            <p id="cd-pocket-hint" className="cd-helper">
              0–36
            </p>
          </div>
        ) : null}

        <div className="cd-field">
          <label className="cd-label" htmlFor="cd-bet-amount">
            BET AMOUNT
          </label>
          <input
            id="cd-bet-amount"
            className="cd-input"
            data-testid="bet-amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            autoComplete="off"
            disabled={locked}
            value={selection.amount}
            onChange={(event) => onAmount(event.target.value)}
          />
        </div>

        <div className="cd-field">
          <p className="cd-label" id="cd-payout-label">
            POTENTIAL PAYOUT
          </p>
          <div data-testid="payout-preview" aria-labelledby="cd-payout-label">
            <p className={pays === '—' ? 'cd-pays is-empty' : 'cd-pays'}>{pays}</p>
            {testConfig.enabled && testConfig.bonusRound ? (
              <p className="cd-bonus-note">TEST BONUS ×{testConfig.bonusMultiplier}</p>
            ) : null}
          </div>
        </div>

        {confirming ? (
          <div className="cd-review" role="region" aria-label="Confirm wager">
            <h2 className="cd-review-title">CONFIRM BET</h2>
            <p>BET {selection.kind === 'number' ? 'NUMBER' : selection.kind.toUpperCase()}</p>
            {selection.kind === 'number' ? <p>NUMBER {selection.number}</p> : null}
            <p>AMOUNT {selection.amount.trim() === '' ? '—' : selection.amount}</p>
            <p>{pays}</p>
            <div className="cd-confirm-actions">
              <button
                type="button"
                className="cd-btn cd-confirm"
                data-testid="confirm-gamble"
                disabled={!confirming}
                onClick={onConfirm}
              >
                CONFIRM
              </button>
              <button type="button" className="cd-btn cd-cancel" data-testid="cancel-gamble" onClick={onCancel}>
                CANCEL
              </button>
            </div>
          </div>
        ) : null}

        <button type="submit" className="cd-btn cd-gamble" data-testid="gamble" disabled={phase !== 'betting'}>
          GAMBLE
        </button>
      </form>
    </div>
  );
}
