type DevAlertsProps = {
  error: string | null;
  notice: string | null;
  onClearError: () => void;
  onClearNotice: () => void;
};

export function DevAlerts({ error, notice, onClearError, onClearNotice }: DevAlertsProps) {
  if (!error && !notice) {
    return null;
  }

  return (
    <div className="dev-alerts">
      {error ? (
        <div className="dev-alert" role="alert">
          <p className="dev-alert-text" data-testid="error">
            {error}
          </p>
          <button type="button" className="dev-btn" onClick={onClearError} aria-label="Clear error">
            CLEAR
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className="dev-alert dev-alert--notice" role="status">
          <p className="dev-alert-text" data-testid="notice">
            {notice}
          </p>
          <button type="button" className="dev-btn" onClick={onClearNotice} aria-label="Clear notice">
            CLEAR
          </button>
        </div>
      ) : null}
    </div>
  );
}
