import { useState } from "react";
import PlayerCard from "../../../components/PlayerCard/PlayerCard";

const TopScorers = ({ players }) => {
  const [page, setPage] = useState(0);

  const playersPerPage = 4;

  // 🔥 FILTRO CLAVE
  const playersWithGoals = players.filter((p) => p.goals > 0);

  const start = page * playersPerPage;
  const end = start + playersPerPage;

  const visiblePlayers = playersWithGoals.slice(start, end);

  const hasNext = end < playersWithGoals.length;
  const hasPrev = page > 0;

  // 🔥 EVITAR SECCIÓN VACÍA
  if (!playersWithGoals.length) return null;

  return (
    <section className="p-4 m-6 lg:col-span-2">
      {/* HEADER */}
      <div className="flex flex-col items-center lg:flex-row lg:items-center mb-8">
        <h2
          className="
            font-extrabold uppercase whitespace-nowrap
            text-white bg-violet-900 px-6 py-2
            text-center
            text-[clamp(1.2rem,5vw,1.6rem)]
            lg:text-violet-900 lg:bg-transparent lg:px-0 lg:py-0
          "
        >
          Máximos goleadores
        </h2>

        <div className="hidden lg:block bg-violet-900 h-8 flex-grow ml-4"></div>
      </div>

      {/* MOBILE CARRUSEL */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 lg:hidden">
        {playersWithGoals.map((player) => (
          <div
            key={player._id}
            className="snap-start shrink-0 w-[75%] sm:w-[55%]"
          >
            <PlayerCard
              key={player._id}
              player={player}
              mode="goals" />
          </div>
        ))}
      </div>

      {/* DESKTOP PAGINATION */}
      <div className="hidden lg:block">
        <div
          className={`flex ${
            visiblePlayers.length < 4
              ? "justify-start gap-12"
              : "justify-between"
          }`}
        >
          {visiblePlayers.map((player) => (
            <div key={player._id} className="w-[180px] lg:w-[200px]">
              <PlayerCard
                key={player._id}
                player={player}
                mode="goals" />
            </div>
          ))}
        </div>

        {/* CONTROLES */}
        {playersWithGoals.length > playersPerPage && (
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!hasPrev}
              className="
              px-4 py-2
              bg-neutral-900
              text-white
              disabled:opacity-30
              hover:bg-neutral-800
              transition
            "
            >
              ←
            </button>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasNext}
              className="
              px-4 py-2
              bg-neutral-900
              text-white
              disabled:opacity-30
              hover:bg-neutral-800
              transition
            "
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopScorers;