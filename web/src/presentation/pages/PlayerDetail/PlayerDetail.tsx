import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { FaArrowLeft } from "react-icons/fa";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";
import RosterNavigation from "../../components/RosterNavigation/RosterNavigation";
import { buildRosterNavigationItems } from "../../components/RosterNavigation/rosterNavigation.utils";
import StaffCard from "../../components/StaffCard/StaffCard";
import Button from "../../components/Button/Button";

import { getImageUrl } from "../../../data/imageService";
import { usePlayerDetail } from "./hooks/usePlayerDetail";
import { POSITION_MAP, type PlayerPositionId } from "./playerDetail.constants";
import { formatLongDate, calculateAge } from "../../utils/date.utils";
import { useElementHeight } from "../../hooks/useElementHeight";
import { useRosterMembers } from "../../hooks/queries/useRosterMembers";
import { ROUTES } from "../../../shared/routing";
import {
  buildMissingPlayerHead,
  buildPlayerHead,
  STATIC_PAGE_HEAD,
} from "../../seo/metadata";
import { usePageHead } from "../../seo/usePageHead";
import { DominantFootIndicator } from "./DominantFootIndicator";
import PlayerRatingsHexagon from "./PlayerRatingsHexagon";
import { getPlayerRatingHexagonPoints } from "./playerRatingsHexagon.utils";

const PlayerDetail = () => {
  const { slug } = useParams();
  const { height: detailCardHeight, ref: detailCardRef } =
    useElementHeight<HTMLDivElement>();
  const { player, loading, error, year, refetch } = usePlayerDetail(slug);
  const { players, staffMembers } = useRosterMembers("PlayerDetail");
  const [showRatingsHexagon, setShowRatingsHexagon] = useState(false);
  const position =
    player?.position && player.position in POSITION_MAP
      ? POSITION_MAP[player.position as PlayerPositionId]
      : null;
  const metadata = useMemo(
    () =>
      loading
        ? STATIC_PAGE_HEAD.team
        : player
          ? buildPlayerHead(player, position?.label)
          : buildMissingPlayerHead(slug),
    [loading, player, position?.label, slug]
  );
  const rosterItems = useMemo(
    () =>
      buildRosterNavigationItems({
        activePlayer: player,
        players,
        staffMembers,
      }),
    [player, players, staffMembers]
  );

  usePageHead(metadata);

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

  const Icon = position?.icon;
  const ratingHexagonPoints = getPlayerRatingHexagonPoints(player);

  return (
    <div className="max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-6 lg:py-8">
      {/* Volver */}
      <Link
        to={ROUTES.TEAM}
        className="items-center gap-2 text-sm text-violet-700 hover:text-violet-950 mb-4 hidden sm:inline-flex"
      >
        <FaArrowLeft /> Volver al plantel
      </Link>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-7">
        <div className="min-w-0">
          <div ref={detailCardRef} className="border border-neutral-800 bg-neutral-900">
            <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* IMAGEN */}
          <div className="w-full aspect-3/4">
            <ProgressiveMedia
              src={getImageUrl(player.imageUrl, {
                width: 720,
                height: 960,
                fit: "crop",
                quality: 72,
              })}
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
            <div className="relative bg-violet-900 text-violet-50 p-5 sm:p-6 lg:p-6 flex flex-1 flex-col justify-center">
              {ratingHexagonPoints && (
                <div className="absolute right-3 top-3 z-10 flex w-28 flex-col items-center gap-2 sm:right-5 sm:top-5 sm:w-32 lg:w-27 xl:w-33">
                  <Button
                    variant="toggle2"
                    active={showRatingsHexagon}
                    aria-pressed={showRatingsHexagon}
                    aria-label={
                      showRatingsHexagon
                        ? "Ocultar valoraciones"
                        : "Mostrar valoraciones"
                    }
                    className="px-2.5 py-1 text-[0.65rem] sm:px-3 sm:text-xs"
                    onClick={() =>
                      setShowRatingsHexagon((currentValue) => !currentValue)
                    }
                  >
                    <span>
                      {showRatingsHexagon ? "Ocultar stats" : "Mostrar stats"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-0 w-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent border-t-current transition-transform duration-300 ${
                        showRatingsHexagon ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  <div
                    aria-hidden={!showRatingsHexagon}
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      showRatingsHexagon
                        ? "max-h-36 opacity-100 translate-y-0 scale-100 sm:max-h-40"
                        : "max-h-0 opacity-0 -translate-y-1 scale-95"
                    }`}
                  >
                    <PlayerRatingsHexagon points={ratingHexagonPoints} />
                  </div>
                </div>
              )}

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

              <DominantFootIndicator dominantFoot={player.dominantFoot} />
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
                  PARTIDOS ({year})
                </p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {player.matchesPlayedThisYear ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-neutral-400">
                  FECHA DE NACIMIENTO
                </p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {formatLongDate(player.birthDate)}
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
            </div>
          </div>
            </div>
          </div>
        </div>

        <RosterNavigation
          desktopMaxHeight={detailCardHeight}
          items={rosterItems}
          renderCard={(item) =>
            item.kind === "player" ? (
              <PlayerCard player={item.member} />
            ) : (
              <StaffCard staffMember={item.member} />
            )
          }
        />
      </div>
    </div>
  );
};

export default PlayerDetail;
