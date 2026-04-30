// @ts-nocheck
import { useState } from "react";
import { getImageUrl } from "../../../data/imageService";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";

import { useRecordData } from "./hooks/useRecordData";
import {
  paginateGames,
  groupGamesByMonth,
  getMatchResult,
  getScorers,
} from "./record.utils";
import { RESULT_STYLES, PAGE_SIZE } from "./record.constants";
import { formatDate } from "../../utils/date.utils";
import "./Record.css";

const Record = () => {
  const { games, loading, error, refetch } = useRecordData();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openGame, setOpenGame] = useState(null);

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudo cargar el historial"
        message="Intentá nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  const visibleGames = paginateGames(games, visibleCount);
  const groupedGames = groupGamesByMonth(visibleGames);
  const hasMore = visibleCount < games.length;

  return (
    <section className="max-w-6xl mx-auto md:px-4 md:py-10">
      <div className="bg-neutral-900 border border-neutral-800 overflow-hidden">
        {/* HEADER */}
        <header className="px-4 sm:px-8 py-5 sm:py-6 border-b border-neutral-800">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            Historial de partidos
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Registro oficial de todos los encuentros disputados.
          </p>
        </header>

        {/* EMPTY */}
        {!games.length && (
          <div className="py-20 text-center text-neutral-500">
            No hay partidos registrados todavía
          </div>
        )}

        {/* LISTA */}
        <div>
          {Object.entries(groupedGames).map(([group, games]) => (
            <div key={group}>
              {/* MES */}
              <div className="px-4 sm:px-6 py-2 text-xs uppercase tracking-wider text-neutral-500 bg-neutral-800">
                {group}
              </div>

              {games.map((game) => {
                const result = getMatchResult(game);
                const styles = RESULT_STYLES[result];
                const scorers = getScorers(game.events || []);
                const isOpen = openGame === game.id;
                const hasScorers = scorers.length > 0;

                return (
                  <div key={game.id} className="border-b border-neutral-800">
                    {/* ITEM */}
                    <div
                      onClick={() =>
                        hasScorers ? setOpenGame(isOpen ? null : game.id) : null
                      }
                      className={`
                        px-4 sm:px-6 py-4 flex flex-col gap-2
                        ${
                          hasScorers ? "cursor-pointer active:scale-[0.98]" : ""
                        }
                        hover:bg-neutral-800/60 transition
                      `}
                    >
                      {/* FILA PRINCIPAL */}
                      <div className="flex justify-between items-center">
                        {/* IZQUIERDA */}
                        <div className="flex items-center gap-3">
                          {game.rival?.imageUrl && (
                            <ProgressiveMedia
                              src={getImageUrl(game.rival.imageUrl, {
                                width: 40,
                                height: 40,
                                fit: "max",
                                quality: 70,
                                autoFormat: true,
                              })}
                              alt={game.rival.name}
                              wrapperClassName="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                              width={40}
                              height={40}
                              className="object-contain"
                              loading="lazy"
                              decoding="async"
                              skeletonClassName="rounded-full bg-neutral-700"
                            />
                          )}

                          <div>
                            <p className="text-sm sm:text-base font-semibold text-neutral-100">
                              {game.rival.name}
                            </p>

                            <p className="text-xs text-neutral-500">
                              {formatDate(game.date)}
                            </p>
                          </div>
                        </div>

                        {/* DERECHA */}
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-2xl sm:text-4xl font-extrabold text-neutral-100">
                              {game.result.goalsFor}
                              <span className="mx-1 text-neutral-500">–</span>
                              {game.result.goalsAgainst}
                            </p>

                            <p
                              className={`text-[10px] sm:text-xs font-semibold tracking-widest ${styles.text}`}
                            >
                              {styles.label}
                            </p>
                          </div>

                          {/* FLECHA */}
                          {hasScorers && (
                            <span
                              className={`text-neutral-500 text-xs transition-transform duration-300 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            >
                              ▼
                            </span>
                          )}
                        </div>
                      </div>

                      {/* TEXTO UX */}
                      {hasScorers && !isOpen && (
                        <p className="text-[10px] text-neutral-500">
                          Ver goleadores
                        </p>
                      )}

                      {/* INFO EXTRA */}
                      <div className="text-xs text-neutral-400">
                        {game.competition === "Torneo"
                          ? game.tournament
                          : game.competition}
                        <span className="hidden md:inline">
                          {" "}
                          · {game.location}
                        </span>
                      </div>
                    </div>

                    {/* ACORDEÓN */}
                    {hasScorers && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? "max-h-125" : "max-h-0"
                        }`}
                      >
                        <div
                          className={`
                            px-6 pb-4 text-xs text-neutral-300
                            ${isOpen ? "animate-fadeIn" : ""}
                          `}
                        >
                          <p className="mb-2 text-neutral-400 font-semibold">
                            Goleadores
                          </p>

                          <ul className="space-y-1">
                            {scorers.map((scorer, i) => (
                              <li key={`${scorer.player?.name}-${i}`}>
                                {scorer.player?.name} {scorer.player?.lastName}{" "}
                                ({scorer.goals})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        {hasMore && (
          <div className="flex justify-center py-6 sm:py-8 border-t border-neutral-800">
            <Button
              variant="ghostStrong"
              className="px-6 py-2.5 rounded-md text-sm w-full max-w-xs"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              Cargar más partidos
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Record;
