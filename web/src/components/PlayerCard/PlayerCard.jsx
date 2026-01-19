import { Link } from "react-router-dom";
import FootballIcon from "../../assets/football.svg";

const PlayerCard = ({ player, mode }) => {
  return (
    <Link to={`/plantel/${player.slug.current}`} className="group no-underline">
      <div
        className="
        relative h-[300px] w-[200px]
        overflow-hidden
        bg-neutral-950
        shadow-xl
        transition-all duration-300
        group-hover:-translate-y-1
        group-hover:shadow-2xl
      "
      >
        {/* Badge número / goles */}
        <div className="absolute top-4 left-4 z-30 select-none flex items-center gap-2">
          <span
            className="text-4xl font-black tracking-tight text-white"
            style={{
              textShadow: `
                0 3px 8px rgba(0,0,0,.9),
                0 0 16px rgba(0,0,0,.6)
              `,
            }}
          >
            {mode === "goals" ? player.goals : `#${player.number}`}
          </span>

          {mode === "goals" && (
            <img
              src={FootballIcon}
              alt="goles"
              className="size-7"
              style={{
                filter: `
                  brightness(0) invert(1)
                  drop-shadow(0 3px 8px rgba(0,0,0,.9))
                `,
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

        {/* Overlay identidad club */}
        <div
          className="
          absolute inset-0 z-20
          bg-gradient-to-t
          from-neutral-950 via-neutral-950/40 to-violet-900/20
          pointer-events-none
        "
        />

        {/* Nombre */}
        <div
          className="
          absolute bottom-0 left-0 z-30
          w-full px-3 pb-4
        "
        >
          <div className="flex flex-col leading-none">
            <span
              className="
              text-xs font-semibold tracking-[0.25em]
              text-violet-300 uppercase
            "
            >
              {player.name}
            </span>

            <span
              className="
                mt-1 text-2xl font-black uppercase
                text-violet-50
              "
              style={{ textShadow: "1px 2px 0 #000" }}
            >
              {player.lastName}
            </span>

            {/* Línea decorativa */}
            <div className="mt-1 h-[2px] w-10 bg-violet-500 rounded-full" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;
