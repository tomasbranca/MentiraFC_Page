import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNewsBySlug } from "../../lib/sanity";
import { PortableText } from "@portabletext/react";
import Loader from "../../components/Loader/Loader";

const NewsDetail = () => {
  const { slug } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsBySlug(slug)
      .then((data) => setNewsItem(data))
      .finally(() => setLoading(false));
  }, [slug]);

  /* LOADER */
  if (loading) return <Loader />;

  /* EMPTY / NOT FOUND */
  if (!newsItem) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
        No se encontró la noticia
      </div>
    );
  }

  return (
    <article className="news-detail w-full">
      {/* HERO */}
      <header
        className="relative w-full h-[60vh] flex items-end"
        style={{
          backgroundImage: `url(${newsItem.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/90 via-violet-950/40 to-transparent border-b-2 border-violet-700" />

        <div className="relative z-10 max-w-5xl px-6 pb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-violet-50 leading-tight">
            {newsItem.title}
          </h1>
        </div>
      </header>

      {/* METADATA */}
      <section className="max-w-3xl mx-auto px-6 mt-8">
        <p className="text-sm text-neutral-500">
          {new Date(newsItem.date).toLocaleDateString("es-AR")}
        </p>

        {newsItem.description && (
          <p className="mt-4 text-lg font-medium text-neutral-800">
            {newsItem.description}
          </p>
        )}
      </section>

      {/* CONTENT */}
      <section className="max-w-3xl mx-auto px-6 mt-10 mb-20 prose prose-neutral">
        <PortableText value={newsItem.content} />
      </section>
    </article>
  );
};

export default NewsDetail;
