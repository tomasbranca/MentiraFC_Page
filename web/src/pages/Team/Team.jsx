import { useEffect, useState } from "react";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import { getPlayers } from "../../lib/sanity";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";

import { FaChessRook } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { GiGloves, GiCannon } from "react-icons/gi";

/* CONFIGURACIÓN DE COLUMNAS */

const CARDS_PER_ROW = {
  mobile: 2,
  tablet: 3,
  desktop: 5,
};

const getColumns = () => {
  const width = window.innerWidth;

  if (width < 640) return CARDS_PER_ROW.mobile;
  if (width < 1024) return CARDS_PER_ROW.tablet;

  return CARDS_PER_ROW.desktop;
};

const POSITION_ICONS = {
  arq: <GiGloves />,
  def: <FaChessRook />,
  med: <FaGears />,
  del: <GiCannon />,
};

const Team = () => {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [columns, setColumns] = useState(getColumns());

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getPlayers()
      .then((data) => {
        setPlayers(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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

  const renderSection = (title, position) => {
    const filtered = players
      .filter((p) => p.position === position)
      .sort((a, b) => a.number - b.number);

    if (filter !== "all" && filter !== position) return null;
    if (!filtered.length) return null;

    return (
      <section className="w-full mb-8 md:mb-10 bg-neutral-800 md:border border-violet-100 p-5 md:p-8">
        <div className="md:flex items-center justify-between mb-5 md:mb-6 md:border-b border-violet-200 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl text-violet-50">
              {POSITION_ICONS[position]}
            </span>

            <h3 className="text-xl md:text-2xl font-extrabold uppercase tracking-wide text-violet-50">
              {title}
            </h3>
          </div>

          <span className="text-sm font-semibold text-violet-200">
            {filtered.length} {filtered.length === 1 ? "jugador" : "jugadores"}
          </span>
        </div>

        <div
          className="grid gap-5 md:gap-8"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
          }}
        >
          {filtered.map((player) => (
            <PlayerCard key={player._id} player={player} />
          ))}
        </div>
      </section>
    );
  };

  const filters = [
    { id: "all", label: "Todos" },
    { id: "arq", label: "Arqueros" },
    { id: "def", label: "Defensores" },
    { id: "med", label: "Mediocampistas" },
    { id: "del", label: "Delanteros" },
  ];

  return (
    <>
      <div className="w-full md:max-w-7xl md:mx-auto md:px-4 md:py-12">
        <div className="bg-neutral-900  md:border border-gray-200 shadow-sm">
          {/* HEADER */}

          <header className="w-full p-5 md:p-8 md:border-b border-gray-200 bg-violet-900">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-violet-50 tracking-tight">
              Plantel Profesional
            </h1>

            <p className="text-base md:text-lg text-violet-200 mt-2">
              Temporada {new Date().getFullYear()}
            </p>

            {/* ================= MOBILE / TABLET ================= */}

            <div className="lg:hidden mt-6">
              {/* BOTÓN ACORDEÓN */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="
                  w-full
                  bg-gradient-to-r from-violet-700 to-violet-600
                  px-4 py-3
                  text-white
                  font-semibold
                  flex justify-between items-center

                  rounded-lg
                  shadow-md
                  hover:shadow-lg
                  hover:from-violet-600 hover:to-violet-500

                  transition-all duration-300
                  active:scale-[0.97]
                "
              >
                <span>Filtrar posiciones</span>

                <span
                  className={`
                    transition-transform duration-300
                    ${filtersOpen ? "rotate-180" : ""}
                  `}
                >
                  ▾
                </span>
              </button>

              {/* CONTENIDO */}
              <div
                className={`
                  overflow-hidden
                  transition-all duration-500 ease-in-out
                  ${filtersOpen ? "max-h-[300px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                `}
              >
                <div
                  className="
                  bg-violet-900/60
                    backdrop-blur-md
                    border border-violet-500/20
                    rounded-xl
                    p-4
                    flex flex-wrap gap-3 justify-center
                  "
                >
                  {filters.map(({ id, label }) => (
                    <Button
                      key={id}
                      onClick={() => setFilter(id)}
                      active={filter === id}
                      variant="filter"
                      className="
                        !rounded-md
                        !px-4
                        !py-2
                        text-sm
                      "
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* ================= DESKTOP ================= */}

            <div
              className="
                hidden lg:flex
                mt-8

                bg-neutral-900/70
                backdrop-blur-md
                border border-neutral-700
                rounded-xl

                p-3
                flex-wrap gap-3 justify-center
              "
            >
              {filters.map(({ id, label }) => (
                <Button
                  key={id}
                  onClick={() => setFilter(id)}
                  active={filter === id}
                  variant="filter"
                  className="
                    !rounded-md
                    !px-5
                    !py-2
                    text-sm font-semibold tracking-wide
                  "
                >
                  {label}
                </Button>
              ))}
            </div>
          </header>

          {/* CONTENIDO */}

          <div className="p-5 md:p-8">
            {players.length > 0 && (
              <>
                {renderSection("Arqueros", "arq")}
                {renderSection("Defensores", "def")}
                {renderSection("Mediocampistas", "med")}
                {renderSection("Delanteros", "del")}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Team;
