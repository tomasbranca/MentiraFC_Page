import { useEffect, useState } from "react";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import { getPlayers } from "../../lib/sanity";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";

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
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">
            Error al cargar el plantel
          </h2>
          <p className="text-gray-500">
            Hubo un problema al obtener la información de los jugadores.
            Intentá recargar la página en unos segundos.
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
      <section className="mb-16">
        <div className="flex items-center mb-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-violet-800">
              {title}
            </h3>
            <p className="text-sm text-gray-500 tracking-wide">
              {filtered.length} jugadores
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {filtered.map((player) => (
            <PlayerCard
              key={player._id}
              player={player}
              className="transition-transform duration-300 hover:-translate-y-1"
            />
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
    <main className="min-h-screen px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">
            Mentira FC
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mt-2 mb-4">
            Plantel{" "}
            <span className="text-violet-800">
              {new Date().getFullYear()}
            </span>
          </h1>

          <div className="flex flex-wrap gap-3 mt-6">
            {filters.map(({ id, label }) => (
              <Button
                key={id}
                onClick={() => setFilter(id)}
                active={filter === id}
                variant="gradient"
              >
                {label}
              </Button>
            ))}
          </div>
        </header>

        {/* Contenido */}
        <div className="pb-12">
          {players.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No hay jugadores disponibles
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Actualmente no hay información del plantel.
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
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  No hay jugadores en esta posición
                </h3>
                <Button onClick={() => setFilter("all")} variant="gradient">
                  Ver todos
                </Button>
              </div>
            )}
        </div>
      </div>
    </main>
  );
};

export default Team;
