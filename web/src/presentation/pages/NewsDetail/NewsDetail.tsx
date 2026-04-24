// @ts-nocheck
import { useParams } from "react-router-dom";
import { PortableText } from "@portabletext/react";

import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import NewsCard from "../../components/NewsCard/NewsCard";

import { useNewsDetail } from "./hooks/useNewsDetail";
import { formatDate } from "../../utils/date.utils";

const portableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 text-base md:text-lg leading-relaxed text-neutral-200 whitespace-pre-line">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="mb-4 text-3xl md:text-4xl font-extrabold normal-case text-white leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 text-2xl md:text-3xl font-bold normal-case text-white leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 text-xl md:text-2xl font-bold normal-case text-white leading-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-3 text-lg md:text-xl font-semibold normal-case text-white leading-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-violet-500 pl-4 italic text-neutral-300 whitespace-pre-line">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 ml-6 list-disc space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
    number: ({ children }) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
  },
  hardBreak: () => <br />,
};

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
          backgroundImage: `url(${newsItem.imageUrl})`,
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
        <PortableText
          value={newsItem.content}
          components={portableTextComponents}
        />
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
