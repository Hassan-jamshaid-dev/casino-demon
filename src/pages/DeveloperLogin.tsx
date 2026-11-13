import { useState, type FormEvent } from 'react';
import { Crown } from 'lucide-react';
import { DEMO_DEV_PASSWORD, DEMO_DEV_USERNAME } from '../constants/auth';
import { useGame } from '../context/GameContext';
import { DevAlerts } from '../components/developer/DevAlerts';
import '../components/developer/developer.css';

export function DeveloperLogin() {
  const { login, backToContestant, error, notice, clearError, clearNotice } = useGame();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(username, password);
  }

  return (
    <main className="dev-screen dev-login-screen">
      <form className="dev-panel dev-login" onSubmit={onSubmit} aria-labelledby="developer-login-title">
        <h1 id="developer-login-title" className="dev-title">
          <Crown className="dev-crown" aria-hidden="true" size={22} />
          DEVELOPER LOGIN
        </h1>
        <p className="dev-security" data-testid="security-note">
          This is a simulated local login for a demo. It is not production security. Anyone with the
          browser can read the source and the credentials.
        </p>
        <p className="dev-creds">
          Demo credentials: <strong>{DEMO_DEV_USERNAME}</strong>
          {' / '}
          <strong>{DEMO_DEV_PASSWORD}</strong>
        </p>
        <DevAlerts
          error={error}
          notice={notice}
          onClearError={clearError}
          onClearNotice={clearNotice}
        />
        <div className="dev-field">
          <label className="dev-field-label" htmlFor="dev-username">
            Username
          </label>
          <input
            id="dev-username"
            className="dev-input"
            data-testid="dev-username"
            name="username"
            autoComplete="username"
            spellCheck={false}
            value={username}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="dev-field">
          <label className="dev-field-label" htmlFor="dev-password">
            Password
          </label>
          <input
            id="dev-password"
            className="dev-input"
            data-testid="dev-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="dev-btn dev-btn--primary" data-testid="dev-login">
          LOG IN
        </button>
        <button
          type="button"
          className="dev-btn dev-btn--block"
          data-testid="back-to-game"
          onClick={backToContestant}
        >
          BACK
        </button>
      </form>
    </main>
  );
}
