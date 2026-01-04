import { Link } from "react-router-dom";
import "./NewsCardHome.css"

const NewsCardHome = ({item}) => {
  return (
    <Link to={`/noticias/${item.slug.current}`} className="news-card-wrapper animation-shadow">
      <article
        className="news-card-image"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      >
        <div className="news-card-overlay">
          <h3 className="news-card-title text-violet-50">{item.title}</h3>
        </div>
      </article>
    </Link>
  );
};

export default NewsCardHome;
