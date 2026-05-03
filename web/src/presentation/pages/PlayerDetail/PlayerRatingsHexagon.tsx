import type { PlayerRatingHexagonPoint } from "./playerRatingsHexagon.utils";

interface PlayerRatingsHexagonProps {
  points: PlayerRatingHexagonPoint[];
}

interface SvgPoint {
  x: number;
  y: number;
}

const CENTER = 50;
const OUTER_RADIUS = 28;
const LABEL_RADIUS = 35;
const START_ANGLE = -90;
const ANGLE_STEP = 60;

const getSvgPoint = (radius: number, index: number): SvgPoint => {
  const angle = ((START_ANGLE + index * ANGLE_STEP) * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
};

const formatPolygonPoints = (points: SvgPoint[]): string =>
  points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

const getTextAnchor = (x: number): "start" | "middle" | "end" => {
  if (x > CENTER + 8) return "start";
  if (x < CENTER - 8) return "end";

  return "middle";
};

const PlayerRatingsHexagon = ({ points }: PlayerRatingsHexagonProps) => {
  const outerPoints = Array.from({ length: 6 }, (_, index) =>
    getSvgPoint(OUTER_RADIUS, index)
  );
  const valuePoints = points.map(({ value }, index) =>
    getSvgPoint((OUTER_RADIUS * value) / 10, index)
  );

  return (
    <div
      className="h-28 w-28 sm:h-32 sm:w-32 lg:h-27 lg:w-27 xl:h-33 xl:w-33 pointer-events-none"
      aria-label="Valoraciones del jugador"
    >
      <svg
        className="h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
        viewBox="0 0 100 100"
        role="img"
      >
        <title>Valoraciones del jugador</title>
        <polygon
          points={formatPolygonPoints(outerPoints)}
          fill="rgba(167, 139, 250, 0.22)"
        />
        <polygon
          points={formatPolygonPoints(valuePoints)}
          fill="#ffffff"
          stroke="#ffffff"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
        {points.map(({ label }, index) => {
          const { x, y } = getSvgPoint(LABEL_RADIUS, index);

          return (
            <text
              key={label}
              x={x}
              y={y}
              fill="#f5f3ff"
              fontSize="7"
              fontWeight="400"
              letterSpacing="0"
              textAnchor={getTextAnchor(x)}
              dominantBaseline="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default PlayerRatingsHexagon;
