// @ts-nocheck
import { Link } from "react-router-dom";
import { getNewsLink } from "../../../utils/navigation.utils";
import { formatDate } from "../../../utils/date.utils";

const HeroCard = ({ item, imageLoading = "lazy", imagePriority = false }) => {
  return (
    <Link
      to={getNewsLink(item)}
      className="
        news-card-hero
        flex flex-col
        md:grid md:grid-cols-12
        size-full
        relative
        overflow-hidden
      "
    >
      <div className="w-full h-55 md:h-auto md:col-span-8 animation-shadow relative overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading={imageLoading}
          fetchpriority={imagePriority ? "high" : "auto"}
          decoding="async"
          width="1600"
          height="900"
        />
      </div>

      <div className="md:col-span-4 relative flex">
        <div className="bg-neutral-950 p-5 flex flex-col shadow-lg w-full md:absolute md:-left-16 md:bottom-10 md:w-auto">
          <p className="text-xs uppercase opacity-60 mb-1 text-violet-50">
            {formatDate(item.date)}
          </p>

          <h2 className="text-violet-800 text-xl font-semibold leading-tight mb-2">
            {item.title}
          </h2>

          <p className="text-sm text-violet-50 opacity-80 line-clamp-3">
            {item.description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default HeroCard;
