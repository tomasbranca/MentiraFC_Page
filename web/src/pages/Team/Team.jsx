import { useEffect, useState } from "react";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import { getPlayers } from "../../lib/sanity";
import Button from "../../components/Button/Button";

const Team = () => {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayers()
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filtros para secciones
  const renderSection = (title, position) => {
    const filtered = players.filter((p) => p.position === position);
    if (filter !== "all" && filter !== position) return null;
    if (!filtered.length) return null;

    return (
      <section className="mb-16">
        {/* Encabezado de sección */}
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

        {/* Grid de jugadores */}
        <div className="flex flex-wrap gap-6">
          {filtered.map((player) => (
            <PlayerCard key={player._id} player={player} className="transition-transform duration-300 hover:-translate-y-1" />
          ))}
        </div>
      </section>
    );
  };

  // Filtros rápidos
  const filters = [
    { id: "all", label: "Todos" },
    { id: "arq", label: "Arqueros" },
    { id: "def", label: "Defensores" },
    { id: "med", label: "Mediocampistas" },
    { id: "del", label: "Delanteros" },
  ];

  if (loading) {
    return (
      <>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 rounded w-64 mb-8"></div>
            <div className="h-8 rounded w-full mb-12"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-6">
            <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">
              Mentira FC
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mt-2 mb-4">
              Plantel{" "}
              <span className="text-violet-800">
                {" "}
                {new Date().getFullYear()}{" "}
              </span>
            </h1>
          </div>

          {/* Filtros */}
          <div className="mb-10">
            <div className="flex flex-wrap gap-3">
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
          </div>
        </header>

        {/* Secciones de jugadores */}
        <div className="pb-12 transition-all duration-300">
          {filter === "all" || filter === "arq"
            ? renderSection("Arqueros", "arq")
            : null}
          {filter === "all" || filter === "def"
            ? renderSection("Defensores", "def")
            : null}
          {filter === "all" || filter === "med"
            ? renderSection("Mediocampistas", "med")
            : null}
          {filter === "all" || filter === "del"
            ? renderSection("Delanteros", "del")
            : null}

          {/* Si no hay jugadores en el filtro seleccionado */}
          {players.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                No hay jugadores disponibles
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Actualmente no hay información del plantel. Vuelve pronto para
                conocer a nuestros jugadores.
              </p>
            </div>
          )}

          {players.length > 0 &&
            filter !== "all" &&
            players.filter((p) => p.position === filter).length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  No hay jugadores en esta posición
                </h3>
                <p className="text-gray-500 mb-6">
                  No encontramos jugadores para la posición seleccionada.
                </p>
                <Button onClick={() => setFilter("all")} variant="gradient">
                  Ver todos los jugadores
                </Button>
              </div>
            )}
        </div>
      </div>
    </main>
  );
};

export default Team;
