import "./NewsCard.css";
import { Link } from "react-router-dom";

const NewsCard = ({ item, variant }) => {
  if (!item) return null;

  switch (variant) {
    case "hero":
      return (
        <Link
          key={item._id}
          to={`/noticias/${item.slug.current}`}
          className="
      news-card-hero
      flex flex-col
      md:grid md:grid-cols-12
      size-full
      relative
      overflow-hidden
    "
        >
          {/* Imagen */}
          <div
            className="
        w-full
        h-[220px]
        md:h-auto
        md:col-span-8
        animation-shadow
      "
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Columna para posicionamiento en desktop */}
          <div className="md:col-span-4 relative flex">
            {/* Caja de texto */}
            <div
              className="
              bg-neutral-950
                p-5
                flex flex-col
                shadow-lg
                w-full

                md:absolute
                md:left-[-4rem]
                md:bottom-10
                md:w-auto
              "
            >
              <p className="text-xs uppercase opacity-60 mb-1 text-violet-50">
                {new Date(item.date).toLocaleDateString()}
              </p>

              <h2 className="text-violet-800 text-xl font-semibold leading-tight mb-2">
                {item.title}
              </h2>

              <p className="text-sm text-violet-50 opacity-80 line-clamp-3">
                {item.description}
              </p>
            </div>
          </div>
        </Link>
      );

    case "featuredBox":
      return (
        <Link
          key={item._id}
          to={`/noticias/${item.slug.current}`}
          className="
          animation-shadow
          news-card-featured-box
          grid
          grid-rows-5
          size-full
          overflow-hidden
        "
        >
          <div
            className="row-span-3"
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="bg-neutral-950 row-span-2 flex flex-col justify-center px-4 py-4">
            <h3 className="text-violet-800 font-medium leading-snug line-clamp-2 mb-1">
              {item.title}
            </h3>

            <p className="text-sm opacity-80 line-clamp-2 text-violet-50">
              {item.description}
            </p>
          </div>
        </Link>
      );

    case "featuredWide":
      return (
        <Link
          key={item._id}
          to={`/noticias/${item.slug.current}`}
          className="
            animation-shadow
            news-card-featured-wide
            w-full
            h-full
            overflow-hidden
            flex flex-col
    
            md:block
            md:relative
          "
        >
          {/* Imagen */}
          <div
            className="
              w-full
              h-[220px]
    
              md:absolute
              md:inset-0
              md:h-full
            "
            style={{
              backgroundImage: `url(${item.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* MOBILE (card normal) */}
          <div className="bg-neutral-950 p-4 md:hidden">
            <h3 className="text-violet-800 font-semibold mb-1">{item.title}</h3>

            <p className="text-sm text-violet-50 line-clamp-2">
              {item.description}
            </p>
          </div>

          {/* TABLET + DESKTOP OVERLAY */}
          <div className="
            hidden md:flex lg:flex
            news-card-featured-overlay
            absolute
            left-0
            bottom-0
            p-4
            w-full
            flex-col
          ">
            <div className="
              news-card-content
              bg-violet-950
              p-3
              mb-3
              md:transform-none
            ">
              <h3 className="text-violet-50 font-medium leading-snug line-clamp-2">
                {item.title}
              </h3>
            </div>

            <div className="news-card-description">
              <p className="text-violet-50 text-sm line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        </Link>
      );

    case "compact":
      return (
        <Link
          to={`/noticias/${item.slug.current}`}
          className="news-card-compact block h-full"
          key={item._id}
        >
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

    default:
      return null;
  }
};

export default NewsCard;
