// @ts-nocheck
import { Link } from "react-router-dom";
import { getNewsLink } from "../../../utils/navigation.utils";

const FeaturedWideCard = ({ item }) => {
  return (
    <Link
      to={getNewsLink(item)}
      className="animation-shadow news-card-featured-wide relative w-full h-full overflow-hidden flex flex-col"
    >
      <div
        className="w-full h-55 md:absolute md:inset-0 md:h-full"
        style={{
          backgroundImage: `url(${item.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="bg-neutral-950 p-4 md:hidden">
        <h3 className="text-violet-800 font-semibold mb-1">{item.title}</h3>

        <p className="text-sm text-violet-50 line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="hidden md:flex absolute inset-0 flex-col justify-end p-4 z-10 news-card-featured-overlay">
        <div className="news-card-inner">
          <div className="news-card-content bg-violet-950 p-3 mb-2">
            <h3 className="text-violet-50 font-medium leading-snug line-clamp-2">
              {item.title}
            </h3>
          </div>

          <div className="news-card-description">
            <p className="text-violet-50 text-sm line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedWideCard;
