import { Link } from "react-router-dom";
import { getImageUrl } from "../../../data/imageService";
import type { StaffMember } from "../../../types/models";
import ProgressiveMedia from "../ProgressiveMedia/ProgressiveMedia";
import { getStaffLink } from "./staffCard.utils";

type StaffCardProps = {
  staffMember: StaffMember | null;
};

const StaffCard = ({ staffMember }: StaffCardProps) => {
  if (!staffMember) return null;

  return (
    <Link to={getStaffLink(staffMember)} className="group block no-underline">
      <div
        className="
        relative
        w-full
        aspect-3/4
        overflow-hidden
        bg-neutral-950
        shadow-xl
        transition-all duration-300
        group-hover:shadow-2xl
      "
      >
        <div className="absolute top-3 left-3 z-30 max-w-[75%] select-none">
          <span
            className="block text-xs sm:text-sm font-black uppercase leading-tight text-white wrap-break-word"
            style={{
              textShadow: `
                0 3px 8px rgba(0,0,0,.9),
                0 0 16px rgba(0,0,0,.6)
              `,
            }}
          >
            {staffMember.role}
          </span>
        </div>

        <ProgressiveMedia
          src={getImageUrl(staffMember.imageUrl, {
            width: 420,
            height: 560,
            fit: "crop",
            quality: 68,
            autoFormat: true,
          })}
          alt={`${staffMember.name} ${staffMember.lastName}`}
          wrapperClassName="absolute inset-0 z-10"
          className="
            absolute inset-0
            object-cover
            transition-transform duration-500
            group-hover:scale-105
          "
          width={420}
          height={560}
          loading="lazy"
          decoding="async"
          skeletonClassName="bg-neutral-900"
        />

        <div
          className="
          absolute inset-0 z-20
          bg-linear-to-t
          from-neutral-950 via-neutral-950/40 to-violet-900/20
        "
        />

        <div className="absolute bottom-0 left-0 z-30 w-full px-3 pb-4">
          <div className="flex flex-col leading-none">
            <span className="text-[8px] sm:text-xs font-semibold tracking-[0.25em] text-violet-300 uppercase">
              {staffMember.name}
            </span>

            <span
              className="mt-1 text-l sm:text-2xl font-black uppercase text-violet-50"
              style={{ textShadow: "1px 2px 0 #000" }}
            >
              {staffMember.lastName}
            </span>

            <div className="mt-1 h-0.5 w-10 bg-violet-500 rounded-full" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StaffCard;
