import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { RouletteWheelGraphic } from '../../assets/ui/RouletteWheelGraphic';
import type { RoundPhase } from '../../types';
import { nextWheelRotation, spinDurationMs } from './spin';

export function RouletteWheel(props: {
  phase: RoundPhase;
  isPreview: boolean;
  reducedMotion: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}) {
  const { phase, isPreview, reducedMotion, winningNumber, onSpinComplete } = props;
  const [rotation, setRotation] = useState(0);
  const settled = useRef(0);
  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;

  useEffect(() => {
    if (phase !== 'spinning' || isPreview || typeof winningNumber !== 'number') return;

    const durationMs = spinDurationMs(reducedMotion);
    const start = settled.current;
    const dest = nextWheelRotation(start, winningNumber, reducedMotion);
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      settled.current = dest;
      setRotation(dest);
      onSpinCompleteRef.current();
    };

    const backup = window.setTimeout(finish, durationMs + 300);
    if (Math.abs(dest - start) < 0.001) {
      const done = window.setTimeout(finish, durationMs);
      return () => {
        cancelled = true;
        window.clearTimeout(done);
        window.clearTimeout(backup);
      };
    }

    const playback = animate(start, dest, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (value) => {
        if (cancelled) return;
        setRotation(value);
      },
      onComplete: finish,
    });

    return () => {
      cancelled = true;
      playback.stop();
      window.clearTimeout(backup);
    };
  }, [phase, isPreview, winningNumber, reducedMotion]);

  const spinning = phase === 'spinning' && !isPreview;

  return (
    <div className="cd-wheel-slot" data-testid="wheel">
      <RouletteWheelGraphic
        rotationDeg={rotation}
        spinning={spinning}
        reducedMotion={reducedMotion}
        highlightNumber={null}
      />
    </div>
  );
}
