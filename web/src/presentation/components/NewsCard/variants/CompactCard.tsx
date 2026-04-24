// @ts-nocheck
import { Link } from "react-router-dom";
import { getNewsLink } from "../../../utils/navigation.utils";

const CompactCard = ({ item }) => {
  return (
    <Link to={getNewsLink(item)} className="news-card-compact block h-full">
      <article
        className="news-card-image animation-shadow h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${item.imageUrl})` }}
      >
        <div className="news-card-overlay">
          <h3 className="news-card-title text-violet-50">{item.title}</h3>
        </div>
      </article>
    </Link>
  );
};

export default CompactCard;
