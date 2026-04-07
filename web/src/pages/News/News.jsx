import NewsBentoGrid from "../../features/news/NewsBentoGrid/NewsBentoGrid";
import NewsList from "../../features/news/NewsList/NewsList";
import Loader from "../../components/Loader/Loader";

import { useNewsData } from "./hooks/useNewsData";
import { splitNewsForPage } from "./newsPage.utils";

const News = () => {
  const { news, loading, error } = useNewsData();

  if (loading) return <Loader />;
  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="rounded-md border border-red-500/40 bg-red-900/20 p-4 text-red-100">
          No se pudieron cargar las noticias. Intentá nuevamente en unos minutos.
        </p>
      </main>
    );
  }

  const { featured, list } = splitNewsForPage(news);

  return (
    <main className="news-page">
      {/* HERO */}
      <section className="bento-wrapper bg-neutral-900 shadow-lg shadow-black/30 pt-8 pb-16 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24">
        <div className="background"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <NewsBentoGrid items={featured} />
        </div>
      </section>

      {/* LISTA */}
      <section className="border-t border-violet-700 py-10 md:py-14 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <NewsList items={list} />
        </div>
      </section>
    </main>
  );
};

export default News;
