import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { SoccerBallIcon } from "../icons/InlineIcons";
import ProgressiveMedia from "../ProgressiveMedia/ProgressiveMedia";
import {
  getPlayerLink,
  PLAYER_CARD_MODE,
  type PlayerCardMode,
} from "./playerCard.utils";
import type { Player, PlayerWithGoals } from "../../../types/models";

type PlayerCardProps = {
  player: Player | PlayerWithGoals | null;
  mode?: PlayerCardMode;
};

const PlayerCard = ({ player, mode = PLAYER_CARD_MODE.DEFAULT }: PlayerCardProps) => {
  if (!player) return null;

  const isGoalsMode = mode === PLAYER_CARD_MODE.GOALS;
  const goals = "goals" in player ? player.goals : 0;

  return (
    <Link to={getPlayerLink(player)} className="group block no-underline">
      <div
        className="
        relative
        w-full
        aspect-3/4
        overflow-hidden
        bg-neutral-950
        shadow-xl
        transition-all duration-300
        group-hover:shadow-2xl
      "
      >
        {/* Número / goles */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 select-none">
          <span
            className="text-2xl sm:text-4xl font-black tracking-tight text-white"
            style={{
              textShadow: `
                0 3px 8px rgba(0,0,0,.9),
                0 0 16px rgba(0,0,0,.6)
              `,
            }}
          >
            {isGoalsMode ? goals : `#${player.number ?? "-"}`}
          </span>

          {isGoalsMode && (
            <SoccerBallIcon
              className="size-5 text-white sm:size-8"
              style={{
                filter: `drop-shadow(0 3px 8px rgba(0,0,0,.9))`,
              }}
            />
          )}
        </div>

        {/* Imagen */}
        <ProgressiveMedia
          src={getImageUrl(player.imageUrl, {
            width: 420,
            height: 560,
            fit: "crop",
            quality: 68,
            autoFormat: true,
          })}
          srcSet={getImageSrcSet(player.imageUrl, [220, 280, 340, 420], {
            height: (width) => Math.round(width * 4 / 3),
            fit: "crop",
            quality: 68,
            autoFormat: true,
          })}
          sizes="(max-width: 640px) 75vw, (max-width: 1024px) 33vw, 250px"
          alt={`${player.name} ${player.lastName}`}
          wrapperClassName="absolute inset-0 z-10"
          className="
            absolute inset-0
            object-cover
            transition-transform duration-500
            group-hover:scale-105
          "
          width={420}
          height={560}
          loading="lazy"
          decoding="async"
          skeletonClassName="bg-neutral-900"
        />

        {/* Overlay */}
        <div
          className="
          absolute inset-0 z-20
          bg-linear-to-t
          from-neutral-950 via-neutral-950/40 to-violet-900/20
        "
        />

        {/* Nombre */}
        <div className="absolute bottom-0 left-0 z-30 w-full px-3 pb-4">
          <div className="flex flex-col leading-none">
            <span className="text-[8px] sm:text-xs font-semibold tracking-[0.25em] text-violet-300 uppercase">
              {player.name}
            </span>

            <span
              className="mt-1 text-l sm:text-2xl font-black uppercase text-violet-50"
              style={{ textShadow: "1px 2px 0 #000" }}
            >
              {player.lastName}
            </span>

            <div className="mt-1 h-0.5 w-10 bg-violet-500 rounded-full" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;
