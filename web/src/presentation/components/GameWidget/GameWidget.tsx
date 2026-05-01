import { getImageUrl } from "../../../data/imageService";
import {
  SITE_LOGO_ASSETS,
  SITE_LOGO_SIZES,
  SITE_LOGO_SRC_SET,
} from "../../constants/assets.constants";
import { GameWidgetSkeleton } from "../Skeletons/SectionSkeletons";

import { useGame } from "../../context/useGame";
import { useCountdown } from "../../hooks/useCountDown";
import { getGameWidgetVisualState } from "./GameWidget.utils";

type GameWidgetProps = {
  compact?: boolean;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "No se pudo cargar el partido";

const GameWidget = ({ compact = false }: GameWidgetProps) => {
  const { game, loading, error } = useGame();
  const visualState = getGameWidgetVisualState({ game, loading });

  const now = new Date();
  const gameDate = game ? new Date(game.date) : null;

  const isUpcoming =
    game?.state === "por_jugar" && gameDate !== null && gameDate > now;
  const isInProgress =
    game?.state === "por_jugar" && gameDate !== null && gameDate <= now;

  const timeLeft = useCountdown(game?.date, isUpcoming);

  if (visualState === "skeleton") {
    return <GameWidgetSkeleton compact={compact} />;
  }

  if (error) {
    return <div className="text-red-500">Error: {getErrorMessage(error)}</div>;
  }

  if (visualState === "empty") return null;
  if (!game) return null;

  return (
    <div
      className={`
        relative overflow-hidden flex items-center justify-center
        ${compact ? "w-40 h-12 text-xs" : "w-64 h-16 text-sm"}
        bg-black border-2 border-gray-400 rounded-xl
      `}
    >
      {/* LOGO LOCAL */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2
          ${
            compact
              ? "-left-8 w-20 h-20 opacity-40"
              : "-left-10 w-28 h-28 opacity-90"
          }
          rounded-full overflow-hidden
        `}
      >
        <img
          src={SITE_LOGO_ASSETS.medium}
          srcSet={SITE_LOGO_SRC_SET}
          sizes={SITE_LOGO_SIZES}
          className="w-full h-full object-cover"
          alt="Equipo local"
          width={100}
          height={100}
        />
      </div>

      {/* LOGO RIVAL */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2
          ${
            compact
              ? "-right-8 w-20 h-20 opacity-40"
              : "-right-10 w-28 h-28 opacity-90"
          }
          rounded-full overflow-hidden
        `}
      >
        <img
          src={getImageUrl(game.rival.imageUrl, {
            width: compact ? 80 : 112,
            height: compact ? 80 : 112,
            fit: "max",
            quality: 70,
            autoFormat: true,
          })}
          className="w-full h-full object-cover"
          alt="Equipo rival"
          width={compact ? 80 : 112}
          height={compact ? 80 : 112}
        />
      </div>

      {/* TEXTO CENTRAL */}
      <div className="relative z-10 text-center text-white font-semibold px-6">
        {isUpcoming && (
          <>
            <p className="leading-tight">Próximo partido</p>
            <p className="mt-0.5">
              {timeLeft.hours}h : {timeLeft.minutes}m
            </p>
          </>
        )}

        {isInProgress && (
          <span className="uppercase tracking-widest text-yellow-400 text-xs">
            En curso
          </span>
        )}

        {game.state === "finalizado" && (
          <>
            <p className="text-lg">
              {game.result.goalsFor} - {game.result.goalsAgainst}
            </p>
            <p className="text-xs mt-0.5">Finalizado</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GameWidget;
