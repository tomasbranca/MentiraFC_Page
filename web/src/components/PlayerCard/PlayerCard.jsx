import { Link } from "react-router-dom";
import FootballIcon from "../../assets/football.svg";

const PlayerCard = ({ player, mode }) => {
  const { id, firstName, lastName, number, goals } = player;
  const imageUrl = `/Players/${id}.png`;

  return (
    <Link to={`/jugadores/${id}`} className="no-underline transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30">
      <div className="relative h-[300px] w-[200px] max-w-full overflow-hidden shadow-xl transform bg-neutral-900">
        <div className="absolute top-2 left-2 text-violet-50 font-semibold px-3 py-1 z-20">
          <h3 className="flex items-center gap-1 text-4xl">
            {mode === "goals" ? (
              <>
                {goals}
                <img
                  src={FootballIcon}
                  alt="goles"
                  className="size-8 filter brightness-0 invert"
                />
              </>
            ) : (
              `#${number}`
            )}
          </h3>
        </div>

        <div
          className="relative left-10 h-full w-full bg-cover z-10"
          style={{ backgroundImage: `url(${imageUrl})` }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full z-20 px-3 pb-3 bg-gradient-to-t from-neutral-950 to-transparent">
          <div className="flex flex-col leading-none">
            <span className="text-sm tracking-widest font-semibold text-violet-200">
              {firstName}
            </span>
            <span
              className="text-2xl font-black text-violet-50 uppercase"
              style={{
                textShadow: "1px 2px 0 #0a0a0a",
              }}
            >
              {lastName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;
