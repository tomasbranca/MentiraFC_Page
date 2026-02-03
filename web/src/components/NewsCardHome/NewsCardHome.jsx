import { Link } from "react-router-dom";
import "./NewsCardHome.css";

const NewsCardHome = ({ item }) => {
  return (
    <Link
      to={`/noticias/${item.slug.current}`}
      className="group block h-[320px] overflow-hidden shadow-md hover:shadow-xl transition-shadow"
    >
      <article
        className="news-card-image"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      >
        <div className="news-card-overlay">
          <h3 className="news-card-title">
            {item.title}
          </h3>
        </div>
      </article>
    </Link>
  );
};

export default NewsCardHome;
