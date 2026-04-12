// @ts-nocheck
import { Link } from "react-router-dom";
import { FaFutbol } from "react-icons/fa";
import {
  getPlayerLink,
  PLAYER_CARD_MODE,
} from "./playerCard.utils";

const PlayerCard = ({
  player,
  mode = PLAYER_CARD_MODE.DEFAULT,
}) => {
  if (!player) return null;

  const isGoalsMode = mode === PLAYER_CARD_MODE.GOALS;

  return (
    <Link
      to={getPlayerLink(player)}
      className="group block no-underline"
    >
      <div
        className="
        relative
        w-full
        aspect-[3/4]
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
            {isGoalsMode ? player.goals : `#${player.number}`}
          </span>

          {isGoalsMode && (
            <FaFutbol
              className="text-white text-xl sm:text-2xl"
              style={{
                filter: `drop-shadow(0 3px 8px rgba(0,0,0,.9))`,
              }}
            />
          )}
        </div>

        {/* Imagen */}
        <div
          className="
            absolute inset-0 z-10
            bg-cover bg-center
            transition-transform duration-500
            group-hover:scale-105
          "
          style={{ backgroundImage: `url(${player.imageUrl})` }}
        />

        {/* Overlay */}
        <div
          className="
          absolute inset-0 z-20
          bg-gradient-to-t
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

            <div className="mt-1 h-[2px] w-10 bg-violet-500 rounded-full" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;