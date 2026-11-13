import { useGame } from '../context/GameContext';
import { AlertStack } from '../components/contestant/AlertStack';
import { ArcadeCabinet } from '../components/contestant/ArcadeCabinet';
import { BettingPanel } from '../components/contestant/BettingPanel';
import { HeaderBar } from '../components/contestant/HeaderBar';
import { WinnerTicker, type DemoTick } from '../components/contestant/WinnerTicker';
import type { RoundResult } from '../types';
import './ContestantScreen.css';

function readDemoTicker(source: object): DemoTick[] | undefined {
  if (!('demoTicker' in source)) return undefined;
  const value = (source as { demoTicker?: DemoTick[] }).demoTicker;
  return Array.isArray(value) ? value : undefined;
}

export function ContestantScreen() {
  const game = useGame();
  const {
    balance,
    vip,
    phase,
    selection,
    loadAmount,
    pending,
    result,
    testConfig,
    error,
    notice,
    isPreview,
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
    openScreen,
    openDevLogin,
    clearPreview,
    clearError,
    clearNotice,
  } = game;
  const history: RoundResult[] = game.history;

  const focused = phase === 'spinning' || phase === 'result';
  const hasAlerts = Boolean(error || notice || testConfig.enabled);
  const winningNumber = phase === 'spinning' ? (pending?.resolved.winningNumber ?? null) : null;
  const adjacent =
    phase === 'spinning'
      ? Boolean(pending?.resolved.adjacent)
      : phase === 'result'
        ? Boolean(result?.adjacent)
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
              phase={phase}
              isPreview={isPreview}
              reducedMotion={reducedMotion}
              balance={balance}
              winningNumber={winningNumber}
              adjacent={adjacent}
              result={result}
              onSpinComplete={completeSpin}
              onNext={() => {
                if (isPreview) clearPreview();
                else nextRound();
              }}
            />
          </div>
          {(!focused || hasAlerts) && (
            <div className="cd-panel-col">
              <section className="cd-panel" aria-label="Betting panel">
                <AlertStack
                  error={error}
                  notice={notice}
                  testConfig={testConfig}
                  onClearError={clearError}
                  onClearNotice={clearNotice}
                />
                {!focused && (
                  <BettingPanel
                    phase={phase}
                    selection={selection}
                    loadAmount={loadAmount}
                    testConfig={testConfig}
                    onKind={setSelectionKind}
                    onNumber={setSelectionNumber}
                    onAmount={setSelectionAmount}
                    onLoadAmount={setLoadAmount}
                    onLoad={loadBalance}
                    onRequest={requestGamble}
                    onConfirm={confirmGamble}
                    onCancel={cancelConfirm}
                  />
                )}
              </section>
            </div>
          )}
        </div>
        <WinnerTicker history={history} demoTicker={readDemoTicker(game)} />
      </div>
    </main>
  );
}
