import type { DominantFoot } from "../../../types/models";

const FOOT_LABELS: Record<DominantFoot, string> = {
  left: "izquierda",
  right: "derecha",
};

const ShoePrintIcon = ({ className = "" }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 15.906 15.906"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7.954,10.284c1.832,0,3.318-2.303,3.318-5.142c0-2.84-0.56-5.142-2.392-5.142S4.635,2.302,4.635,5.142C4.635,7.981,6.121,10.284,7.954,10.284z" />
    <path d="M6.029,14.22c0,0.931,0.755,1.686,1.686,1.686h0.479c0.932,0,1.686-0.755,1.686-1.686v-2.36c0,0-0.756,0.781-1.9,0.781c-1.145,0-1.949-0.781-1.949-0.781v2.36H6.029z" />
  </svg>
);

const getFootClassName = (
  side: DominantFoot,
  dominantFoot: DominantFoot
): string => {
  const isDominant = side === dominantFoot;

  return [
    "inline-flex h-10 w-10 items-center justify-center text-violet-50 transition-opacity",
    isDominant ? "opacity-100" : "opacity-35",
  ].join(" ");
};

interface DominantFootIndicatorProps {
  dominantFoot?: DominantFoot | null;
}

export const DominantFootIndicator = ({
  dominantFoot,
}: DominantFootIndicatorProps) => {
  if (!dominantFoot) return null;

  return (
    <div
      aria-label={`Pierna habil: ${FOOT_LABELS[dominantFoot]}`}
      className="mt-4 flex items-center gap-0.05"
    >
      <span
        aria-hidden="true"
        className={getFootClassName("left", dominantFoot)}
        title="Pie izquierdo"
      >
        <ShoePrintIcon className="h-10 w-10 -rotate-6" />
      </span>
      <span
        aria-hidden="true"
        className={getFootClassName("right", dominantFoot)}
        title="Pie derecho"
      >
        <ShoePrintIcon className="h-10 w-10 scale-x-[-1] rotate-6" />
      </span>
    </div>
  );
};
