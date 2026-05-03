import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaUserTie } from "react-icons/fa";

import { getImageUrl } from "../../../data/imageService";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import PlayerCard from "../../components/PlayerCard/PlayerCard";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";
import RosterNavigation from "../../components/RosterNavigation/RosterNavigation";
import { buildRosterNavigationItems } from "../../components/RosterNavigation/rosterNavigation.utils";
import StaffCard from "../../components/StaffCard/StaffCard";
import { ROUTES } from "../../constants/routes.constants";
import {
  buildMissingStaffHead,
  buildStaffHead,
  STATIC_PAGE_HEAD,
} from "../../seo/metadata";
import { usePageHead } from "../../seo/usePageHead";
import { useElementHeight } from "../../hooks/useElementHeight";
import { useRosterMembers } from "../../hooks/queries/useRosterMembers";
import { calculateAge, formatLongDate } from "../../utils/date.utils";
import { useStaffDetail } from "./hooks/useStaffDetail";

const StaffDetail = () => {
  const { slug } = useParams();
  const { height: detailCardHeight, ref: detailCardRef } =
    useElementHeight<HTMLDivElement>();
  const { staffMember, loading, error, refetch } = useStaffDetail(slug);
  const { players, staffMembers } = useRosterMembers("StaffDetail");
  const metadata = useMemo(
    () =>
      loading
        ? STATIC_PAGE_HEAD.team
        : staffMember
          ? buildStaffHead(staffMember)
          : buildMissingStaffHead(slug),
    [loading, slug, staffMember]
  );
  const rosterItems = useMemo(
    () =>
      buildRosterNavigationItems({
        activeStaffMember: staffMember,
        players,
        staffMembers,
      }),
    [players, staffMember, staffMembers]
  );

  usePageHead(metadata);

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudo cargar el integrante del staff"
        message="Intenta nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  if (!staffMember) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-500">
        Integrante del staff no encontrado
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto md:px-4 sm:px-6 lg:px-8 md:py-6 lg:py-8">
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
          <div className="w-full aspect-3/4">
            <ProgressiveMedia
              src={getImageUrl(staffMember.imageUrl, {
                width: 720,
                height: 960,
                fit: "crop",
                quality: 72,
              })}
              alt={`${staffMember.name} ${staffMember.lastName}`}
              wrapperClassName="w-full h-full"
              className="w-full h-full object-cover border-b-2 border-violet-700 lg:border-0"
              skeletonClassName="bg-neutral-800"
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="flex flex-col">
            <div className="bg-violet-900 text-violet-50 p-5 sm:p-6 lg:p-8 flex flex-1 flex-col justify-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 leading-tight">
                {staffMember.name.toUpperCase()}
                <br />
                <span className="font-black">
                  {staffMember.lastName.toUpperCase()}
                </span>
              </h1>

              <p className="mt-3 text-xs tracking-widest text-violet-200 flex items-center gap-2 uppercase">
                <FaUserTie className="text-sm" />
                {staffMember.role}
              </p>
            </div>

            <div className="bg-neutral-900 text-violet-50 grid grid-cols-2 gap-5 sm:gap-6 p-5 sm:p-6 lg:p-8">
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">EDAD</p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {calculateAge(staffMember.birthDate)} años
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-neutral-400">ROL</p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {staffMember.role}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs sm:text-sm text-neutral-400">
                  FECHA DE NACIMIENTO
                </p>
                <p className="font-semibold text-sm sm:text-lg lg:text-base">
                  {formatLongDate(staffMember.birthDate)}
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

export default StaffDetail;
