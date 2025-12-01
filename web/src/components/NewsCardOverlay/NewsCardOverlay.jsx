import { Link } from "react-router-dom";
import "./NewsCardOverlay.css"

const NewsCardOverlay = ({item}) => {
  return (
    <Link to={`/noticias/${item._id}`} className="news-card-wrapper">
      <div
        className="news-card-image"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      >
        <div className="news-card-overlay">
          <h3 className="news-card-title text-violet-50">{item.title}</h3>
        </div>
      </div>
    </Link>
  );
};

export default NewsCardOverlay;
