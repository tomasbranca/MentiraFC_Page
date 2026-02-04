import { useEffect, useState } from "react";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import { getPlayers } from "../../lib/sanity";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";

import { FaChessRook } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { GiGloves, GiCannon } from "react-icons/gi";


const POSITION_ICONS = {
  arq: <GiGloves />,
  def: <FaChessRook />,
  med: <FaGears />,
  del: <GiCannon />,
};

const Team = () => {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      <main className="min-h-screen px-4 py-12 flex items-center justify-center">
        <div className="bg-white border border-gray-200 p-10 max-w-md text-center">
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
    const filtered = players.filter((p) => p.position === position);
    if (filter !== "all" && filter !== position) return null;
    if (!filtered.length) return null;

    return (
      <section className="mb-10 bg-violet-50 border border-violet-100 p-8">
        <div className="flex items-center justify-between mb-6 border-b border-violet-200 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl text-violet-800">
              {POSITION_ICONS[position]}
            </span>
            <h3 className="text-2xl font-extrabold uppercase tracking-wide text-gray-900">
              {title}
            </h3>
          </div>

          <span className="text-sm font-semibold text-gray-600">
            {filtered.length} jugadores
          </span>
        </div>

        <div className="flex flex-wrap gap-8">
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
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* PANEL PRINCIPAL */}
        <div className="bg-white border border-gray-200 shadow-sm">
          {/* HEADER */}
          <header className="p-8 border-b border-gray-200 bg-gray-50">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Plantel Profesional
            </h1>

            <p className="text-lg text-gray-500 mt-2">
              Temporada {new Date().getFullYear()}
            </p>

            {/* FILTROS */}
            <div className="mt-8 bg-white border border-gray-200 p-4 flex flex-wrap gap-2">
              {filters.map(({ id, label }) => (
                <Button
                  key={id}
                  onClick={() => setFilter(id)}
                  active={filter === id}
                  className="
                    !rounded-none
                    !px-6
                    !py-2
                    text-sm
                    font-semibold
                    tracking-wide
                  "
                >
                  {label}
                </Button>
              ))}
            </div>
          </header>

          {/* CONTENIDO */}
          <div className="p-8">
            {players.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 p-16 text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  No hay jugadores cargados
                </h3>
                <p className="text-gray-500">
                  El plantel aún no fue publicado.
                </p>
              </div>
            )}

            {players.length > 0 && (
              <>
                {renderSection("Arqueros", "arq")}
                {renderSection("Defensores", "def")}
                {renderSection("Mediocampistas", "med")}
                {renderSection("Delanteros", "del")}
              </>
            )}

            {players.length > 0 &&
              filter !== "all" &&
              players.filter((p) => p.position === filter).length === 0 && (
                <div className="bg-gray-50 border border-gray-200 p-16 text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    No hay jugadores en esta posición
                  </h3>
                  <Button onClick={() => setFilter("all")}>
                    Ver plantel completo
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Team;
