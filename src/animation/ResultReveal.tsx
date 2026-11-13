import type { JSX } from 'react';
import { motion } from 'framer-motion';
import './animation.css';

/**
 * VIP win plays once and holds: skull scale-in, violet glow, crown drop, then the title.
 * The last beat ends just under 2 seconds. Nothing loops.
 */
const VIP_BEAT = {
  skull: 0.4,
  glowDelay: 0.4,
  glow: 0.42,
  crownDelay: 0.84,
  crown: 0.44,
  titleDelay: 1.3,
  creditsDelay: 1.52,
  detailsDelay: 1.7,
} as const;

const SKULL_ROWS = [
  '....bbbbbbbb....',
  '..bbbbbbbbbbbb..',
  '.bbbbbbbbbbbbbb.',
  '.bbbbbbbbbbbbbb.',
  '.bbssssbbssssbb.',
  '.bbssssbbssssbb.',
  '.bbshssbbshssbb.',
  '.bbssssbbssssbb.',
  '.bbbbbbbbbbbbbb.',
  '.bbbbbnnnnbbbbb.',
  '..bbbnnnnnnbbb..',
  '..bbbbbbbbbbbb..',
  '..ttt.ttt.ttt...',
  '..ttt.ttt.ttt...',
  '...tt..tt..tt...',
] as const;

const CROWN_ROWS = [
  '........ll........',
  '.......gggg.......',
  '......gggggg......',
  '.l....gggggg....l.',
  'ggg...gggggg...ggg',
  'gggggggggggggggggg',
  'gggggggggggggggggg',
  'gggggggggggggggggg',
  'ssssssssssssssssss',
] as const;

const SPARKS = [
  { left: '4%', top: '34%', delay: 0.48, color: '#ffc857' },
  { left: '88%', top: '28%', delay: 0.58, color: '#f6eeff' },
  { left: '0%', top: '64%', delay: 0.7, color: '#c084fc' },
  { left: '90%', top: '60%', delay: 0.8, color: '#ffc857' },
  { left: '46%', top: '0%', delay: 0.96, color: '#fff6d0' },
] as const;

const COLOR_WORD = {
  red: 'RED',
  black: 'BLACK',
  green: 'GREEN',
} as const;

function formatNet(net: number): string {
  if (net > 0) return `+${net}`;
  return String(net);
}

function revealMotion(reducedMotion: boolean, delay: number, duration: number) {
  if (reducedMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration, ease: 'easeOut' as const },
  };
}

function pixelRects(rows: readonly string[], colors: Record<string, string>, size: number) {
  const nodes: JSX.Element[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const fill = colors[row[x] ?? ''];
      if (!fill) continue;
      nodes.push(
        <rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={fill} />,
      );
    }
  });
  return nodes;
}

function SkullSvg() {
  return (
    <svg
      className="cd-reveal__skull-svg"
      viewBox="0 0 64 60"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixelRects(
        SKULL_ROWS,
        {
          b: '#e7d4ff',
          s: '#140814',
          h: '#fff8ff',
          n: '#140814',
          t: '#f8f3ff',
        },
        4,
      )}
    </svg>
  );
}

function CrownSvg() {
  return (
    <svg
      className="cd-reveal__crown-svg"
      viewBox="0 0 72 40"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixelRects(
        CROWN_ROWS,
        {
          l: '#fff3c4',
          g: '#ffc857',
          s: '#c9861f',
        },
        4,
      )}
      <rect x="8" y="24" width="6" height="6" fill="#c084fc" />
      <rect x="33" y="24" width="6" height="6" fill="#ff5a8a" />
      <rect x="58" y="24" width="6" height="6" fill="#c084fc" />
      <rect x="34" y="25" width="2" height="2" fill="#fff0f6" />
    </svg>
  );
}

function Flames() {
  return (
    <svg className="cd-reveal__flames" viewBox="0 0 168 140" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="16" y="88" width="10" height="10" fill="#7c3aed" />
      <rect x="22" y="70" width="10" height="20" fill="#c084fc" />
      <rect x="28" y="54" width="8" height="18" fill="#d8b4fe" />
      <rect x="32" y="42" width="6" height="12" fill="#f3e8ff" />
      <rect x="142" y="88" width="10" height="10" fill="#7c3aed" />
      <rect x="136" y="70" width="10" height="20" fill="#c084fc" />
      <rect x="130" y="54" width="8" height="18" fill="#d8b4fe" />
      <rect x="126" y="42" width="6" height="12" fill="#f3e8ff" />
    </svg>
  );
}

function VipMascot({ reducedMotion }: { reducedMotion: boolean }) {
  const still = reducedMotion;
  return (
    <div className="cd-reveal__mascot" aria-hidden="true">
      <motion.div
        className="cd-reveal__aura"
        initial={still ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: VIP_BEAT.glowDelay, duration: VIP_BEAT.glow, ease: 'easeOut' }
        }
      >
        <div className="cd-reveal__glow" />
        <Flames />
      </motion.div>
      {SPARKS.map((spark) => (
        <motion.span
          key={`${spark.left}-${spark.top}`}
          className="cd-reveal__spark"
          style={{ left: spark.left, top: spark.top, background: spark.color }}
          initial={still ? false : { opacity: 0, scale: 0.3, rotate: 45 }}
          animate={{ opacity: 1, scale: 1, rotate: 45 }}
          transition={
            still ? { duration: 0 } : { delay: spark.delay, duration: 0.22, ease: 'easeOut' }
          }
        />
      ))}
      <motion.div
        className="cd-reveal__skull"
        initial={still ? false : { opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={still ? { duration: 0 } : { duration: VIP_BEAT.skull, ease: 'circOut' }}
      >
        <SkullSvg />
      </motion.div>
      <motion.div
        className="cd-reveal__crown"
        initial={still ? false : { y: -36, opacity: 0, scale: 0.86 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: VIP_BEAT.crownDelay, duration: VIP_BEAT.crown, ease: 'backOut' }
        }
      >
        <CrownSvg />
      </motion.div>
    </div>
  );
}

export function ResultReveal(props: {
  presentation: 'win' | 'loss' | 'vip-win' | 'bonus-win' | 'bonus-loss';
  winningNumber: number;
  winningColor: 'red' | 'black' | 'green';
  amount: number;
  payout: number;
  net: number;
  balance: number;
  bonusMultiplier: number;
  isPreview: boolean;
  forced: boolean;
  reducedMotion: boolean;
}): JSX.Element {
  const {
    presentation,
    winningNumber,
    winningColor,
    amount,
    payout,
    net,
    balance,
    bonusMultiplier,
    isPreview,
    forced,
    reducedMotion,
  } = props;

  const win = presentation === 'win' || presentation === 'vip-win' || presentation === 'bonus-win';
  const vip = presentation === 'vip-win';
  const bonus = presentation === 'bonus-win' || presentation === 'bonus-loss';
  const title = win ? 'YOU WIN!' : 'HOUSE WINS';
  const payoutLine = win ? `+${payout} CREDITS` : formatNet(net);

  return (
    <section
      key={`${presentation}|${winningNumber}|${amount}|${payout}|${bonusMultiplier}|${reducedMotion ? 1 : 0}`}
      className={[
        'cd-reveal',
        `cd-reveal--${presentation}`,
        reducedMotion ? 'cd-reveal--reduced' : 'cd-reveal--play',
      ].join(' ')}
      data-presentation={presentation}
    >
      {isPreview ? (
        <p className="cd-reveal__ribbon" data-testid="preview-ribbon">
          PREVIEW — balance was not changed
        </p>
      ) : null}
      {forced ? (
        <p className="cd-reveal__forced" data-testid="forced-flag">
          Test override
        </p>
      ) : null}
      {vip ? <VipMascot reducedMotion={reducedMotion} /> : null}
      {bonus ? (
        <motion.p className="cd-reveal__bonus" {...revealMotion(reducedMotion, 0, 0.22)}>
          BONUS ROUND
        </motion.p>
      ) : null}
      {presentation === 'bonus-win' ? (
        <motion.p className="cd-reveal__multiplier" {...revealMotion(reducedMotion, 0.08, 0.22)}>
          ×{bonusMultiplier}
        </motion.p>
      ) : null}
      <motion.h2
        {...revealMotion(reducedMotion, vip ? VIP_BEAT.titleDelay : 0.04, vip ? 0.32 : 0.22)}
        className="cd-reveal__title"
        data-testid="result-title"
        aria-live="polite"
      >
        {title}
      </motion.h2>
      <motion.p
        {...revealMotion(reducedMotion, vip ? VIP_BEAT.creditsDelay : 0.12, 0.26)}
        className="cd-reveal__payout"
        data-testid="result-payout"
      >
        {payoutLine}
      </motion.p>
      <motion.dl
        {...revealMotion(reducedMotion, vip ? VIP_BEAT.detailsDelay : 0.18, 0.24)}
        className="cd-reveal__stats"
      >
        <div className="cd-reveal__stat">
          <dt className="cd-reveal__label">NUMBER</dt>
          <dd className="cd-reveal__value" data-testid="result-number">
            {winningNumber}
          </dd>
        </div>
        <div className="cd-reveal__stat">
          <dt className="cd-reveal__label">COLOR</dt>
          <dd
            className={`cd-reveal__value cd-reveal__color cd-reveal__color--${winningColor}`}
            data-testid="result-color"
          >
            {COLOR_WORD[winningColor]}
          </dd>
        </div>
        <div className="cd-reveal__stat">
          <dt className="cd-reveal__label">WAGER</dt>
          <dd className="cd-reveal__value" data-testid="result-wager">
            {amount}
          </dd>
        </div>
        <div className="cd-reveal__stat">
          <dt className="cd-reveal__label">NET</dt>
          <dd className="cd-reveal__value" data-testid="result-net">
            {formatNet(net)}
          </dd>
        </div>
        <div className="cd-reveal__stat">
          <dt className="cd-reveal__label">BALANCE</dt>
          <dd className="cd-reveal__value" data-testid="result-balance">
            {balance}
          </dd>
        </div>
      </motion.dl>
    </section>
  );
}
