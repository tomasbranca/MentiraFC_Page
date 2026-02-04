import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "../../../components/Button/Button";

const NewsList = ({ items }) => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!items || items.length === 0) return null;

  const visibleNews = items.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6 my-10 mx-16">
      {visibleNews.map((item) => (
        <Link
          key={item._id}
          to={`/noticias/${item.slug.current}`}
          className="
            group flex w-full bg-white
            border border-gray-200
            hover:border-violet-600
            transition-colors
          "
        >
          {/* Imagen */}
          <div
            className="relative w-1/4 min-h-[160px] bg-cover bg-center"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Contenido */}
          <div className="flex flex-col justify-between px-6 py-5 w-3/4">
            <div className="max-w-3xl">
              <h3 className="
                text-2xl font-extrabold uppercase
                text-violet-900 leading-tight
              ">
                {item.title}
              </h3>

              <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>

            <span className="mt-4 text-xs tracking-wide text-gray-500 uppercase">
              {new Date(item.date).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}

      {visibleCount < items.length && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => setVisibleCount(visibleCount + 3)}>
            Cargar más noticias
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsList;
