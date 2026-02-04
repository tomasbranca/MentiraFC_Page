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
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-lg text-white shadow">
              {POSITION_ICONS[position]}
            </span>
            <div>
              <h3 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900">
                {title}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Línea táctica del primer equipo
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-sm font-semibold text-slate-600">
            {filtered.length} jugadores
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-8">
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
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,234,212,0.18),transparent_55%)]" />
          <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-violet-700/20 blur-3xl" />

          {/* HEADER */}
          <header className="relative z-10 border-b border-slate-800 px-8 py-10">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Primer equipo · Temporada {new Date().getFullYear()}
                </span>
                <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
                  Plantel Profesional
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-slate-300">
                  Un plantel construido con carácter, intensidad y la identidad
                  del club en cada línea.
                </p>
              </div>

              <div className="grid gap-4 text-right sm:min-w-[220px]">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Sede
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Complejo Mentira FC
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Filosofía
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Protagonismo y orden
                  </p>
                </div>
              </div>
            </div>

            {/* FILTROS */}
            <div className="mt-10 flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              {filters.map(({ id, label }) => (
                <Button
                  key={id}
                  onClick={() => setFilter(id)}
                  active={filter === id}
                  className="
                    !rounded-full
                    !px-6
                    !py-2
                    text-sm
                    font-semibold
                    tracking-wide
                    !bg-slate-900/80
                    !text-slate-100
                    hover:!bg-emerald-500
                    hover:!text-slate-950
                  "
                >
                  {label}
                </Button>
              ))}
            </div>
          </header>

          {/* CONTENIDO */}
          <div className="relative z-10 bg-slate-50 px-8 py-10 text-slate-900">
            {players.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
                <h3 className="mb-4 text-2xl font-bold text-slate-800">
                  No hay jugadores cargados
                </h3>
                <p className="text-slate-500">
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
                <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
                  <h3 className="mb-6 text-2xl font-bold text-slate-800">
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
