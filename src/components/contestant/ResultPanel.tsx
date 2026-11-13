import { motion } from 'framer-motion';
import { PixelCrown } from '../../assets/ui/PixelCrown';
import { PixelSkull } from '../../assets/ui/PixelSkull';
import type { RoundResult } from '../../types';
import { formatBalance, formatSigned } from './format';

function colorWord(color: string): string {
  return color.toUpperCase();
}

function VipWin(props: { payout: number; reducedMotion: boolean }) {
  const { payout, reducedMotion } = props;
  const line = `+${formatBalance(payout)} CREDITS`;

  if (reducedMotion) {
    return (
      <div className="cd-vip-win">
        <div className="cd-vip-still">
          <PixelSkull crowned />
        </div>
        <h2 className="cd-result-title is-win" data-testid="result-title" aria-live="polite">
          YOU WIN!
        </h2>
        <p className="cd-result-payout is-win" data-testid="result-payout">
          {line}
        </p>
      </div>
    );
  }

  return (
    <div className="cd-vip-win">
      <div className="cd-vip-mascot" aria-hidden="true">
        <motion.div
          className="cd-vip-glow"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <motion.div
          className="cd-vip-skull"
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <PixelSkull />
        </motion.div>
        <motion.div
          className="cd-vip-crown"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.45, ease: 'easeOut' }}
        >
          <PixelCrown />
        </motion.div>
      </div>
      <motion.h2
        className="cd-result-title is-win"
        data-testid="result-title"
        aria-live="polite"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.35, ease: 'easeOut' }}
      >
        YOU WIN!
      </motion.h2>
      <motion.p
        className="cd-result-payout is-win"
        data-testid="result-payout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.28, ease: 'easeOut' }}
      >
        {line}
      </motion.p>
    </div>
  );
}

export function ResultPanel(props: { result: RoundResult; balance: number; reducedMotion: boolean }) {
  const { result, balance, reducedMotion } = props;
  const win =
    result.presentation === 'win' ||
    result.presentation === 'vip-win' ||
    result.presentation === 'bonus-win';
  const bonus = result.presentation === 'bonus-win' || result.presentation === 'bonus-loss';
  const color = colorWord(result.winningColor);
  const tone = result.winningColor;

  return (
    <div className={win ? 'cd-result is-win' : 'cd-result is-loss'}>
      {result.id.startsWith('preview-') ? (
        <p className="cd-preview" data-testid="preview-ribbon">
          PREVIEW — balance was not changed
        </p>
      ) : null}
      {result.forced ? (
        <p className="cd-forced" data-testid="forced-flag">
          Test override
        </p>
      ) : null}
      {bonus ? <p className="cd-bonus-kicker">BONUS ROUND</p> : null}
      {result.presentation === 'bonus-win' ? (
        <p className="cd-bonus-mult">×{result.bonusMultiplier}</p>
      ) : null}
      {result.presentation === 'vip-win' ? (
        <VipWin payout={result.payout} reducedMotion={reducedMotion} />
      ) : (
        <>
          <h2
            className={win ? 'cd-result-title is-win' : 'cd-result-title is-loss'}
            data-testid="result-title"
            aria-live="polite"
          >
            {win ? 'YOU WIN!' : 'HOUSE WINS'}
          </h2>
          <p
            className={win ? 'cd-result-payout is-win' : 'cd-result-payout is-quiet'}
            data-testid="result-payout"
          >
            {win ? `+${formatBalance(result.payout)} CREDITS` : `${formatBalance(result.payout)} CREDITS`}
          </p>
        </>
      )}
      <dl className="cd-stats">
        <div className="cd-stat">
          <dt>NUMBER</dt>
          <dd data-testid="result-number">{result.winningNumber}</dd>
        </div>
        <div className="cd-stat">
          <dt>COLOR</dt>
          <dd data-testid="result-color" className={`cd-color-${tone}`}>
            <span className={`cd-swatch is-${tone}`} aria-hidden="true" />
            {color}
          </dd>
        </div>
        <div className="cd-stat">
          <dt>WAGER</dt>
          <dd data-testid="result-wager">{formatBalance(result.amount)}</dd>
        </div>
        <div className="cd-stat">
          <dt>NET</dt>
          <dd data-testid="result-net">{formatSigned(result.net)}</dd>
        </div>
        <div className="cd-stat">
          <dt>BALANCE</dt>
          <dd data-testid="result-balance">{formatBalance(balance)}</dd>
        </div>
      </dl>
    </div>
  );
}
