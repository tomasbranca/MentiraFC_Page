import { useEffect, useState } from "react";
import { getFinishedGames } from "../../lib/sanity";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/Button/Button";

const RESULT_STYLES = {
  win: {
    bar: "from-green-700/70 to-green-700/0",
    text: "text-green-700",
    label: "VICTORIA",
  },
  draw: {
    bar: "from-neutral-400/70 to-neutral-400/0",
    text: "text-neutral-500",
    label: "EMPATE",
  },
  loss: {
    bar: "from-red-600/70 to-red-600/0",
    text: "text-red-600",
    label: "DERROTA",
  },
};

const PAGE_SIZE = 10;

const Record = () => {
  const [games, setGames] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinishedGames()
      .then((data) => setGames(data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const visibleGames = games.slice(0, visibleCount);
  const hasMore = visibleCount < games.length;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* HEADER */}
        <header className="px-8 py-6 border-b border-neutral-200">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Historial de partidos
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Registro oficial de todos los encuentros disputados en { new Date().getFullYear() }.
          </p>
        </header>

        {/* EMPTY STATE */}
        {!games.length && (
          <div className="py-20 text-center text-neutral-400">
            No hay partidos registrados todavía
          </div>
        )}

        {/* LISTA DE PARTIDOS */}
        <div className="divide-y divide-neutral-100">
          {visibleGames.map((game, index) => {
            const goalsFor = game.result.goalsFor;
            const goalsAgainst = game.result.goalsAgainst;

            const matchResult =
              goalsFor > goalsAgainst
                ? "win"
                : goalsFor < goalsAgainst
                ? "loss"
                : "draw";

            const styles = RESULT_STYLES[matchResult];

            return (
              <div
                key={`${game.date}-${index}`}
                className="relative flex items-center px-8 py-5 gap-6 hover:bg-neutral-50 transition-colors"
              >
                {/* BARRA RESULTADO */}
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r ${styles.bar}`}
                  aria-hidden="true"
                />

                {/* RIVAL */}
                <div className="flex items-center gap-4 w-1/3 pl-2">
                  {game.rival?.logoUrl && (
                    <img
                      src={game.rival.logoUrl}
                      alt={game.rival.name}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {game.rival.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(game.date).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>

                {/* RESULTADO */}
                <div className="w-1/3 text-center">
                  <p className="text-3xl font-extrabold text-neutral-900">
                    {goalsFor}
                    <span className="mx-1 text-neutral-400">–</span>
                    {goalsAgainst}
                  </p>
                  <p
                    className={`text-xs font-semibold tracking-widest mt-1 ${styles.text}`}
                  >
                    {styles.label}
                  </p>
                </div>

                {/* DETALLES */}
                <div className="w-1/3 text-right text-sm text-neutral-500">
                  <p className="font-medium text-neutral-700">
                    {game.competition}
                  </p>
                  <p>{game.location}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER / CARGAR MÁS */}
        {hasMore && (
          <div className="flex justify-center py-8 border-t border-neutral-200 bg-neutral-50">
            <Button
              variant="gradient"
              onClick={() =>
                setVisibleCount((prev) => prev + PAGE_SIZE)
              }
            >
              Cargar más
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Record;
