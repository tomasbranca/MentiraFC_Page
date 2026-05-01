import { useState } from "react";
import GameSkeleton from "./GameSkeleton/GameSkeleton";
import GameEmpty from "./GameEmpty/GameEmpty";

import { getImageUrl } from "../../../../data/imageService";
import { SoccerBallIcon } from "../../../components/icons/InlineIcons";
import { isGameInProgress, getScorers, getShortName } from "./game.utils";
import {
  SITE_LOGO_ASSETS,
  SITE_LOGO_SIZES,
  SITE_LOGO_SRC_SET,
} from "../../../constants/assets.constants";
import type { Game as GameModel } from "../../../../types/models";

import { formatDateTime } from "../../../utils/date.utils";

type GameProps = {
  game: GameModel | null;
  loading: boolean;
};

const Game = ({ game, loading }: GameProps) => {
  const [showScorers, setShowScorers] = useState(false);

  if (loading) return <GameSkeleton />;
  if (!game) return <GameEmpty />;

  const formatted = formatDateTime(game.date);
  const isInProgress = isGameInProgress(game);
  const scorers = getScorers(game.events || []);

  const renderFootballs = (goals: number) =>
    Array.from({ length: goals }).map((_, i) => (
      <SoccerBallIcon
        key={i}
        className="size-3 text-violet-400 sm:size-4"
      />
    ));

  return (
    <section className="relative overflow-hidden bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-violet-50 border-t-2 border-violet-700 shadow-lg shadow-black/30 py-12 sm:py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* LOCAL */}
          <div className="w-[35%] sm:w-[15%] flex flex-col items-center shrink-0">
            <img
              src={SITE_LOGO_ASSETS.large}
              srcSet={SITE_LOGO_SRC_SET}
              sizes={SITE_LOGO_SIZES}
              alt="Mentira FC"
              width={160}
              height={160}
              className="w-24 h-24 sm:w-24 sm:h-24 lg:w-36 lg:h-36 object-cover rounded-full scale-175 sm:scale-100 -translate-x-12 sm:translate-x-0"
            />

            <span className="hidden sm:block mt-2 text-sm lg:text-base">
              Mentira FC
            </span>
          </div>

          {/* CENTRO */}
          <div className="w-[30%] sm:w-[70%] flex flex-col items-center text-center gap-3">
            {game.state === "por_jugar" && !isInProgress && (
              <>
                <span className="uppercase text-xs tracking-widest opacity-70">
                  Próximo partido
                </span>

                <div className="text-3xl font-semibold">VS</div>

                <p className="text-xs sm:text-sm opacity-80">{formatted}</p>
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

                {/* GOLEADORES DESKTOP */}
                <div className="hidden sm:flex justify-start w-full mt-2">
                  <div className="w-1/2 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
                    {scorers.map((scorer, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>
                          {getShortName(
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
              src={getImageUrl(game.rival.imageUrl, {
                width: 144,
                height: 144,
                fit: "max",
                quality: 70,
                autoFormat: true,
              })}
              alt={game.rival.name}
              width={144}
              height={144}
              className="w-24 h-24 sm:w-24 sm:h-24 lg:w-36 lg:h-36 object-cover rounded-full scale-175 sm:scale-100 translate-x-12 sm:translate-x-0"
            />

            <span className="hidden sm:block mt-2 text-sm lg:text-base">
              {game.rival.name}
            </span>
          </div>
        </div>

        {/* GOLEADORES MOBILE */}
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
                      {getShortName(
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
