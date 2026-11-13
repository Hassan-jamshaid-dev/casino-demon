import { useEffect } from 'react';
import { Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { DeveloperLogin } from './DeveloperLogin';
import { DevAlerts } from '../components/developer/DevAlerts';
import { DevSwitch } from '../components/developer/DevSwitch';
import { ForceOutcome } from '../components/developer/ForceOutcome';
import { PreviewRow } from '../components/developer/PreviewRow';
import { TestColumn } from '../components/developer/TestColumn';
import '../components/developer/developer.css';

export function DeveloperDashboard() {
  const {
    balance,
    testDraft,
    rigCount,
    devAuthenticated,
    error,
    notice,
    logout,
    openDevLogin,
    backToContestant,
    updateTestDraft,
    applyTestDraft,
    resetTestConfig,
    resetAccount,
    previewPresentation,
    clearError,
    clearNotice,
  } = useGame();

  useEffect(() => {
    if (!devAuthenticated) {
      openDevLogin();
    }
  }, [devAuthenticated, openDevLogin]);

  if (!devAuthenticated) {
    return <DeveloperLogin />;
  }

  return (
    <main className="dev-screen">
      <section className="dev-panel dev-dashboard" aria-labelledby="developer-menu-title">
        <header className="dev-header">
          <h1 id="developer-menu-title" className="dev-title">
            <Crown className="dev-crown" aria-hidden="true" size={22} />
            DEVELOPER MENU
          </h1>
          <div className="dev-header-actions">
            <button type="button" className="dev-btn" data-testid="dev-logout" onClick={logout}>
              LOG OUT
            </button>
            <button
              type="button"
              className="dev-btn dev-icon-btn"
              data-testid="close-dev"
              aria-label="Close"
              onClick={backToContestant}
            >
              X
            </button>
          </div>
        </header>

        <DevAlerts
          error={error}
          notice={notice}
          onClearError={clearError}
          onClearNotice={clearNotice}
        />

        <div className={testDraft.enabled ? 'dev-mode dev-mode--on' : 'dev-mode'}>
          <DevSwitch
            testId="test-mode-toggle"
            label="Test mode"
            checked={testDraft.enabled}
            describedBy="test-mode-help"
            onChange={(enabled) => updateTestDraft({ enabled })}
          />
          {testDraft.enabled ? (
            <p className="dev-mode-flag">
              TEST MODE — forced outcomes apply only after APPLY, and only while test mode is on.
            </p>
          ) : null}
          <p id="test-mode-help" className="dev-help">
            Off means the wheel is a fair 0–36 roll. Settings below do nothing until test mode is on
            AND you press APPLY.
          </p>
        </div>

        <div className="dev-columns">
          <ForceOutcome
            forceColor={testDraft.forceColor}
            forceNumber={testDraft.forceNumber}
            adjacentSpot={testDraft.adjacentSpot}
            bonusRound={testDraft.bonusRound}
            bonusMultiplier={testDraft.bonusMultiplier}
            onPatch={updateTestDraft}
          />
          <TestColumn
            houseEdgePercent={testDraft.houseEdgePercent}
            winLossMode={testDraft.winLossMode}
            rigCount={rigCount}
            balance={balance}
            onPatch={updateTestDraft}
            onApply={applyTestDraft}
            onResetTests={resetTestConfig}
            onResetAccount={resetAccount}
          />
        </div>

        <PreviewRow onPreview={previewPresentation} />
      </section>
    </main>
  );
}
