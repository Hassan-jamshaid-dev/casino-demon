import type { TestConfig } from '../../types';

export function AlertStack(props: {
  error: string | null;
  notice: string | null;
  testConfig: TestConfig;
  onClearError: () => void;
  onClearNotice: () => void;
}) {
  const { error, notice, testConfig, onClearError, onClearNotice } = props;
  if (!error && !notice && !testConfig.enabled) return null;

  return (
    <div className="cd-alerts">
      {testConfig.enabled ? (
        <p className="cd-banner cd-banner-test" data-testid="test-mode-banner">
          TEST MODE ACTIVE — this round is not a fair random result.
        </p>
      ) : null}
      {error ? (
        <div className="cd-banner cd-banner-error">
          <p data-testid="error" aria-live="polite">
            {error}
          </p>
          <button type="button" className="cd-btn cd-dismiss" onClick={onClearError} aria-label="Dismiss error">
            DISMISS
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className="cd-banner cd-banner-notice">
          <p data-testid="notice" aria-live="polite">
            {notice}
          </p>
          <button
            type="button"
            className="cd-btn cd-dismiss"
            onClick={onClearNotice}
            aria-label="Dismiss notice"
          >
            DISMISS
          </button>
        </div>
      ) : null}
    </div>
  );
}
