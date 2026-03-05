import { useState } from "react";
import { FaFutbol } from "react-icons/fa";
import GameSkeleton from "../GameSkeleton/GameSkeleton";
import GameEmpty from "../GameEmpty/GameEmpty";

const Game = ({ game, loading }) => {
  const [showScorers, setShowScorers] = useState(false);

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

  const shortName = (name, lastName) =>
    name && lastName ? `${name[0].toUpperCase()}. ${lastName}` : "";

  const renderFootballs = (goals) =>
    Array.from({ length: goals }).map((_, i) => (
      <FaFutbol key={i} className="text-violet-400 text-xs sm:text-sm" />
    ));

  const now = new Date();
  const gameDate = new Date(game.date);
  const isInProgress = game.state === "por_jugar" && gameDate <= now;

  const scorers = game.result?.scorers || [];

  return (
    <section
      className="
      relative overflow-hidden
      bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900
      text-violet-50
      border-t-2 border-violet-700
      shadow-lg shadow-black/30
      py-12 sm:py-8
      px-4 sm:px-6 lg:px-10
      "
    >
      <div className="max-w-6xl mx-auto">

        {/* ================= FILA PRINCIPAL ================= */}
        <div className="flex items-center justify-between">

          {/* LOCAL */}
          <div className="w-[35%] sm:w-[15%] flex flex-col items-center shrink-0">

            <img
              src="/logo.webp"
              alt="Mentira FC"
              className="
              w-24 h-24
              sm:w-24 sm:h-24
              lg:w-36 lg:h-36
              object-cover
              rounded-full
              scale-175 sm:scale-100
              -translate-x-12 sm:translate-x-0
              "
            />

            <span className="hidden sm:block mt-2 text-sm lg:text-base">
              Mentira FC
            </span>

          </div>

          {/* ================= CENTRO ================= */}
          <div className="w-[30%] sm:w-[70%] flex flex-col items-center text-center gap-3">

            {game.state === "por_jugar" && !isInProgress && (
              <>
                <span className="uppercase text-xs tracking-widest opacity-70">
                  Próximo partido
                </span>

                <div className="text-3xl font-semibold">VS</div>

                <p className="text-xs sm:text-sm opacity-80">
                  {formatted}
                </p>
              </>
            )}

            {isInProgress && (
              <>
                <span className="uppercase tracking-widest text-yellow-400 animate-pulse text-xs sm:text-sm">
                  En curso
                </span>

                <div className="text-3xl font-semibold">VS</div>

                <p className="text-yellow-300/80 text-xs sm:text-sm">
                  Partido en desarrollo
                </p>
              </>
            )}

            {game.state === "finalizado" && (
              <>
                <p className="opacity-70 text-xs sm:text-sm uppercase tracking-wider">
                  Finalizado
                </p>

                <h1 className="tracking-tight text-4xl sm:text-4xl lg:text-5xl font-semibold">
                  {game.result.goalsFor}
                  <span className="mx-3 opacity-40">–</span>
                  {game.result.goalsAgainst}
                </h1>

                <div className="w-3/4 sm:max-w-xs h-px bg-violet-700/40" />

                {/* ================= GOLEADORES DESKTOP ================= */}
                <div className="hidden sm:flex justify-start w-full mt-2">

                  <div className="w-1/2 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">

                    {scorers.map((scorer, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>
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

          {/* RIVAL */}
          <div className="w-[35%] sm:w-[15%] flex flex-col items-center shrink-0">

            <img
              src={game.rival.logoUrl}
              alt={game.rival.name}
              className="
              w-24 h-24
              sm:w-24 sm:h-24
              lg:w-36 lg:h-36
              object-cover
              rounded-full
              scale-175 sm:scale-100
              translate-x-12 sm:translate-x-0
              "
            />

            <span className="hidden sm:block mt-2 text-sm lg:text-base">
              {game.rival.name}
            </span>

          </div>

        </div>

        {/* ================= GOLEADORES MOBILE ================= */}

        {game.state === "finalizado" && scorers.length > 0 && (
          <div className="sm:hidden mt-6 text-center">

            <button
              onClick={() => setShowScorers(!showScorers)}
              className="text-violet-400 text-sm"
            >
              {showScorers ? "Ocultar goleadores" : "Ver goleadores"}
            </button>

            {showScorers && (
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">

                {scorers.map((scorer, index) => (
                  <div key={index} className="flex items-center gap-1">

                    <span>
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
            )}

          </div>
        )}

      </div>
    </section>
  );
};

export default Game;