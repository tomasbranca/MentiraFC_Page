import { useParams, Link } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { FaArrowLeft } from "react-icons/fa";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";

import { usePlayerDetail } from "./hooks/usePlayerDetail";
import { POSITION_MAP, type PlayerPositionId } from "./playerDetail.constants";
import { formatLongDate, calculateAge } from "../../utils/date.utils";
import { ROUTES } from "../../constants/routes.constants";

const PlayerDetail = () => {
  const { slug } = useParams();
  const { player, loading, error, year, refetch } = usePlayerDetail(slug);

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudo cargar el jugador"
        message="Intentá nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  if (!player) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-500">
        Jugador no encontrado
      </div>
    );
  }

  const position =
    player.position && player.position in POSITION_MAP
      ? POSITION_MAP[player.position as PlayerPositionId]
      : null;
  const Icon = position?.icon;

  return (
    <div className="max-w-6xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-6 lg:py-8">
      {/* Volver */}
      <Link
        to={ROUTES.TEAM}
        className="items-center gap-2 text-sm text-violet-700 hover:text-violet-950 mb-4 hidden sm:inline-flex"
      >
        <FaArrowLeft /> Volver al plantel
      </Link>

      <div className="border border-neutral-800 bg-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* IMAGEN */}
          <div className="w-full aspect-3/4">
            <ProgressiveMedia
              src={player.imageUrl ?? undefined}
              alt={`${player.name} ${player.lastName}`}
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover border-b-2 border-violet-700 lg:border-0"
              skeletonClassName="bg-neutral-800"
              loading="eager"
              decoding="async"
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

              <p className="mt-3 text-xs tracking-widest text-violet-200 flex items-center gap-2">
                {Icon && <Icon className="text-sm" />}
                {position?.label || "POSICIÓN"}
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
                  {formatLongDate(player.birthDate)}
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
