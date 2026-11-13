import type { JSX } from "react";
import "./assets.css";

/**
 * 3-point arcade crown. H highlight, M gold, J jewel, S shadow.
 * Transparent cells stay empty so the crown can sit on the skull.
 */
const CROWN = [
  ".......H.......",
  ".H....HHH....H.",
  ".HH..HHHHH..HH.",
  ".MMMMMMMMMMMMM.",
  "..MMMMMJMMMMM..",
  ".MMMMMMMMMMMMM.",
  "..SSSSSSSSSSS..",
] as const;

const FILLS: Record<string, string> = {
  H: "color-mix(in srgb, var(--gold, #ffc857) 46%, white)",
  M: "var(--gold, #ffc857)",
  J: "color-mix(in srgb, var(--gold, #ffc857) 28%, white)",
  S: "color-mix(in srgb, var(--gold, #ffc857) 62%, #4a2a08)",
};

export function PixelCrown(props: { className?: string }): JSX.Element {
  const { className } = props;
  const width = CROWN[0].length;
  const height = CROWN.length;

  return (
    <svg
      className={["cd-crown", className].filter(Boolean).join(" ")}
      data-testid="pixel-crown"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {CROWN.flatMap((row, y) =>
        [...row].flatMap((cell, x) => {
          const fill = FILLS[cell];
          if (!fill) return [];
          return (
            <rect
              key={`${x}-${y}`}
              className="cd-crown__px"
              x={x}
              y={y}
              width={1.04}
              height={1.04}
              fill={fill}
            />
          );
        }),
      )}
    </svg>
  );
}
