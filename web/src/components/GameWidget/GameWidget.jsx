import { useEffect, useState } from "react";
import { useGame } from "../../context/useGame";

const GameWidget = () => {
  const { game, loading } = useGame();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!game || game.state !== "por_jugar") return;

    const interval = setInterval(() => {
      const now = new Date();
      const match = new Date(game.date);
      const diff = match - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / 1000 / 60 / 60),
        minutes: Math.floor((diff / 1000 / 60) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game]);

  if (loading || !game) return null;

  const now = new Date();
  const gameDate = new Date(game.date);

  const isInProgress = game.state === "por_jugar" && gameDate <= now;

  return (
    <div className="relative w-64 max-w-xl h-16 bg-black border-2 border-gray-400 rounded-xl overflow-hidden flex items-center justify-center">
      {/* Círculo Equipo 1 */}
      <div className="absolute right-48 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden">
        <img
          src="/logo.webp"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Círculo Equipo 2 */}
      <div className="absolute left-48 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden">
        <img
          src={game.rival.logoUrl}
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Centro */}
      <div className="text-center text-white font-semibold z-10">
        {game.state === "por_jugar" && !isInProgress && (
          <>
            <p className="text-m ">Próximo partido</p>
            <p className="text-s mt-1">
              {timeLeft.hours}h : {timeLeft.minutes}m
            </p>
          </>
        )}

        {isInProgress && (
          <>
            <span className="uppercase tracking-widest text-yellow-400 text-sm mb-2">
              En curso
            </span>
          </>
        )}

        {game.state === "finalizado" && (
          <>
            <p className="text-white text-2xl">
              {game.result.goalsFor} - {game.result.goalsAgainst}
            </p>
            <p className="text-sm mt-1">Finalizado</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GameWidget;
