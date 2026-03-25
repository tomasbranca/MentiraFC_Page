import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPlayerWithGoalsByYear } from "../../lib/sanity";
import { FaArrowLeft } from "react-icons/fa";
import { FaChessRook } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { GiGloves, GiCannon } from "react-icons/gi";
import Loader from "../../components/Loader/Loader";

const POSITION_MAP = {
  arq: (
    <span className="flex items-center gap-2">
      <GiGloves className="text-sm" />
      <span>ARQUERO</span>
    </span>
  ),
  def: (
    <span className="flex items-center gap-2">
      <FaChessRook className="text-sm" />
      <span>DEFENSOR</span>
    </span>
  ),
  med: (
    <span className="flex items-center gap-2">
      <FaGears className="text-sm" />
      <span>MEDIOCAMPISTA</span>
    </span>
  ),
  del: (
    <span className="flex items-center gap-2">
      <GiCannon className="text-sm" />
      <span>DELANTERO</span>
    </span>
  ),
};

const PlayerDetail = () => {
  const { slug } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    getPlayerWithGoalsByYear(slug, year)
      .then((data) => setPlayer(data))
      .finally(() => setLoading(false));
  }, [slug, year]);

  const formatDate = (date) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  const calculateAge = (date) => {
    const birth = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) return <Loader />;

  if (!player) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-500">
        Jugador no encontrado
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-6 lg:py-8">
      {/* Volver */}
      <Link
        to="/plantel"
        className="items-center gap-2 text-sm text-violet-700 hover:text-violet-950 mb-4 hidden sm:inline-flex"
      >
        <FaArrowLeft /> Volver al plantel
      </Link>

      <div className="border border-neutral-800 bg-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* IMAGEN */}
          <div className="w-full aspect-[3/4]">
            <img
              src={player.imageUrl}
              alt={`${player.name} ${player.lastName}`}
              className="w-full h-full object-cover border-b-2 border-violet-700 lg:border-0"
            />
          </div>

          {/* DERECHA */}
          <div className="flex flex-col">
            {/* INFO */}
            <div className="bg-violet-900 text-violet-50 p-5 sm:p-6 lg:p-8 flex flex-1 flex-col justify-center">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold opacity-30">
                #{player.number}
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 leading-tight">
                {player.name.toUpperCase()}
                <br />
                <span className="font-black">
                  {player.lastName.toUpperCase()}
                </span>
              </h1>

              <p className="mt-3 text-xs tracking-widest text-violet-200">
                {POSITION_MAP[player.position] || "POSICIÓN"}
              </p>
            </div>

            {/* STATS */}
            <div className="bg-neutral-900 text-violet-50 grid grid-cols-2 gap-5 sm:gap-6 p-5 sm:p-6 lg:p-8">
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">EDAD</p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {calculateAge(player.birthDate)} años
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-neutral-400">
                  GOLES ({year})
                </p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {player.goalsThisYear ?? 0}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs sm:text-sm text-neutral-400">
                  FECHA DE NACIMIENTO
                </p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {formatDate(player.birthDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;