import { Link } from "react-router-dom";
import "./NewsCardOverlay.css"

const NewsCardOverlay = ({ id, title, imageUrl }) => {
  return (
    <Link to={`/noticias/${id}`} className="news-card-wrapper">
      <div
        className="news-card-image"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className="news-card-overlay">
          <h3 className="news-card-title text-violet-50">{title}</h3>
        </div>
      </div>
    </Link>
  );
};

export default NewsCardOverlay;
