import { FiArrowDown, FiArrowUp } from "react-icons/fi";

type PositionMovementIndicatorProps = {
  positionChange?: number | null;
  className?: string;
};

const getMovementCopy = (positionChange: number): string => {
  if (positionChange > 0) {
    return `Subio ${positionChange} ${
      positionChange === 1 ? "posicion" : "posiciones"
    }`;
  }

  if (positionChange < 0) {
    const positions = Math.abs(positionChange);

    return `Bajo ${positions} ${positions === 1 ? "posicion" : "posiciones"}`;
  }
  return "";
};

const PositionMovementIndicator = ({
  positionChange,
  className = "",
}: PositionMovementIndicatorProps) => {
  if (!positionChange) return null;

  const movedUp = positionChange > 0;
  const positions = Math.abs(positionChange);
  const classes = movedUp
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-red-500/30 bg-red-500/10 text-red-300";
  const Icon = movedUp ? FiArrowUp : FiArrowDown;

  return (
    <span
      aria-label={getMovementCopy(positionChange)}
      title={getMovementCopy(positionChange)}
      className={`inline-flex h-5 w-7 items-center justify-center gap-0.5 border px-1 text-[11px] font-bold tabular-nums ${classes} ${className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span>{positions}</span>
    </span>
  );
};

export default PositionMovementIndicator;
