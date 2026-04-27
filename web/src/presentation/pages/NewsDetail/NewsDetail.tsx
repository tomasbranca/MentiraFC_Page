// @ts-nocheck
import { Suspense, lazy } from "react";
import { useParams } from "react-router-dom";

import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import NewsCard from "../../components/NewsCard/NewsCard";

import { getImageUrl } from "../../../data/imageService";
import { useNewsDetail } from "./hooks/useNewsDetail";
import { formatDate } from "../../utils/date.utils";

const NewsRichContent = lazy(() => import("./NewsRichContent"));

const NewsDetail = () => {
  const { slug } = useParams();

  const { newsItem, suggested, loading, error, refetch } = useNewsDetail(slug);

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudo cargar la noticia"
        message="Intentá nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

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
          backgroundImage: `url(${getImageUrl(newsItem.imageUrl, {
            width: 1600,
            height: 900,
            fit: "crop",
            quality: 72,
            autoFormat: true,
          })})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-violet-950 via-black/50 to-transparent" />

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
      <section className="max-w-3xl mx-auto px-4 md:px-6 mt-8 md:mt-10 mb-16 md:mb-20">
        <Suspense
          fallback={
            <p className="text-sm md:text-base text-neutral-400 animate-pulse">
              Cargando contenido…
            </p>
          }
        >
          <NewsRichContent content={newsItem.content} />
        </Suspense>
      </section>

      {/* SUGERIDAS */}
      {suggested.length >= 3 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-white">
            Más noticias
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
            {suggested.map((item) => (
              <div key={item.id} className="min-w-65 md:min-w-0 h-45">
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
