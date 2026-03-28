import { useParams } from "react-router-dom";
import { PortableText } from "@portabletext/react";

import Loader from "../../components/Loader/Loader";
import NewsCard from "../../components/NewsCard/NewsCard";

import { useNewsDetail } from "./hooks/useNewsDetail";
import { formatDate } from "../../utils/date.utils";

const NewsDetail = () => {
  const { slug } = useParams();

  const { newsItem, suggested, loading } =
    useNewsDetail(slug);

  if (loading) return <Loader />;

  if (!newsItem) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-neutral-400">
        <p>No se encontró la noticia</p>
      </div>
    );
  }

  return (
    <article className="w-full bg-neutral-900 text-neutral-200">
      {/* HERO */}
      <header
        className="relative w-full flex items-end h-[35vh] md:h-[45vh] lg:h-[60vh] border-b-2 border-violet-700"
        style={{
          backgroundImage: `url(${newsItem.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-black/50 to-transparent" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 md:px-6 pb-6 md:pb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
            {newsItem.title}
          </h1>
        </div>
      </header>

      {/* INFO */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 mt-6 md:mt-10">
        <p className="text-xs md:text-sm text-neutral-500">
          {formatDate(newsItem.date)}
        </p>

        {newsItem.description && (
          <p className="mt-3 md:mt-4 text-base md:text-lg font-medium text-neutral-300 leading-relaxed">
            {newsItem.description}
          </p>
        )}
      </section>

      {/* CONTENT */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 mt-8 md:mt-10 mb-16 md:mb-20 prose prose-invert">
        <PortableText value={newsItem.content} />
      </section>

      {/* SUGERIDAS */}
      {suggested.length >= 3 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-white">
            Más noticias
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {suggested.map((item) => (
              <div
                key={item._id}
                className="min-w-[260px] md:min-w-0 h-[180px]"
              >
                <NewsCard item={item} variant="compact" />
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default NewsDetail;