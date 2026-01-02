import "./NewsCard.css";
import { Link } from "react-router-dom";

const NewsCard = ({ item, variant }) => {
  if (!item) return null;

  switch (variant) {
    case "hero":
      return (
        <Link
          to={`/news/${item.slug}`}
          className="news-card-hero grid grid-cols-12 size-full"
        >
          <div
            className="col-span-8 animation-shadow"
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="col-span-4 flex items-center justify-center relative">
            <div className="bg-violet-50 h-3/4 w-full absolute right-16 flex flex-col justify-center p-4">
              <p>{new Date(item.date).toLocaleDateString()}</p>
              <h2 className="text-violet-900">{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </div>
        </Link>
      );

    case "featuredBox":
      return (
        <Link
          to={`/news/${item.slug}`}
          className="animation-shadow news-card-featured-box grid grid-rows-5 size-full"
        >
          <div
            className="row-span-3"
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="bg-violet-50 row-span-2 flex flex-col justify-center p-2">
            <h3 className="text-violet-900">{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </Link>
      );

    case "featuredWide":
      return (
        <Link
          to={`/news/${item.slug}`}
          className="animation-shadow news-card-featured-wide size-full block relative overflow-hidden"
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="news-card-featured-overlay absolute left-0 bottom-0 p-4">
            <div className="news-card-content bg-violet-50 p-2 mb-4">
              <h3 className="text-violet-900"> {item.title} </h3>
            </div>
            <div className="news-card-description">
              <p className="text-violet-50">{item.description}</p>
            </div>
          </div>
        </Link>
      );

    case "compact":
      return (
        <Link to={`/news/${item.slug}`} className="news-card-compact">
          <article
            className="news-card-image animation-shadow"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          >
            <div className="news-card-overlay">
              <h3 className="news-card-title text-violet-50">{item.title}</h3>
            </div>
          </article>
        </Link>
      );

    default:
      return null;
  }
};

export default NewsCard;
