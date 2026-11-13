import type { JSX } from "react";
import { PixelCrown } from "./PixelCrown";
import "./assets.css";

/**
 * Simple 16-bit skull. H highlight, M violet, S shadow, D socket.
 * Holes are dark pixels so the face still reads on a transparent plate.
 */
const SKULL = [
  "......HHHHH......",
  "....HHMMMMMHH....",
  "...HMMMMMMMMMH...",
  "..MMMMMMMMMMMMM..",
  ".MMMMMMMMMMMMMMM.",
  ".MMMDDDMMMDDDMMM.",
  ".MMMDDDMMMDDDMMM.",
  ".MMMDDDMMMDDDMMM.",
  ".MMMMMMMMMMMMMMM.",
  "..MMMMMDDDMMMMM..",
  "...MMMMDDDMMMM...",
  "...MMMMMMMMMMM...",
  "...DDDDDDDDDDD...",
  "...MMDMMDMMDMM...",
  "...MMMMMMMMMMM...",
  "....MMMMMMMMM....",
  ".....SSSSSSS.....",
] as const;

const FILLS: Record<string, string> = {
  H: "color-mix(in srgb, var(--violet, #c084fc) 52%, white)",
  M: "var(--violet, #c084fc)",
  S: "color-mix(in srgb, var(--violet, #c084fc) 46%, #160818)",
  D: "#140818",
};

const CROWN_W = 15;
const CROWN_H = 7;
const CROWN_OVERLAP = 2;

export function PixelSkull(props: { crowned?: boolean; className?: string }): JSX.Element {
  const { crowned = false, className } = props;
  const width = SKULL[0].length;
  const skullH = SKULL.length;
  const height = crowned ? CROWN_H - CROWN_OVERLAP + skullH : skullH;
  const crownX = (width - CROWN_W) / 2;
  const skullY = crowned ? CROWN_H - CROWN_OVERLAP : 0;

  return (
    <svg
      className={["cd-skull", crowned ? "cd-skull--crowned" : "", className]
        .filter(Boolean)
        .join(" ")}
      data-testid="pixel-skull"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={skullY ? `translate(0 ${skullY})` : undefined}>
        {SKULL.flatMap((row, y) =>
          [...row].flatMap((cell, x) => {
            const fill = FILLS[cell];
            if (!fill) return [];
            return (
              <rect
                key={`${x}-${y}`}
                className="cd-skull__px"
                x={x}
                y={y}
                width={1.04}
                height={1.04}
                fill={fill}
              />
            );
          }),
        )}
      </g>
      {crowned ? (
        <svg x={crownX} y={0} width={CROWN_W} height={CROWN_H} viewBox={`0 0 ${CROWN_W} ${CROWN_H}`}>
          <PixelCrown />
        </svg>
      ) : null}
    </svg>
  );
}
