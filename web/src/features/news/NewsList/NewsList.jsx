import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "../../../components/Button/Button";

const NewsList = ({ items }) => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!items || items.length === 0) return null;

  const visibleNews = items.slice(0, visibleCount);

  return (
    <section className="max-w-7xl mx-auto px-4">

      {/* Título */}
      <div className="mb-8">
        <h2 className="text-violet-900 font-bold uppercase tracking-wide">
          Últimas noticias
        </h2>

        <div className="w-16 h-1 bg-violet-800 mt-2"></div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-6">
        {visibleNews.map((item) => (
          <Link
            key={item._id}
            to={`/noticias/${item.slug.current}`}
            className="
              group
              flex flex-col
              md:flex-row
              w-full
              bg-white
              border border-gray-200
              hover:border-violet-600
              transition-colors
              overflow-hidden
            "
          >

            {/* Imagen */}
            <div
              className="
                relative
                w-full
                h-[200px]

                md:w-1/4
                md:h-auto
                md:min-h-[120px]

                bg-cover
                bg-center
              "
              style={{ backgroundImage: `url(${item.imageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Contenido */}
            <div className="
              flex flex-col justify-between
              px-5 py-4
              w-full
              md:w-3/4
            ">
              <div className="max-w-3xl">

                <h3
                  className="
                  text-lg
                  md:text-xl
                  font-extrabold
                  uppercase
                  text-violet-900
                  leading-tight
                "
                >
                  {item.title}
                </h3>

                <p className="
                  mt-2
                  text-gray-700
                  text-sm
                  leading-relaxed
                  line-clamp-3
                ">
                  {item.description}
                </p>

              </div>

              <span className="
                mt-4
                text-xs
                tracking-wide
                text-gray-500
                uppercase
              ">
                {new Date(item.date).toLocaleDateString()}
              </span>
            </div>

          </Link>
        ))}
      </div>

      {/* Botón */}
      {visibleCount < items.length && (
        <div className="flex justify-center pt-10">
          <Button onClick={() => setVisibleCount(visibleCount + 3)}>
            Cargar más noticias
          </Button>
        </div>
      )}
    </section>
  );
};

export default NewsList;