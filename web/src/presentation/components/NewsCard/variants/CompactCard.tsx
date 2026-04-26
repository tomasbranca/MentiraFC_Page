// @ts-nocheck
import { Link } from "react-router-dom";
import { getNewsLink } from "../../../utils/navigation.utils";

const CompactCard = ({ item, imageLoading = "lazy", imagePriority = false }) => {
  return (
    <Link to={getNewsLink(item)} className="news-card-compact block h-full">
      <article className="news-card-image animation-shadow h-full">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="news-card-media"
          loading={imageLoading}
          fetchpriority={imagePriority ? "high" : "auto"}
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
