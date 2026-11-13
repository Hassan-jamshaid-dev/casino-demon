import { WHEEL_ORDER } from '../../assets/ui/wheel';

const SLICE = 360 / WHEEL_ORDER.length;

export function spinDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 400 : 3200;
}

function pocketIndex(winningNumber: number): number {
  for (let index = 0; index < WHEEL_ORDER.length; index += 1) {
    if (WHEEL_ORDER[index] === winningNumber) return index;
  }
  return -1;
}

/**
 * The painted wheel parks pocket i under the top pointer at -i * (360 / 37).
 * Extra full turns keep that landing and give the wheel a clockwise ease-out.
 */
export function nextWheelRotation(
  current: number,
  winningNumber: number,
  reducedMotion: boolean,
): number {
  const index = pocketIndex(winningNumber);
  if (index < 0) return current;

  const align = -index * SLICE;
  const alignMod = ((align % 360) + 360) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = alignMod - currentMod;
  if (delta < 0) delta += 360;
  if (delta === 0 && !reducedMotion) delta = 360;

  const extraTurns = reducedMotion ? 0 : 2;
  return current + delta + extraTurns * 360;
}
