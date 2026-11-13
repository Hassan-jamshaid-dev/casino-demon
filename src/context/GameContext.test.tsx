/** @vitest-environment jsdom */
import '../test/setup';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameProvider, useGame } from './GameContext';

function installMemoryStorage() {
  const memory = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.has(key) ? (memory.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(String(key), String(value));
    },
  };
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

function Probe() {
  const game = useGame();
  const [loginResult, setLoginResult] = useState('');

  return (
    <div>
      <div data-testid="balance">{game.balance}</div>
      <div data-testid="phase">{game.phase}</div>
      <div data-testid="error">{game.error ?? ''}</div>
      <div data-testid="notice">{game.notice ?? ''}</div>
      <div data-testid="screen">{game.screen}</div>
      <div data-testid="authed">{String(game.devAuthenticated)}</div>
      <div data-testid="forced">{game.result ? String(game.result.forced) : ''}</div>
      <div data-testid="won">{game.result ? String(game.result.won) : ''}</div>
      <div data-testid="payout">{game.result ? String(game.result.payout) : ''}</div>
      <div data-testid="winning">{game.result ? String(game.result.winningNumber) : ''}</div>
      <div data-testid="preview">{String(game.isPreview)}</div>
      <div data-testid="result-id">{game.result?.id ?? ''}</div>
      <div data-testid="presentation">{game.result?.presentation ?? ''}</div>
      <div data-testid="history">{game.history.length}</div>
      <div data-testid="test-enabled">{String(game.testConfig.enabled)}</div>
      <div data-testid="draft-mode">{game.testDraft.winLossMode}</div>
      <div data-testid="draft-enabled">{String(game.testDraft.enabled)}</div>
      <div data-testid="pending-won">{game.pending ? String(game.pending.resolved.won) : ''}</div>
      <div data-testid="pending-forced">
        {game.pending ? String(game.pending.resolved.forced) : ''}
      </div>
      <div data-testid="pending-number">
        {game.pending ? String(game.pending.resolved.winningNumber) : ''}
      </div>
      <div data-testid="pending-payout">
        {game.pending ? String(game.pending.resolved.payout) : ''}
      </div>
      <div data-testid="login-result">{loginResult}</div>

      <button type="button" data-testid="set-red" onClick={() => game.setSelectionKind('red')}>
        red
      </button>
      <button
        type="button"
        data-testid="set-amount-100"
        onClick={() => game.setSelectionAmount('100')}
      >
        amount
      </button>
      <button
        type="button"
        data-testid="set-amount-over"
        onClick={() => game.setSelectionAmount('10001')}
      >
        over
      </button>
      <button type="button" data-testid="set-load-500" onClick={() => game.setLoadAmount('500')}>
        load 500
      </button>
      <button type="button" data-testid="set-load-empty" onClick={() => game.setLoadAmount('')}>
        load empty
      </button>
      <button type="button" data-testid="set-load-zero" onClick={() => game.setLoadAmount('0')}>
        load zero
      </button>
      <button
        type="button"
        data-testid="set-load-million"
        onClick={() => game.setLoadAmount('1000000')}
      >
        load million
      </button>
      <button type="button" data-testid="do-load" onClick={() => game.loadBalance()}>
        load
      </button>
      <button type="button" data-testid="do-request" onClick={() => game.requestGamble()}>
        request
      </button>
      <button type="button" data-testid="do-confirm" onClick={() => game.confirmGamble()}>
        confirm
      </button>
      <button type="button" data-testid="do-complete" onClick={() => game.completeSpin()}>
        complete
      </button>
      <button type="button" data-testid="do-next" onClick={() => game.nextRound()}>
        next
      </button>
      <button
        type="button"
        data-testid="do-login-ok"
        onClick={() => setLoginResult(String(game.login('hassan', '1234')))}
      >
        login ok
      </button>
      <button
        type="button"
        data-testid="do-login-bad"
        onClick={() => setLoginResult(String(game.login('x', 'y')))}
      >
        login bad
      </button>
      <button
        type="button"
        data-testid="draft-always-off"
        onClick={() =>
          game.updateTestDraft({
            enabled: false,
            winLossMode: 'always-win',
            forceNumber: 0,
            forceColor: null,
          })
        }
      >
        draft off
      </button>
      <button
        type="button"
        data-testid="draft-always-on"
        onClick={() =>
          game.updateTestDraft({
            enabled: true,
            winLossMode: 'always-win',
            forceNumber: null,
            forceColor: null,
            adjacentSpot: false,
            bonusRound: false,
          })
        }
      >
        draft on
      </button>
      <button type="button" data-testid="do-apply" onClick={() => game.applyTestDraft()}>
        apply
      </button>
      <button type="button" data-testid="do-preview" onClick={() => game.previewPresentation('win')}>
        preview
      </button>
      <button type="button" data-testid="do-reset" onClick={() => game.resetAccount()}>
        reset
      </button>
    </div>
  );
}

function renderGame() {
  return render(
    <GameProvider>
      <Probe />
    </GameProvider>,
  );
}

function textOf(testId: string): string {
  return screen.getByTestId(testId).textContent ?? '';
}

function playRed100() {
  fireEvent.click(screen.getByTestId('set-red'));
  fireEvent.click(screen.getByTestId('set-amount-100'));
  fireEvent.click(screen.getByTestId('do-request'));
  fireEvent.click(screen.getByTestId('do-confirm'));
}

function finishRound() {
  fireEvent.click(screen.getByTestId('do-complete'));
  fireEvent.click(screen.getByTestId('do-next'));
}

beforeEach(() => {
  installMemoryStorage();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GameProvider', () => {
  it('starts at 10000 fictional credits', () => {
    renderGame();
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
    expect(screen.getByTestId('phase')).toHaveTextContent('betting');
    expect(screen.getByTestId('screen')).toHaveTextContent('menu');
  });

  it('loads fictional credits, rejects empty or zero, and caps at 9999999', () => {
    renderGame();

    fireEvent.click(screen.getByTestId('set-load-empty'));
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
    expect(screen.getByTestId('error').textContent).not.toEqual('');

    fireEvent.click(screen.getByTestId('set-load-zero'));
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
    expect(screen.getByTestId('error').textContent).not.toEqual('');

    fireEvent.click(screen.getByTestId('set-load-500'));
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10500');

    fireEvent.click(screen.getByTestId('set-load-million'));
    for (let i = 0; i < 12; i += 1) {
      fireEvent.click(screen.getByTestId('do-load'));
    }
    expect(screen.getByTestId('balance')).toHaveTextContent('9999999');

    const errorAtCap = screen.getByTestId('error').textContent;
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('9999999');
    expect(screen.getByTestId('error').textContent).not.toEqual('');
    expect(errorAtCap === '' || screen.getByTestId('error').textContent !== '').toBe(true);
  });

  it('deducts a stake once on confirm and adds the payout once when the spin completes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();

    fireEvent.click(screen.getByTestId('draft-always-on'));
    fireEvent.click(screen.getByTestId('do-apply'));
    fireEvent.click(screen.getByTestId('set-red'));
    fireEvent.click(screen.getByTestId('set-amount-100'));
    fireEvent.click(screen.getByTestId('do-request'));

    expect(screen.getByTestId('phase')).toHaveTextContent('confirming');
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');

    fireEvent.click(screen.getByTestId('do-confirm'));
    expect(screen.getByTestId('phase')).toHaveTextContent('spinning');
    expect(screen.getByTestId('balance')).toHaveTextContent('9900');
    expect(screen.getByTestId('pending-won')).toHaveTextContent('true');
    expect(screen.getByTestId('pending-payout')).toHaveTextContent('200');

    fireEvent.click(screen.getByTestId('do-confirm'));
    expect(screen.getByTestId('balance')).toHaveTextContent('9900');

    fireEvent.click(screen.getByTestId('do-complete'));
    expect(screen.getByTestId('phase')).toHaveTextContent('result');
    expect(screen.getByTestId('balance')).toHaveTextContent('10100');
    expect(screen.getByTestId('payout')).toHaveTextContent('200');
    expect(screen.getByTestId('won')).toHaveTextContent('true');

    fireEvent.click(screen.getByTestId('do-complete'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10100');
    expect(screen.getByTestId('history')).toHaveTextContent('1');
  });

  it('does not spin when the wager is above the balance', () => {
    renderGame();
    fireEvent.click(screen.getByTestId('set-amount-over'));
    fireEvent.click(screen.getByTestId('do-request'));

    expect(screen.getByTestId('phase')).toHaveTextContent('betting');
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
    expect(screen.getByTestId('error')).toHaveTextContent('Not enough credits');
    expect(screen.getByTestId('pending-won')).toHaveTextContent('');

    fireEvent.click(screen.getByTestId('do-confirm'));
    expect(screen.getByTestId('phase')).toHaveTextContent('betting');
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
  });

  it('applies a pending payout exactly once when a new provider hydrates', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = renderGame();

    fireEvent.click(screen.getByTestId('draft-always-on'));
    fireEvent.click(screen.getByTestId('do-apply'));
    fireEvent.click(screen.getByTestId('set-red'));
    fireEvent.click(screen.getByTestId('set-amount-100'));
    fireEvent.click(screen.getByTestId('do-request'));
    fireEvent.click(screen.getByTestId('do-confirm'));

    expect(screen.getByTestId('phase')).toHaveTextContent('spinning');
    expect(screen.getByTestId('balance')).toHaveTextContent('9900');
    expect(screen.getByTestId('pending-payout')).toHaveTextContent('200');

    first.unmount();
    renderGame();

    await waitFor(() => {
      expect(screen.getByTestId('balance')).toHaveTextContent('10100');
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('result');
    expect(screen.getByTestId('payout')).toHaveTextContent('200');
    expect(screen.getByTestId('history')).toHaveTextContent('1');
  });

  it('accepts the demo developer login and rejects anything else', () => {
    renderGame();

    fireEvent.click(screen.getByTestId('do-login-bad'));
    expect(screen.getByTestId('login-result')).toHaveTextContent('false');
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
    expect(screen.getByTestId('screen')).toHaveTextContent('menu');
    expect(screen.getByTestId('error')).toHaveTextContent('Invalid developer credentials');

    fireEvent.click(screen.getByTestId('do-login-ok'));
    expect(screen.getByTestId('login-result')).toHaveTextContent('true');
    expect(screen.getByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('screen')).toHaveTextContent('dev-dashboard');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });

  it('does not force a win unless test mode is applied as enabled', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();

    fireEvent.click(screen.getByTestId('draft-always-off'));
    expect(textOf('draft-mode')).toBe('always-win');
    expect(textOf('draft-enabled')).toBe('false');
    expect(textOf('test-enabled')).toBe('false');

    playRed100();
    expect(textOf('pending-won')).toBe('false');
    expect(textOf('pending-forced')).toBe('false');
    expect(textOf('pending-number')).toBe('0');
    finishRound();
    expect(textOf('balance')).toBe('9900');

    fireEvent.click(screen.getByTestId('do-apply'));
    expect(textOf('test-enabled')).toBe('false');
    playRed100();
    expect(textOf('pending-forced')).toBe('false');
    expect(textOf('pending-won')).toBe('false');
    expect(textOf('pending-number')).toBe('0');
    finishRound();
    expect(textOf('balance')).toBe('9800');

    fireEvent.click(screen.getByTestId('draft-always-on'));
    fireEvent.click(screen.getByTestId('do-apply'));
    expect(textOf('test-enabled')).toBe('true');

    playRed100();
    expect(textOf('pending-won')).toBe('true');
    expect(textOf('pending-forced')).toBe('true');
    expect(textOf('pending-payout')).toBe('200');
    expect(textOf('balance')).toBe('9700');
  });

  it('previews a win without touching the balance', () => {
    renderGame();
    fireEvent.click(screen.getByTestId('set-load-500'));
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10500');

    fireEvent.click(screen.getByTestId('do-preview'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10500');
    expect(screen.getByTestId('preview')).toHaveTextContent('true');
    expect(screen.getByTestId('phase')).toHaveTextContent('result');
    expect(screen.getByTestId('result-id').textContent).toMatch(/^preview-/);
    expect(screen.getByTestId('history')).toHaveTextContent('0');
  });

  it('resets the account balance to 10000', () => {
    renderGame();
    fireEvent.click(screen.getByTestId('set-load-500'));
    fireEvent.click(screen.getByTestId('do-load'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10500');

    fireEvent.click(screen.getByTestId('do-reset'));
    expect(screen.getByTestId('balance')).toHaveTextContent('10000');
    expect(screen.getByTestId('phase')).toHaveTextContent('betting');
    expect(screen.getByTestId('history')).toHaveTextContent('0');
  });
});
