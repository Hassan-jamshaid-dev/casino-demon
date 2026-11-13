import type { JSX } from "react";
import { PixelSkull } from "./PixelSkull";
import { RED_NUMBERS, WHEEL_ORDER } from "./wheel";
import "./assets.css";

/**
 * Painted wheel. Pocket 0 is centered on the top pointer at rotationDeg 0.
 * Positive rotationDeg turns the pockets clockwise. The pointer stays fixed.
 * Park pocket i under the pointer with rotationDeg = -i * (360 / 37).
 */

const VB = 320;
const CX = 160;
const CY = 160;
const BEZEL_R = 156;
const RIM_R = 148;
const POCKET_OUTER = 140;
const POCKET_INNER = 76;
const HUB_MASK_R = 78;
const HUB_R = 64;
const SKULL_SIZE = 104;

const SLICE = 360 / WHEEL_ORDER.length;
const RED = new Set<number>(RED_NUMBERS);

/** 3×5 arcade digits. Stacked radially so each figure stays inside its wedge. */
const GLYPHS: Record<string, readonly string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "001", "001"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
};

const GLYPH_W = 3;
const GLYPH_H = 5;
const STACK_GAP = 1;

/**
 * Digits are stacked along the spoke (tens toward the rim).
 * Cell size is limited by the inner digit's chord, not by a side-by-side pair.
 */
function digitCell(): number {
  const stackCells = 2 * GLYPH_H + STACK_GAP;
  const outerR = POCKET_OUTER - 4;
  const margin = 0.84;
  const sinInner = Math.sin(((SLICE / 2) * margin * Math.PI) / 180);
  const chord = 2 * sinInner;
  return (chord * outerR) / (GLYPH_W + chord * stackCells);
}

const CELL = digitCell();
const STACK_CELLS = 2 * GLYPH_H + STACK_GAP;
const NUMBER_R = POCKET_OUTER - 4 - (STACK_CELLS * CELL) / 2;

const POCKET_FILL = {
  red: "var(--red, #ff2d55)",
  black: "#140a1c",
  green: "var(--green, #3dff7a)",
} as const;

type Tone = keyof typeof POCKET_FILL;

function toneOf(n: number): Tone {
  if (n === 0) return "green";
  return RED.has(n) ? "red" : "black";
}

function polar(radius: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}

function fmt(n: number): string {
  return n.toFixed(2);
}

/** Donut slice. Angles are degrees clockwise from 12 o'clock. */
function sectorPath(rOut: number, rIn: number, a0: number, a1: number): string {
  const [x0, y0] = polar(rOut, a0);
  const [x1, y1] = polar(rOut, a1);
  const [x2, y2] = polar(rIn, a1);
  const [x3, y3] = polar(rIn, a0);
  return [
    `M${fmt(x0)} ${fmt(y0)}`,
    `A${rOut} ${rOut} 0 0 1 ${fmt(x1)} ${fmt(y1)}`,
    `L${fmt(x2)} ${fmt(y2)}`,
    `A${rIn} ${rIn} 0 0 0 ${fmt(x3)} ${fmt(y3)}`,
    "Z",
  ].join("");
}

function arcPath(radius: number, a0: number, a1: number): string {
  const [x0, y0] = polar(radius, a0);
  const [x1, y1] = polar(radius, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${fmt(x0)} ${fmt(y0)}A${radius} ${radius} 0 ${large} 1 ${fmt(x1)} ${fmt(y1)}`;
}

function WheelDigits(props: { value: number; fill: string }): JSX.Element {
  const { value, fill } = props;
  const digits = String(value).split("");
  const glyphH = GLYPH_H * CELL;
  const gap = STACK_GAP * CELL;
  const totalH = digits.length * glyphH + (digits.length - 1) * gap;
  // Negative Y points toward the rim, so the tens digit sits under the pointer.
  const top = -totalH / 2;
  const ox = -((GLYPH_W * CELL) / 2);
  const bleed = CELL * 0.08;

  return (
    <g className="cd-wheel__num">
      {digits.flatMap((digit, index) => {
        const glyph = GLYPHS[digit];
        const gy = top + index * (glyphH + gap);
        return glyph.flatMap((line, y) =>
          [...line].flatMap((bit, x) => {
            if (bit !== "1") return [];
            return [
              <rect
                key={`${index}-${x}-${y}`}
                className="cd-wheel__digit"
                x={ox + x * CELL}
                y={gy + y * CELL}
                width={CELL + bleed}
                height={CELL + bleed}
                fill={fill}
                shapeRendering="crispEdges"
              />,
            ];
          }),
        );
      })}
    </g>
  );
}

function classNames(...parts: Array<string | false | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(" ");
}

export function RouletteWheelGraphic(props: {
  rotationDeg: number;
  spinning: boolean;
  reducedMotion: boolean;
  highlightNumber: number | null;
}): JSX.Element {
  const { rotationDeg, spinning, reducedMotion, highlightNumber } = props;
  const live = spinning && !reducedMotion;

  const pockets = WHEEL_ORDER.map((number, index) => {
    const center = index * SLICE;
    return {
      number,
      center,
      tone: toneOf(number),
      hit: highlightNumber === number,
      d: sectorPath(POCKET_OUTER, POCKET_INNER, center - SLICE / 2, center + SLICE / 2),
    };
  });

  const label =
    highlightNumber != null
      ? `Roulette wheel showing ${highlightNumber}`
      : spinning
        ? "Roulette wheel spinning"
        : "Roulette wheel";

  return (
    <svg
      className={classNames(
        "cd-wheel",
        spinning && "cd-wheel--spinning",
        reducedMotion && "cd-wheel--reduced",
        live && "cd-wheel--live",
      )}
      data-testid="wheel-graphic"
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={label}
      shapeRendering="geometricPrecision"
      overflow="visible"
    >
      <circle className="cd-wheel__bezel" cx={CX} cy={CY} r={BEZEL_R} />
      <path
        className="cd-wheel__bevel"
        d={arcPath(BEZEL_R - 2, -150, -28)}
        fill="none"
      />
      <circle className="cd-wheel__rim" cx={CX} cy={CY} r={RIM_R} />
      <circle className="cd-wheel__rim-hot" cx={CX} cy={CY} r={RIM_R - 4} />

      <g className="cd-wheel__rotor" transform={`rotate(${rotationDeg} ${CX} ${CY})`}>
        {pockets.map((pocket) => (
          <path
            key={pocket.number}
            className={`cd-wheel__pocket cd-wheel__pocket--${pocket.tone}`}
            data-number={pocket.number}
            d={pocket.d}
            fill={POCKET_FILL[pocket.tone]}
            stroke="#0c0612"
            strokeWidth={1.2}
          />
        ))}
        {pockets.map((pocket) =>
          pocket.hit ? (
            <path
              key={`hit-${pocket.number}`}
              className="cd-wheel__hit"
              d={pocket.d}
              data-number={pocket.number}
              fill="rgba(255, 246, 214, 0.22)"
              stroke="var(--gold, #ffc857)"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          ) : null,
        )}
        {pockets.map((pocket) => (
          <line
            key={`fret-${pocket.number}`}
            className="cd-wheel__fret"
            x1={CX}
            y1={CY - (POCKET_OUTER - 0.5)}
            x2={CX}
            y2={CY - (RIM_R + 2)}
            transform={`rotate(${pocket.center - SLICE / 2} ${CX} ${CY})`}
          />
        ))}
        {pockets.map((pocket) => (
          <g
            key={`num-${pocket.number}`}
            transform={`rotate(${pocket.center} ${CX} ${CY}) translate(${CX} ${CY - NUMBER_R})`}
          >
            {pocket.tone !== "green" ? (
              <g
                className="cd-wheel__digit-shadow"
                transform={`translate(${CELL * 0.16} ${CELL * 0.2})`}
              >
                <WheelDigits value={pocket.number} fill="#14060e" />
              </g>
            ) : null}
            <WheelDigits
              value={pocket.number}
              fill={pocket.tone === "green" ? "#10140f" : "#fff6e8"}
            />
          </g>
        ))}
      </g>

      <circle className="cd-wheel__mask" cx={CX} cy={CY} r={HUB_MASK_R} />
      <circle className="cd-wheel__hub-ring" cx={CX} cy={CY} r={HUB_R + 6} />
      <circle className="cd-wheel__hub" cx={CX} cy={CY} r={HUB_R} />
      <svg
        className="cd-wheel__skull-slot"
        x={CX - SKULL_SIZE / 2}
        y={CY - SKULL_SIZE / 2 + 2}
        width={SKULL_SIZE}
        height={SKULL_SIZE}
        aria-hidden="true"
      >
        <PixelSkull className="cd-wheel__skull" />
      </svg>

      <polygon className="cd-wheel__pointer-shadow" points="160,24 147,5 173,5" />
      <polygon className="cd-wheel__pointer" points="160,22 148,4 172,4" />
      <polygon className="cd-wheel__pointer-core" points="160,16 154,6 166,6" />
    </svg>
  );
}
