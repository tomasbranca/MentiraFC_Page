import { Link } from "react-router-dom";
import "./NewsCardHome.css";
import { getFeaturedClasses } from "./newsCardHome.utils";
import { getNewsLink } from "../../utils/navigation.utils";

const NewsCardHome = ({ item, featured }) => {
  if (!item) return null;

  return (
    <Link
      to={getNewsLink(item)}
      className={`
        group block overflow-hidden
        shadow-md hover:shadow-xl transition-shadow
      
        aspect-[4/3]
        sm:aspect-[16/9]
      
        ${getFeaturedClasses(featured)}
      `}
    >
      <article
        className="news-card-image"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      >
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