import { GameProvider, useGame } from './context/GameContext';
import { BossScreen } from './pages/BossScreen';
import { ContestantScreen } from './pages/ContestantScreen';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { DeveloperLogin } from './pages/DeveloperLogin';
import './components/developer/developer.css';

function MainMenu() {
  const { balance, openScreen, openDevLogin } = useGame();

  return (
    <main className="dev-screen dev-login-screen">
      <section className="dev-panel dev-login" aria-labelledby="main-menu-title">
        <h1 id="main-menu-title" className="dev-title">
          CASINO DEMON
        </h1>
        <p className="dev-security" data-testid="fictional-disclaimer">
          Fictional credits only — no monetary value.
        </p>
        <p className="dev-creds">
          BALANCE <strong data-testid="balance">{balance.toLocaleString('en-US')}</strong>
        </p>
        <button
          type="button"
          className="dev-btn dev-btn--primary"
          data-testid="nav-play"
          onClick={() => openScreen('contestant')}
        >
          PLAY
        </button>
        <button type="button" className="dev-btn" data-testid="nav-boss" onClick={() => openScreen('boss')}>
          BOSS
        </button>
        <button type="button" className="dev-btn" data-testid="menu-button" onClick={() => openDevLogin()}>
          DEV
        </button>
      </section>
    </main>
  );
}

function AppScreen() {
  const { screen } = useGame();
  if (screen === 'menu') return <MainMenu />;
  if (screen === 'dev-login') return <DeveloperLogin />;
  if (screen === 'dev-dashboard') return <DeveloperDashboard />;
  if (screen === 'boss') return <BossScreen />;
  return <ContestantScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <AppScreen />
    </GameProvider>
  );
}
