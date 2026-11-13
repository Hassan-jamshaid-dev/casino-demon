import type { TestConfig } from '../../types';

type TestColumnProps = {
  houseEdgePercent: number;
  winLossMode: TestConfig['winLossMode'];
  rigCount: number;
  balance: number;
  onPatch: (patch: Partial<TestConfig>) => void;
  onApply: () => void;
  onResetTests: () => void;
  onResetAccount: () => void;
};

export function TestColumn({
  houseEdgePercent,
  winLossMode,
  rigCount,
  balance,
  onPatch,
  onApply,
  onResetTests,
  onResetAccount,
}: TestColumnProps) {
  function confirmResetTests() {
    const ok = window.confirm(
      'Reset test settings? This restores a fair wheel and sets the rig counter to 0.',
    );
    if (ok) {
      onResetTests();
    }
  }

  function confirmResetAccount() {
    const ok = window.confirm(
      'Reset the account? This restores 10000 fictional credits and clears history.',
    );
    if (ok) {
      onResetAccount();
    }
  }

  return (
    <div className="dev-col">
      <div className="dev-field">
        <label className="dev-kicker dev-label-row" htmlFor="house-edge">
          <span>HOUSE EDGE</span>
          <span className="dev-percent">{houseEdgePercent}%</span>
        </label>
        <input
          id="house-edge"
          className="dev-range"
          data-testid="house-edge"
          type="range"
          min={0}
          max={15}
          step={1}
          value={houseEdgePercent}
          aria-valuetext={`${houseEdgePercent}%`}
          aria-describedby="house-edge-help"
          onChange={(event) => onPatch({ houseEdgePercent: Number(event.target.value) })}
        />
        <p id="house-edge-help" className="dev-help">
          Test-only bias. Normal play ignores this. When test mode is on and no forced result
          applies, a winning fair roll is replaced by a loss with this probability.
        </p>
      </div>

      <div className="dev-field">
        <label className="dev-kicker" htmlFor="win-loss-mode">
          WIN / LOSS MODE
        </label>
        <select
          id="win-loss-mode"
          className="dev-select"
          data-testid="win-loss-mode"
          value={winLossMode}
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'normal' || value === 'always-win' || value === 'always-loss') {
              onPatch({ winLossMode: value });
            }
          }}
        >
          <option value="normal">Normal</option>
          <option value="always-win">Always win</option>
          <option value="always-loss">Always loss</option>
        </select>
      </div>

      <div className="dev-field">
        <p className="dev-kicker" id="rig-counter-label">
          RIG COUNTER
        </p>
        <p className="dev-rig-value" data-testid="rig-counter" aria-labelledby="rig-counter-label">
          {rigCount}
        </p>
        <p className="dev-help">How many settled rounds used a test override.</p>
      </div>

      <div className="dev-field">
        <p className="dev-kicker">FICTIONAL BALANCE</p>
        <p className="dev-balance-value">{balance.toLocaleString('en-US')} credits</p>
        <p className="dev-help">Loads happen on the contestant screen.</p>
      </div>

      <button type="button" className="dev-btn dev-btn--primary" data-testid="apply-test" onClick={onApply}>
        APPLY
      </button>
      <div className="dev-reset-row">
        <button type="button" className="dev-btn" data-testid="reset-test" onClick={confirmResetTests}>
          RESET TESTS
        </button>
        <button
          type="button"
          className="dev-btn"
          data-testid="reset-account"
          aria-describedby="reset-account-help"
          onClick={confirmResetAccount}
        >
          RESET ACCOUNT
        </button>
      </div>
      <p id="reset-account-help" className="dev-help">
        Restores 10000 fictional credits and clears history.
      </p>
    </div>
  );
}
