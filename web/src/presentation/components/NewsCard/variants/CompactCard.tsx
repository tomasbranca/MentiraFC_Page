// @ts-nocheck
import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../../data/imageService";
import { getNewsLink } from "../../../utils/navigation.utils";

const CompactCard = ({ item, imageLoading = "lazy", imagePriority = false }) => {
  return (
    <Link to={getNewsLink(item)} className="news-card-compact block h-full">
      <article className="news-card-image animation-shadow h-full">
        <img
          src={getImageUrl(item.imageUrl, {
            width: 720,
            height: 540,
            fit: "crop",
            quality: 70,
            autoFormat: true,
          })}
          srcSet={getImageSrcSet(item.imageUrl, [360, 540, 720], {
            height: 540,
            fit: "crop",
            quality: 70,
            autoFormat: true,
          })}
          sizes="(max-width: 768px) 100vw, 33vw"
          alt={item.title}
          className="news-card-media"
          loading={imageLoading}
          {...(typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox")
            ? {}
            : { fetchPriority: imagePriority ? "high" : "auto" })}
          decoding="async"
          width="1200"
          height="900"
        />
        <div className="news-card-overlay">
          <h3 className="news-card-title text-violet-50">{item.title}</h3>
        </div>
      </article>
    </Link>
  );
};

export default CompactCard;
