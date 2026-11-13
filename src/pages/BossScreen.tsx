import { BOSS_MIN_WAGER, BOSS_PAYOUT_MULTIPLE, useGame } from '../context/GameContext';
import { AlertStack } from '../components/contestant/AlertStack';
import { ArcadeCabinet } from '../components/contestant/ArcadeCabinet';
import { HeaderBar } from '../components/contestant/HeaderBar';
import { clampPocket } from '../components/contestant/format';
import './ContestantScreen.css';

function payoutLabel(amount: string): string {
  if (!/^\d+$/.test(amount)) return '—';
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value < BOSS_MIN_WAGER) return '—';
  return `PAYS ${(value * BOSS_PAYOUT_MULTIPLE).toLocaleString('en-US')} fictional credits`;
}

export function BossScreen() {
  const {
    balance,
    vip,
    bossPhase,
    bossPending,
    bossRound,
    bossNumber,
    bossAmount,
    error,
    notice,
    testConfig,
    reducedMotion,
    toggleVip,
    openScreen,
    openDevLogin,
    clearError,
    clearNotice,
    setBossNumber,
    setBossAmount,
    requestBossGamble,
    confirmBossGamble,
    cancelBossGamble,
    completeBossSpin,
    nextBossRound,
  } = useGame();

  const focused = bossPhase === 'spinning' || bossPhase === 'result';
  const lockedOut = balance < BOSS_MIN_WAGER && bossPhase === 'betting';
  const pays = payoutLabel(bossAmount);
  const winningNumber = bossPhase === 'spinning' ? (bossPending?.resolved.winningNumber ?? null) : null;
  const adjacent =
    bossPhase === 'spinning'
      ? Boolean(bossPending?.resolved.adjacent)
      : bossPhase === 'result'
        ? Boolean(bossRound?.adjacent)
        : false;

  return (
    <main className={vip ? 'cd-page is-vip' : 'cd-page'}>
      <div className="cd-shell">
        <HeaderBar
          balance={balance}
          vip={vip}
          onToggleVip={toggleVip}
          onOpenMenu={() => openScreen('menu')}
          onOpenBoss={() => openScreen('boss')}
          onOpenDev={openDevLogin}
        />
        <div className={focused ? 'cd-stage is-focused' : 'cd-stage'}>
          <div className="cd-cabinet-col">
            <ArcadeCabinet
              phase={bossPhase}
              isPreview={false}
              reducedMotion={reducedMotion}
              balance={balance}
              winningNumber={winningNumber}
              adjacent={adjacent}
              result={bossRound}
              onSpinComplete={completeBossSpin}
              onNext={nextBossRound}
            />
          </div>
          {!focused ? (
            <div className="cd-panel-col">
              <section className="cd-panel" aria-label="Boss betting">
                <h2 className="cd-review-title">BOSS</h2>
                <p className="cd-helper">
                  Number bets only, 0–36. Minimum wager is 10000 fictional credits. A win pays 10×
                  the stake. A loss pays 0.
                </p>
                <AlertStack
                  error={error}
                  notice={notice}
                  testConfig={testConfig}
                  onClearError={clearError}
                  onClearNotice={clearNotice}
                />
                {lockedOut ? (
                  <p className="cd-banner cd-banner-error" data-testid="boss-entry" role="alert">
                    You need 10000 fictional credits to enter.
                  </p>
                ) : null}
                <div className="cd-field">
                  <label className="cd-label" htmlFor="boss-number">
                    NUMBER
                    <span className="cd-odds"> 10×</span>
                  </label>
                  <div className="cd-stepper">
                    <button
                      type="button"
                      className="cd-btn cd-step"
                      aria-label="Decrease number"
                      disabled={lockedOut || bossNumber <= 0}
                      onClick={() => setBossNumber(clampPocket(bossNumber - 1))}
                    >
                      −
                    </button>
                    <input
                      id="boss-number"
                      className="cd-input cd-pocket-input"
                      data-testid="boss-number"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={36}
                      step={1}
                      value={bossNumber}
                      disabled={lockedOut}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw.trim() === '') {
                          setBossNumber(0);
                          return;
                        }
                        const parsed = Number(raw);
                        if (Number.isFinite(parsed)) setBossNumber(clampPocket(parsed));
                      }}
                    />
                    <button
                      type="button"
                      className="cd-btn cd-step"
                      aria-label="Increase number"
                      disabled={lockedOut || bossNumber >= 36}
                      onClick={() => setBossNumber(clampPocket(bossNumber + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cd-field">
                  <label className="cd-label" htmlFor="boss-amount">
                    WAGER
                  </label>
                  <input
                    id="boss-amount"
                    className="cd-input"
                    data-testid="boss-amount"
                    type="number"
                    inputMode="numeric"
                    min={BOSS_MIN_WAGER}
                    step={1}
                    value={bossAmount}
                    disabled={lockedOut || bossPhase !== 'betting'}
                    onChange={(event) => setBossAmount(event.target.value)}
                  />
                  <p className="cd-helper">Fictional credits only. This is not real money.</p>
                </div>
                <p className="cd-pays" data-testid="boss-payout">
                  {pays}
                </p>
                {bossPhase === 'confirming' ? (
                  <div className="cd-review" role="region" aria-label="Confirm boss wager">
                    <h2 className="cd-review-title">CONFIRM BET</h2>
                    <p>NUMBER {bossNumber}</p>
                    <p>AMOUNT {bossAmount || '—'}</p>
                    <p>{pays}</p>
                    <div className="cd-confirm-actions">
                      <button
                        type="button"
                        className="cd-btn cd-confirm"
                        data-testid="boss-confirm"
                        onClick={confirmBossGamble}
                      >
                        CONFIRM
                      </button>
                      <button
                        type="button"
                        className="cd-btn cd-cancel"
                        data-testid="boss-cancel"
                        onClick={cancelBossGamble}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cd-btn cd-gamble"
                    data-testid="boss-gamble"
                    disabled={lockedOut || bossPhase !== 'betting'}
                    onClick={requestBossGamble}
                  >
                    GAMBLE
                  </button>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
