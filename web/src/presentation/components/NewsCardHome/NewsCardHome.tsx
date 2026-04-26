// @ts-nocheck
import { Link } from "react-router-dom";
import "./NewsCardHome.css";
import { getFeaturedClasses } from "./newsCardHome.utils";
import { getNewsLink } from "../../utils/navigation.utils";

const NewsCardHome = ({ item, featured, priority = false }) => {
  if (!item) return null;

  return (
    <Link
      to={getNewsLink(item)}
      className={`
        group block overflow-hidden
        shadow-md hover:shadow-xl transition-shadow
      
        aspect-4/3
        sm:aspect-video
      
        ${getFeaturedClasses(featured)}
      `}
    >
      <article className="news-card-image">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="news-card-media"
          loading={priority ? "eager" : "lazy"}
          fetchpriority={priority ? "high" : "auto"}
          decoding="async"
          width="1200"
          height="900"
        />
        <div className="news-card-overlay">
          <h3
            className={`news-card-title ${
              featured ? "news-card-title-featured" : ""
            }`}
          >
            {item.title}
          </h3>
        </div>
      </article>
    </Link>
  );
};

export default NewsCardHome;
