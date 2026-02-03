import { getGame } from "../../../lib/sanity";
import { useEffect, useState } from "react";
import { FaFutbol } from "react-icons/fa";
import GameSkeleton from "../GameSkeleton/GameSkeleton";
import GameEmpty from "../GameEmpty/GameEmpty";

const Game = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      const data = await getGame();
      setGame(data);
      setLoading(false);
    };

    fetchGame();
  }, []);

  if (loading) return <GameSkeleton />;
  if (!game) return <GameEmpty />;

  const date = new Date(game.date);

  const formatted = date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function shortName(name, lastName) {
    if (!name || !lastName) return "";
    return `${name[0].toUpperCase()}. ${lastName}`;
  }

  function renderFootballs(goals) {
    return Array.from({ length: goals }).map((_, i) => (
      <FaFutbol key={i} className="text-violet-400" />
    ));
  }

  const now = new Date();
  const gameDate = new Date(game.date);

  const isInProgress =
    game.state === "por_jugar" && gameDate <= now;

  return (
    <div
      className="game-component bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900
      text-violet-50 p-6 shadow-black/30 shadow-lg flex items-center justify-center
      mb-4 border-t-2 border-violet-700
      animate-[fadeIn_0.4s_ease-out]"
    >
      {/* Equipo local */}
      <div className="w-40 flex flex-col items-center gap-2 flex-shrink-0">
        <img
          src="/logo.webp"
          alt="Mentira FC"
          className="w-32 h-32 object-cover rounded-full"
        />
        <span className="text-sm font-semibold tracking-wide">
          Mentira FC
        </span>
      </div>

      {/* Centro */}
      <div className="text-center font-semibold flex flex-col items-center px-6 w-2xl">
        {/* PRÓXIMO PARTIDO */}
        {game.state === "por_jugar" && !isInProgress && (
          <>
            <h3 className="text-2xl tracking-wide">
              Próximo partido
            </h3>

            <h5 className="flex text-lg mt-5 justify-center items-center gap-2 opacity-90">
              {formatted}
            </h5>
          </>
        )}

        {/* EN CURSO */}
        {isInProgress && (
          <>
            <span className="uppercase tracking-widest text-yellow-400 text-sm mb-2">
              En curso
            </span>
            <p className="text-sm text-yellow-300/80">
              Partido en desarrollo
            </p>
          </>
        )}

        {/* FINALIZADO */}
        {game.state === "finalizado" && (
          <>
            <p className="text-sm mt-1 opacity-80">
              Finalizado
            </p>

            <h3 className="text-8xl font-extrabold tracking-tight my-4">
              {game.result.goalsFor}
              <span className="mx-3 opacity-40">–</span>
              {game.result.goalsAgainst}
            </h3>

            <div className="w-full h-px bg-violet-700/40 my-3" />

            {/* Goleadores */}
            <div className="w-full mt-2 flex justify-start">
              <div className="max-h-28 w-1/2 flex flex-wrap gap-x-6 gap-y-2 text-start">
                {game.result?.scorers?.map((scorer, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-medium">
                      {shortName(
                        scorer.player?.name,
                        scorer.player?.lastName
                      )}
                    </span>

                    <span className="flex gap-1">
                      {renderFootballs(scorer.goals)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rival */}
      <div className="w-40 flex flex-col items-center gap-2 flex-shrink-0">
        <img
          src={game.rival.logoUrl}
          alt={game.rival.name}
          className="w-32 h-32 object-cover rounded-full"
        />
        <span className="text-sm font-semibold tracking-wide">
          {game.rival.name}
        </span>
      </div>
    </div>
  );
};

export default Game;
