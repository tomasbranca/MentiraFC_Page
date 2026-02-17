import { Link } from "react-router-dom";
import "./NewsCardHome.css";

const NewsCardHome = ({ item, featured }) => {
  return (
    <Link
      to={`/noticias/${item.slug.current}`}
      className={`
        group block overflow-hidden
        shadow-md hover:shadow-xl transition-shadow
      
        aspect-[4/3]                 /* mobile */
        sm:aspect-[16/9]              /* tablet */
      
        ${featured ? "sm:col-span-2 lg:col-span-1" : ""}
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
