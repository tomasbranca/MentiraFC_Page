import { getGame } from "../../../lib/sanity";
import { useEffect, useState } from "react";

const Game = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      const data = await getGame();
      setGame(data);
      setLoading(false);
    };
    fetchGame();
  }, []);

  const date = new Date(game?.date);

  const formatted = date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24 hs
  });

  if (loading) return <p>Cargando...</p>;
  if (!game) return <p>No hay partidos cargados.</p>;

  const scorersList = game?.result?.scorers ? [...new Set(game.result.scorers)] : [];

  function countGoals(scorer) {
    return game.result?.scorers.filter((s) => s === scorer).length;
  }

  function printFootballs(scorer) {
    const goals = countGoals(scorer);
    let footballs = [];
    for (let i = 0; i < goals; i++) {
      footballs.push(
        <svg key={i} className="w-4 h-4 fill-violet-50">
          <use xlinkHref="/sprite.svg#football" />
        </svg>
      );
    }
    return footballs;
  }

  return (
    <div
      className="game-component bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-violet-50 p-6 
      shadow-black/30 shadow-lg flex items-center justify-center mb-4 border-t-2 border-violet-700"
    >
      {/* Equipo local */}
      <div className="w-40 h-40 rounded-full flex-shrink-0">
        <img
          src="/logo.webp"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Centro */}
      <div className="text-center text-violet-50 font-semibold flex flex-col items-center px-4 w-2xl">
        {game.state === "por_jugar" && (
          <>
            <h3 className="text-2xl">Próximo partido</h3>
            <h5 className="flex text-lg mt-5 justify-center items-center gap-2">
              <svg className="w-6 h-6 fill-violet-50">
                <use xlinkHref="/sprite.svg#calendar" />
              </svg>
              {formatted}
            </h5>
          </>
        )}

        {game.state === "en_curso" && (
          <h5 className="text-green-400 text-m">En curso</h5>
        )}
        {game.state === "finalizado" && (
          <>
            <p className="text-sm mt-1">Finalizado</p>

            <h3 className="text-8xl leading-none my-4">
              {game.result.goalsFor} - {game.result.goalsAgainst}
            </h3>
            <div className="w-full">
              <div className="max-h-24 text-start w-1/2 flex flex-wrap">
                {
                  scorersList.map((scorer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 mr-4 mb-2"
                    >
                      <span>{scorer}</span>
                      <span className="flex">{printFootballs(scorer)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}

        <h5 className="mt-4 flex justify-center text-m items-center gap-2">
          <svg className="w-4 h-4 fill-violet-50">
            <use xlinkHref="/sprite.svg#location" />
          </svg>
          {game.location} - {game.competition}
        </h5>
      </div>

      {/* Rival */}
      <div className="w-40 h-40 rounded-full flex-shrink-0">
        <img
          src={game.rival.logoUrl}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    </div>
  );
};

export default Game;
