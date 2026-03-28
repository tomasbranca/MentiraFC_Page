import { useState } from "react";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";

import { useTeamData } from "./hooks/useTeamdata";
import { getFilteredSections } from "./team.utils";
import { POSITION_CONFIG, FILTERS } from "./team.constants";

const Team = () => {
  const { players, grouped, loading, error } = useTeamData();

  const [filter, setFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  

  if (loading) return <Loader />;

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-violet-950">
        <div className="bg-white md:border border-gray-200 p-10 max-w-md text-center">
          <h2 className="text-2xl font-extrabold mb-4 text-gray-900">
            Error al cargar el plantel
          </h2>

          <p className="text-gray-500">
            No se pudo obtener la información de los jugadores. Intentá recargar
            la página.
          </p>
        </div>
      </main>
    );
  }

  const sections = getFilteredSections(grouped, filter);

  return (
    <div className="w-full md:max-w-7xl md:mx-auto md:px-4 md:py-12">
      <div className="bg-neutral-900 md:border border-gray-200 shadow-sm">
        
        {/* HEADER */}
        <header className="w-full p-5 md:p-8 md:border-b border-gray-200 bg-violet-900">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-violet-50 tracking-tight">
            Plantel Profesional
          </h1>

          <p className="text-base md:text-lg text-violet-200 mt-2">
            Temporada {new Date().getFullYear()}
          </p>

          {/* MOBILE */}
          <div className="lg:hidden mt-6">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full bg-gradient-to-r from-violet-700 to-violet-600 px-4 py-3 text-white font-semibold flex justify-between items-center rounded-lg shadow-md transition-all duration-300"
            >
              <span>Filtrar posiciones</span>
              <span className={`${filtersOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-500 ${
                filtersOpen ? "max-h-[300px] opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-violet-900/60 border border-violet-500/20 rounded-xl p-4 flex flex-wrap gap-3 justify-center">
                {FILTERS.map(({ id, label }) => (
                  <Button
                    key={id}
                    onClick={() => setFilter(id)}
                    active={filter === id}
                    variant="filter"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:flex mt-8 bg-neutral-900/70 border border-neutral-700 rounded-xl p-3 flex-wrap gap-3 justify-center">
            {FILTERS.map(({ id, label }) => (
              <Button
                key={id}
                onClick={() => setFilter(id)}
                active={filter === id}
                variant="filter"
              >
                {label}
              </Button>
            ))}
          </div>
        </header>

        {/* CONTENIDO */}
        <div className="p-5 md:p-8">
          {players.length > 0 &&
            Object.entries(sections).map(([position, list]) => {
              if (!list?.length) return null;

              const config = POSITION_CONFIG[position];
              const Icon = config.icon;

              return (
                <section
                  key={position}
                  className="w-full mb-8 md:mb-10 bg-neutral-800 md:border border-violet-100 p-5 md:p-8"
                >
                  <div className="md:flex items-center justify-between mb-5 md:mb-6 md:border-b border-violet-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-violet-50">
                        {Icon && <Icon />}
                      </span>

                      <h3 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide text-violet-50">
                        {config.label}
                      </h3>
                    </div>

                    <span className="text-sm font-semibold text-violet-200">
                      {list.length}{" "}
                      {list.length === 1 ? "jugador" : "jugadores"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-8">
                    {list.map((player) => (
                      <PlayerCard key={player._id} player={player} />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Team;