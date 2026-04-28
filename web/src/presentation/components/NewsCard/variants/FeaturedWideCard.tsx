// @ts-nocheck
import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../../data/imageService";
import { getNewsLink } from "../../../utils/navigation.utils";

const FeaturedWideCard = ({ item, imageLoading = "lazy", imagePriority = false }) => {
  return (
    <Link
      to={getNewsLink(item)}
      className="animation-shadow news-card-featured-wide relative w-full h-full overflow-hidden flex flex-col"
    >
      <img
        src={getImageUrl(item.imageUrl, {
          width: 1200,
          height: 675,
          fit: "crop",
          quality: 70,
          autoFormat: true,
        })}
        srcSet={getImageSrcSet(item.imageUrl, [640, 960, 1200], {
          height: 675,
          fit: "crop",
          quality: 70,
          autoFormat: true,
        })}
        sizes="(max-width: 768px) 100vw, 66vw"
        alt={item.title}
        className="w-full h-55 md:absolute md:inset-0 md:h-full object-cover"
        loading={imageLoading}
            {...(HTMLImageElement.prototype.hasOwnProperty('fetchPriority') && {
              fetchPriority: imagePriority ? "high" : "auto",
            })}
        decoding="async"
        width="1600"
        height="900"
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
