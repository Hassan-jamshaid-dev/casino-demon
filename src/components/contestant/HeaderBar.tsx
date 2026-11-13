import { Crown, Skull } from 'lucide-react';
import { formatBalance } from './format';

const VIP_HINT = 'VIP status changes the win animation only. It does not change odds.';

export function HeaderBar(props: {
  balance: number;
  vip: boolean;
  onToggleVip: () => void;
  onOpenMenu: () => void;
  onOpenBoss: () => void;
  onOpenDev: () => void;
}) {
  const { balance, vip, onToggleVip, onOpenMenu, onOpenBoss, onOpenDev } = props;

  return (
    <header className="cd-topbar">
      <div className="cd-brand">
        <Skull className="cd-brand-skull" aria-hidden="true" size={22} />
        <h1 className="cd-title">CASINO DEMON</h1>
      </div>
      <div className="cd-top-actions">
        <p className="cd-balance">
          <span className="cd-balance-label">BALANCE</span>
          <span className="cd-balance-row">
            <span className="cd-coin" aria-hidden="true" />
            <span className="cd-balance-value" data-testid="balance">
              {formatBalance(balance)}
            </span>
          </span>
        </p>
        <button
          type="button"
          className={vip ? 'cd-btn cd-vip is-on' : 'cd-btn cd-vip'}
          data-testid="vip-toggle"
          aria-pressed={vip}
          aria-label={VIP_HINT}
          title={VIP_HINT}
          onClick={onToggleVip}
        >
          <Crown aria-hidden="true" size={16} />
          VIP
        </button>
        <button type="button" className="cd-btn" data-testid="nav-menu" onClick={onOpenMenu}>
          MENU
        </button>
        <button type="button" className="cd-btn" data-testid="nav-boss" onClick={onOpenBoss}>
          BOSS
        </button>
        <button type="button" className="cd-btn cd-dev" data-testid="menu-button" onClick={onOpenDev}>
          DEV
        </button>
      </div>
      <p className="cd-disclaimer" data-testid="fictional-disclaimer">
        Fictional credits only — no monetary value.
      </p>
    </header>
  );
}
