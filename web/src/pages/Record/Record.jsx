import { useEffect, useState } from "react";
import { getFinishedGames } from "../../lib/sanity";
import Loader from "../../components/Loader/Loader";

const RESULT_GRADIENT = {
  win: "from-green-700/60 to-green-700/0",
  draw: "from-neutral-400/60 to-neutral-400/0",
  loss: "from-red-500/60 to-red-500/0",
};

const Record = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinishedGames()
      .then((data) => setGames(data || []))
      .finally(() => setLoading(false));
  }, []);

  /* LOADER */
  if (loading) return <Loader />;

  /* EMPTY STATE */
  if (!games.length) {
    return (
      <div className="flex justify-center items-center h-64 text-neutral-400">
        No hay partidos registrados todavía
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-5xl font-extrabold mb-2 text-neutral-900">
        HISTORIAL
      </h1>
      <p className="text-neutral-500 mb-12">
        Todos los partidos jugados por Mentira FC. Algunos se recuerdan, otros
        se discuten.
      </p>

      <div className="flex flex-col gap-5">
        {games.map((game, index) => {
          const goalsFor = game.result.goalsFor;
          const goalsAgainst = game.result.goalsAgainst;

          const matchResult =
            goalsFor > goalsAgainst
              ? "win"
              : goalsFor < goalsAgainst
              ? "loss"
              : "draw";

          return (
            <div
              key={`${game.date}-${index}`}
              className="relative flex items-center justify-between gap-6 rounded-xl bg-neutral-50 px-6 py-4 shadow-sm overflow-hidden"
            >
              {/* Indicador resultado */}
              <div
                className={`absolute inset-y-0 left-0 w-4 bg-gradient-to-r ${RESULT_GRADIENT[matchResult]} rounded-l-xl`}
                aria-hidden="true"
              />

              {/* Rival */}
              <div className="flex items-center gap-4 w-1/3 pl-2">
                {game.rival?.logoUrl && (
                  <img
                    src={game.rival.logoUrl}
                    alt={game.rival.name}
                    className="w-11 h-11 object-contain"
                  />
                )}
                <div>
                  <p className="font-semibold text-lg text-neutral-800">
                    {game.rival.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {new Date(game.date).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              {/* Resultado */}
              <div className="text-center w-1/3">
                <p className="text-4xl font-extrabold text-neutral-800">
                  {goalsFor}
                  <span className="mx-2 text-neutral-400">-</span>
                  {goalsAgainst}
                </p>
                <p className="text-xs uppercase tracking-widest text-neutral-500">
                  {game.competition}
                </p>
              </div>

              {/* Ubicación */}
              <div className="text-right w-1/3 text-sm text-neutral-500">
                {game.location}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Record;
